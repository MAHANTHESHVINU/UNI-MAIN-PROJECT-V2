import os
import time
import logging
import requests
import yt_dlp

from azure.identity import DefaultAzureCredential

logger = logging.getLogger("video_indexer")


class VideoIndexerService:

    def __init__(self):
        self.account_id = os.getenv("AZURE_VI_ACCOUNT_ID")
        self.location = os.getenv("AZURE_VI_LOCATION")
        self.subscription_id = os.getenv("AZURE_SUBSCRIPTION_ID")
        self.resource_group = os.getenv("AZURE_VI_RESOURCE_GROUP")
        self.vi_name = os.getenv("AZURE_VI_NAME")

        self.credential = DefaultAzureCredential()

    def get_arm_access_token(self):
        """Generate an Azure Resource Manager access token."""

        try:
            token_object = self.credential.get_token(
                "https://management.azure.com/.default"
            )

            return token_object.token

        except Exception as e:
            logger.error(f"Failed to get Azure ARM token: {e}")
            raise

    def get_account_access_token(self, arm_access_token):
        """Exchange ARM token for an Azure Video Indexer account token."""

        url = (
            f"https://management.azure.com/subscriptions/"
            f"{self.subscription_id}"
            f"/resourceGroups/{self.resource_group}"
            f"/providers/Microsoft.VideoIndexer/accounts/{self.vi_name}"
            f"/generateAccessToken?api-version=2024-01-01"
        )

        headers = {
            "Authorization": f"Bearer {arm_access_token}"
        }

        payload = {
            "permissionType": "Contributor",
            "scope": "Account"
        }

        response = requests.post(
            url,
            headers=headers,
            json=payload
        )

        if response.status_code != 200:
            raise Exception(
                f"Failed to get VI Account Token: {response.text}"
            )

        return response.json()["accessToken"]

    def download_youtube_video(
        self,
        url,
        output_path="temp_video.mp4"
    ):
        """Download a YouTube video to a local file."""

        if not url:
            raise ValueError("YouTube URL is empty.")

        if "youtube.com" not in url and "youtu.be" not in url:
            raise ValueError(
                "Please provide a valid YouTube URL."
            )

        logger.info(f"Downloading YouTube video: {url}")

        ydl_opts = {
            "format": "bv*+ba/b",
            "outtmpl": output_path,
            "merge_output_format": "mp4",
            "remote_components":["ejs:github"],
            "quiet": False,
            "no_warnings": False,

            "continuedl": False,
        }

        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([url])

            logger.info("Download complete.")

            return output_path

        except Exception as e:
            logger.error(f"YouTube download failed: {e}")
            raise

    def upload_video(self, video_path, video_name):
        """Upload a local file to Azure Video Indexer."""

        arm_token = self.get_arm_access_token()

        vi_token = self.get_account_access_token(
            arm_token
        )

        api_url = (
            f"https://api.videoindexer.ai/"
            f"{self.location}/Accounts/"
            f"{self.account_id}/Videos"
        )

        params = {
            "accessToken": vi_token,
            "name": video_name,
            "privacy": "Private",
            "indexingPreset": "Default",
        }

        logger.info(
            f"Uploading file {video_path} to Azure..."
        )

        with open(video_path, "rb") as video_file:

            files = {
                "file": video_file
            }

            response = requests.post(
                api_url,
                params=params,
                files=files
            )

        if response.status_code not in (200, 201):
            raise Exception(
                f"Azure Upload Failed: {response.text}"
            )

        return response.json().get("id")

    def wait_for_processing(self, video_id):
        """Poll Azure Video Indexer until processing completes."""

        logger.info(
            f"Waiting for video {video_id} to process..."
        )

        while True:

            arm_token = self.get_arm_access_token()

            vi_token = self.get_account_access_token(
                arm_token
            )

            url = (
                f"https://api.videoindexer.ai/"
                f"{self.location}/Accounts/"
                f"{self.account_id}/Videos/"
                f"{video_id}/Index"
            )

            params = {
                "accessToken": vi_token
            }

            response = requests.get(
                url,
                params=params
            )

            if response.status_code != 200:
                raise Exception(
                    f"Video Indexer status request failed: "
                    f"{response.text}"
                )

            data = response.json()

            state = data.get("state")

            if state == "Processed":
                logger.info("Video processing completed.")

                return data

            if state == "Failed":
                raise Exception(
                    "Video Indexing Failed in Azure."
                )

            if state == "Quarantined":
                raise Exception(
                    "Video Quarantined."
                )

            logger.info(
                f"Status: {state}... waiting 30 seconds"
            )

            time.sleep(30)

    def extract_data(self, vi_json):
        """Parse Video Indexer JSON into application state."""

        transcript_lines = []

        for video in vi_json.get("videos", []):

            insights = video.get(
                "insights",
                {}
            )

            for item in insights.get(
                "transcript",
                []
            ):
                text = item.get("text")

                if text:
                    transcript_lines.append(text)

        ocr_lines = []

        for video in vi_json.get("videos", []):

            insights = video.get(
                "insights",
                {}
            )

            for item in insights.get(
                "ocr",
                []
            ):
                text = item.get("text")

                if text:
                    ocr_lines.append(text)

        return {
            "transcript": " ".join(
                transcript_lines
            ),

            "ocr_text": ocr_lines,

            "video_metadata": {
                "duration": (
                    vi_json
                    .get("summarizedInsights", {})
                    .get("duration", {})
                    .get("seconds")
                ),

                "platform": "youtube"
            }
        }