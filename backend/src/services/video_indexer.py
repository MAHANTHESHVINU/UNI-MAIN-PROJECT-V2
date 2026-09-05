import os
import time
import logging
import requests
import yt_dlp
from pathlib import Path
from dotenv import load_dotenv
from azure.identity import DefaultAzureCredential

BASE_DIR = Path(__file__).resolve().parents[3]
ENV_FILE = BASE_DIR / ".env"
load_dotenv(ENV_FILE, override=True)
logger = logging.getLogger("video_indexer")

class VideoIndexerService:
    def __init__(self):
        self.account_id = os.getenv("AZURE_VI_ACCOUNT_ID")
        self.location = os.getenv("AZURE_VI_LOCATION")
        self.subscription_id = os.getenv("AZURE_SUBSCRIPTION_ID")
        self.resource_group = os.getenv("AZURE_VI_RESOURCE_GROUP")
        self.vi_name = os.getenv("AZURE_VI_NAME")
        missing = []
        if not self.subscription_id: missing.append("AZURE_SUBSCRIPTION_ID")
        if not self.account_id: missing.append("AZURE_VI_ACCOUNT_ID")
        if not self.location: missing.append("AZURE_VI_LOCATION")
        if not self.resource_group: missing.append("AZURE_VI_RESOURCE_GROUP")
        if not self.vi_name: missing.append("AZURE_VI_NAME")
        if missing:
            raise RuntimeError("Missing Azure Video Indexer environment variables: " + ", ".join(missing))
        self.credential = DefaultAzureCredential()

    def get_arm_access_token(self):
        return self.credential.get_token("https://management.azure.com/.default").token

    def get_account_access_token(self, arm_access_token):
        url = (f"https://management.azure.com/subscriptions/{self.subscription_id}"
               f"/resourceGroups/{self.resource_group}/providers/Microsoft.VideoIndexer/accounts/"
               f"{self.vi_name}/generateAccessToken?api-version=2024-01-01")
        response = requests.post(url, headers={"Authorization": f"Bearer {arm_access_token}"},
                                 json={"permissionType": "Contributor", "scope": "Account"}, timeout=60)
        if response.status_code != 200:
            raise Exception(f"Failed to get VI Account Token: {response.status_code} - {response.text}")
        return response.json()["accessToken"]

    def download_youtube_video(self, url, output_path="temp_audit_video.mp4"):
        if not url:
            raise ValueError("YouTube URL is empty.")
        if "youtube.com" not in url and "youtu.be" not in url:
            raise ValueError("Please provide a valid YouTube URL.")
        output_path = os.path.abspath(output_path)
        output_dir = os.path.dirname(output_path)
        if output_dir: os.makedirs(output_dir, exist_ok=True)
        for file in [output_path, output_path + ".part"]:
            if os.path.exists(file):
                try: os.remove(file)
                except OSError: pass
        strategies = [
            {"name": "Web Embedded MP4 360p", "format": "best[ext=mp4][height<=360]"},
            {"name": "Web Embedded MP4 480p fallback", "format": "best[ext=mp4][height<=480]"},
            {"name": "Web Embedded MP4 fallback", "format": "best[ext=mp4]"},
        ]
        last_error = None
        for strategy in strategies:
            logger.info(f"Trying YouTube download strategy: {strategy['name']}")
            try:
                ydl_opts = {
                    "format": strategy["format"], "outtmpl": output_path, "noplaylist": True,
                    "extractor_args": {"youtube": {"player_client": ["web_embedded"]}},
                    "retries": 3, "fragment_retries": 3, "file_access_retries": 3,
                    "continuedl": False, "overwrites": True, "quiet": False,
                    "no_warnings": False, "extract_flat": False, "hls_prefer_native": False,
                }
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    info = ydl.extract_info(url, download=True)
                logger.info(f"yt-dlp extracted video: {info.get('title', 'Unknown')}")
                if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
                    logger.info("YouTube download completed successfully.")
                    return output_path
                raise RuntimeError("yt-dlp completed but the expected output file was not created.")
            except Exception as e:
                last_error = e
                logger.warning(f"Strategy '{strategy['name']}' failed: {e}")
                for file in [output_path, output_path + ".part"]:
                    if os.path.exists(file):
                        try: os.remove(file)
                        except OSError: pass
        raise RuntimeError(f"Unable to download the YouTube video. Last error: {last_error}")

    def upload_video(self, video_path, video_name):
        if not os.path.exists(video_path):
            raise FileNotFoundError(f"Video file does not exist: {video_path}")
        vi_token = self.get_account_access_token(self.get_arm_access_token())
        api_url = f"https://api.videoindexer.ai/{self.location}/Accounts/{self.account_id}/Videos"
        response = requests.post(api_url, params={"accessToken": vi_token, "name": video_name,
                                                  "privacy": "Private", "indexingPreset": "Default"},
                                 files={"file": open(video_path, "rb")}, timeout=300)
        if response.status_code not in (200, 201):
            raise Exception(f"Azure Upload Failed: {response.status_code} - {response.text}")
        video_id = response.json().get("id")
        if not video_id:
            raise Exception("Azure Video Indexer upload succeeded but no video ID was returned.")
        return video_id

    def wait_for_processing(self, video_id):
        logger.info(f"Waiting for video {video_id} to process...")
        while True:
            vi_token = self.get_account_access_token(self.get_arm_access_token())
            url = f"https://api.videoindexer.ai/{self.location}/Accounts/{self.account_id}/Videos/{video_id}/Index"
            response = requests.get(url, params={"accessToken": vi_token}, timeout=60)
            if response.status_code != 200:
                raise Exception(f"Video Indexer status request failed: {response.status_code} - {response.text}")
            data = response.json()
            state = data.get("state")
            if state == "Processed": return data
            if state == "Failed": raise Exception("Video Indexing Failed in Azure.")
            if state == "Quarantined": raise Exception("Video Quarantined.")
            logger.info(f"Status: {state}... waiting 30 seconds")
            time.sleep(30)

    @staticmethod
    def _timestamp(value):
        if value is None: return None
        if isinstance(value, (int, float)): return float(value)
        if isinstance(value, str):
            text = value.strip()
            if not text: return None
            parts = text.split(":")
            try:
                if len(parts) == 3:
                    return float(parts[0]) * 3600 + float(parts[1]) * 60 + float(parts[2])
                return float(text)
            except ValueError:
                return None
        return None

    def extract_data(self, vi_json):
        """Parse VI JSON while preserving real timestamped speech/OCR evidence."""
        transcript_lines, ocr_lines, temporal_evidence = [], [], []
        for video in vi_json.get("videos", []):
            insights = video.get("insights", {})
            for item in insights.get("transcript", []):
                text = item.get("text")
                if not text: continue
                transcript_lines.append(text)
                instances = item.get("instances") or []
                if not isinstance(instances, list): instances = [instances]
                if not instances:
                    temporal_evidence.append({"source_type": "SPEECH", "content": text,
                                              "start_seconds": None, "end_seconds": None,
                                              "confidence": item.get("confidence")})
                for inst in instances:
                    temporal_evidence.append({"source_type": "SPEECH", "content": text,
                                              "start_seconds": self._timestamp(inst.get("start")),
                                              "end_seconds": self._timestamp(inst.get("end")),
                                              "confidence": item.get("confidence")})
            for item in insights.get("ocr", []):
                text = item.get("text")
                if not text: continue
                ocr_lines.append(text)
                instances = item.get("instances") or []
                if not isinstance(instances, list): instances = [instances]
                if not instances:
                    temporal_evidence.append({"source_type": "OCR", "content": text,
                                              "start_seconds": None, "end_seconds": None,
                                              "confidence": item.get("confidence")})
                for inst in instances:
                    temporal_evidence.append({"source_type": "OCR", "content": text,
                                              "start_seconds": self._timestamp(inst.get("start")),
                                              "end_seconds": self._timestamp(inst.get("end")),
                                              "confidence": item.get("confidence")})
        exact = sum(1 for x in temporal_evidence if x["start_seconds"] is not None and x["end_seconds"] is not None)
        return {
            "transcript": " ".join(transcript_lines),
            "ocr_text": ocr_lines,
            "temporal_evidence": temporal_evidence,
            "video_metadata": {
                "duration": vi_json.get("summarizedInsights", {}).get("duration", {}).get("seconds"),
                "platform": "youtube",
                "temporal_evidence_count": len(temporal_evidence),
                "exact_temporal_evidence_count": exact,
            },
        }
