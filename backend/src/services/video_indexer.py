
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

    # =========================================================
    # AZURE AUTHENTICATION
    # =========================================================

    def get_arm_access_token(self):
        """Generate an Azure Resource Manager access token."""

        try:
            token_object = self.credential.get_token(
                "https://management.azure.com/.default"
            )

            return token_object.token

        except Exception as e:
            logger.error(
                f"Failed to get Azure ARM token: {e}"
            )
            raise

    def get_account_access_token(self, arm_access_token):
        """Exchange ARM token for an Azure Video Indexer account token."""

        url = (
            f"https://management.azure.com/subscriptions/"
            f"{self.subscription_id}"
            f"/resourceGroups/{self.resource_group}"
            f"/providers/Microsoft.VideoIndexer/accounts/"
            f"{self.vi_name}"
            f"/generateAccessToken"
            f"?api-version=2024-01-01"
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
            json=payload,
            timeout=60
        )

        if response.status_code != 200:
            raise Exception(
                f"Failed to get VI Account Token: "
                f"{response.status_code} - {response.text}"
            )

        return response.json()["accessToken"]

    # =========================================================
    # YOUTUBE DOWNLOAD
    # =========================================================

    def download_youtube_video(
        self,
        url,
        output_path="temp_audit_video.mp4"
    ):
        """
        Download a YouTube video to a local MP4 file.

        Uses yt-dlp with the web_embedded YouTube client.
        This avoids the HTTP 403 issue encountered with the
        default YouTube client.
        """

        if not url:
            raise ValueError(
                "YouTube URL is empty."
            )

        if (
            "youtube.com" not in url
            and "youtu.be" not in url
        ):
            raise ValueError(
                "Please provide a valid YouTube URL."
            )

        logger.info(
            f"Downloading YouTube video: {url}"
        )

        # -----------------------------------------------------
        # Make output path absolute
        # -----------------------------------------------------

        output_path = os.path.abspath(output_path)

        output_dir = os.path.dirname(output_path)

        if output_dir:
            os.makedirs(
                output_dir,
                exist_ok=True
            )

        # -----------------------------------------------------
        # Remove old files
        # -----------------------------------------------------

        for file in [
            output_path,
            output_path + ".part"
        ]:

            if os.path.exists(file):

                try:
                    os.remove(file)

                except OSError:
                    pass

        # -----------------------------------------------------
        # Download strategies
        #
        # First strategy is the one that you manually verified
        # successfully.
        # -----------------------------------------------------

        strategies = [

            {
                "name": "Web Embedded MP4 360p",
                "format": "best[ext=mp4][height<=360]",
            },

            {
                "name": "Web Embedded MP4 480p fallback",
                "format": "best[ext=mp4][height<=480]",
            },

            {
                "name": "Web Embedded MP4 fallback",
                "format": "best[ext=mp4]",
            },
        ]

        last_error = None

        # -----------------------------------------------------
        # Try download strategies
        # -----------------------------------------------------

        for strategy in strategies:

            logger.info(
                f"Trying YouTube download strategy: "
                f"{strategy['name']}"
            )

            try:

                ydl_opts = {

                    # Format
                    "format": strategy["format"],

                    # Exact output path
                    "outtmpl": output_path,

                    # Don't download playlists
                    "noplaylist": True,

                    # -------------------------------------------------
                    # IMPORTANT
                    # -------------------------------------------------
                    # Use web_embedded client.
                    #
                    # This is the configuration that successfully
                    # downloaded your test video.
                    # -------------------------------------------------

                    "extractor_args": {
                        "youtube": {
                            "player_client": [
                                "web_embedded"
                            ]
                        }
                    },

                    # Retry configuration
                    "retries": 3,
                    "fragment_retries": 3,
                    "file_access_retries": 3,

                    # Don't continue old partial downloads
                    "continuedl": False,

                    # Overwrite existing file
                    "overwrites": True,

                    # Output logging
                    "quiet": False,
                    "no_warnings": False,

                    # Don't extract playlists
                    "extract_flat": False,

                    # Prefer native HLS handling
                    "hls_prefer_native": False,
                }

                logger.info(
                    "Using YouTube client: web_embedded"
                )

                logger.info(
                    f"Requested format: "
                    f"{strategy['format']}"
                )

                # -------------------------------------------------
                # Run yt-dlp
                # -------------------------------------------------

                with yt_dlp.YoutubeDL(ydl_opts) as ydl:

                    info = ydl.extract_info(
                        url,
                        download=True
                    )

                    logger.info(
                        f"yt-dlp extracted video: "
                        f"{info.get('title', 'Unknown')}"
                    )

                # -------------------------------------------------
                # Verify file
                # -------------------------------------------------

                if os.path.exists(output_path):

                    file_size = os.path.getsize(
                        output_path
                    )

                    if file_size > 0:

                        logger.info(
                            "YouTube download completed successfully."
                        )

                        logger.info(
                            f"Downloaded file: "
                            f"{output_path}"
                        )

                        logger.info(
                            f"File size: "
                            f"{file_size / (1024 * 1024):.2f} MB"
                        )

                        return output_path

                raise RuntimeError(
                    "yt-dlp completed but the expected "
                    "output file was not created."
                )

            except Exception as e:

                last_error = e

                logger.warning(
                    f"Strategy '{strategy['name']}' failed: "
                    f"{e}"
                )

                # -------------------------------------------------
                # Clean partial files before next attempt
                # -------------------------------------------------

                for file in [
                    output_path,
                    output_path + ".part"
                ]:

                    if os.path.exists(file):

                        try:
                            os.remove(file)

                        except OSError:
                            pass

        # -----------------------------------------------------
        # Everything failed
        # -----------------------------------------------------

        logger.error(
            "All YouTube download strategies failed."
        )

        raise RuntimeError(
            "Unable to download the YouTube video. "
            f"Last error: {last_error}"
        )

    # =========================================================
    # AZURE VIDEO INDEXER UPLOAD
    # =========================================================

    def upload_video(
        self,
        video_path,
        video_name
    ):
        """Upload a local file to Azure Video Indexer."""

        if not os.path.exists(video_path):
            raise FileNotFoundError(
                f"Video file does not exist: {video_path}"
            )

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

        with open(
            video_path,
            "rb"
        ) as video_file:

            files = {
                "file": video_file
            }

            response = requests.post(
                api_url,
                params=params,
                files=files,
                timeout=300
            )

        if response.status_code not in (
            200,
            201
        ):

            raise Exception(
                f"Azure Upload Failed: "
                f"{response.status_code} - "
                f"{response.text}"
            )

        video_id = response.json().get("id")

        if not video_id:

            raise Exception(
                "Azure Video Indexer upload succeeded "
                "but no video ID was returned."
            )

        logger.info(
            f"Azure Video Indexer upload successful. "
            f"Video ID: {video_id}"
        )

        return video_id

    # =========================================================
    # WAIT FOR AZURE VIDEO INDEXER
    # =========================================================

    def wait_for_processing(
        self,
        video_id
    ):
        """Poll Azure Video Indexer until processing completes."""

        logger.info(
            f"Waiting for video {video_id} to process..."
        )

        while True:

            arm_token = (
                self.get_arm_access_token()
            )

            vi_token = (
                self.get_account_access_token(
                    arm_token
                )
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
                params=params,
                timeout=60
            )

            if response.status_code != 200:

                raise Exception(
                    "Video Indexer status request failed: "
                    f"{response.status_code} - "
                    f"{response.text}"
                )

            data = response.json()

            state = data.get("state")

            # -------------------------------------------------
            # SUCCESS
            # -------------------------------------------------

            if state == "Processed":

                logger.info(
                    "Video processing completed."
                )

                return data

            # -------------------------------------------------
            # FAILURE
            # -------------------------------------------------

            if state == "Failed":

                raise Exception(
                    "Video Indexing Failed in Azure."
                )

            # -------------------------------------------------
            # QUARANTINED
            # -------------------------------------------------

            if state == "Quarantined":

                raise Exception(
                    "Video Quarantined."
                )

            # -------------------------------------------------
            # STILL PROCESSING
            # -------------------------------------------------

            logger.info(
                f"Status: {state}... "
                f"waiting 30 seconds"
            )

            time.sleep(30)

    # =========================================================
    # EXTRACT DATA
    # =========================================================

    def extract_data(
        self,
        vi_json
    ):
        """Parse Video Indexer JSON into application state."""

        # -----------------------------------------------------
        # TRANSCRIPT
        # -----------------------------------------------------

        transcript_lines = []

        for video in vi_json.get(
            "videos",
            []
        ):

            insights = video.get(
                "insights",
                {}
            )

            for item in insights.get(
                "transcript",
                []
            ):

                text = item.get(
                    "text"
                )

                if text:
                    transcript_lines.append(
                        text
                    )

        # -----------------------------------------------------
        # OCR
        # -----------------------------------------------------

        ocr_lines = []

        for video in vi_json.get(
            "videos",
            []
        ):

            insights = video.get(
                "insights",
                {}
            )

            for item in insights.get(
                "ocr",
                []
            ):

                text = item.get(
                    "text"
                )

                if text:
                    ocr_lines.append(
                        text
                    )

        # -----------------------------------------------------
        # RETURN APPLICATION DATA
        # -----------------------------------------------------

        return {

            "transcript": " ".join(
                transcript_lines
            ),

            "ocr_text": ocr_lines,

            "video_metadata": {

                "duration": (
                    vi_json
                    .get(
                        "summarizedInsights",
                        {}
                    )
                    .get(
                        "duration",
                        {}
                    )
                    .get(
                        "seconds"
                    )
                ),

                "platform": "youtube"
            }
        }
