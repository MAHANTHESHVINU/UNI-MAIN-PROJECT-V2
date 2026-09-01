import os
from pathlib import Path

from dotenv import load_dotenv


# =========================================================
# LOAD PROJECT .ENV
# =========================================================

BASE_DIR = Path(__file__).resolve().parents[3]

ENV_FILE = BASE_DIR / ".env"

load_dotenv(ENV_FILE, override=True)


# =========================================================
# AZURE VIDEO INDEXER SERVICE
# =========================================================

class VideoIndexerService:

    def __init__(self):

        self.subscription_id = os.getenv(
            "AZURE_SUBSCRIPTION_ID"
        )

        self.account_id = os.getenv(
            "AZURE_VI_ACCOUNT_ID"
        )

        self.location = os.getenv(
            "AZURE_VI_LOCATION"
        )

        self.resource_group = os.getenv(
            "AZURE_VI_RESOURCE_GROUP"
        )

        self.vi_name = os.getenv(
            "AZURE_VI_NAME"
        )

        # -------------------------------------------------
        # Validate required configuration
        # -------------------------------------------------

        missing = []

        if not self.subscription_id:
            missing.append("AZURE_SUBSCRIPTION_ID")

        if not self.account_id:
            missing.append("AZURE_VI_ACCOUNT_ID")

        if not self.location:
            missing.append("AZURE_VI_LOCATION")

        if missing:
            raise RuntimeError(
                "Missing Azure Video Indexer environment "
                f"variables: {', '.join(missing)}"
            )

        print(
            f"Azure Video Indexer configured: "
            f"account={self.account_id}, "
            f"location={self.location}"
        )