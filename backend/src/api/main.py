import logging
import uuid
from pathlib import Path

from dotenv import load_dotenv

# =========================================================
# LOAD PROJECT .ENV
# =========================================================

BASE_DIR = Path(__file__).resolve().parents[3]

ENV_FILE = BASE_DIR / ".env"

load_dotenv(
    ENV_FILE,
    override=True
)


# =========================================================
# FASTAPI
# =========================================================

from fastapi import FastAPI

from fastapi.middleware.cors import CORSMiddleware

from pydantic import BaseModel


# =========================================================
# LANGGRAPH
# =========================================================

from backend.src.graph.workflow import app as compliance_graph


# =========================================================
# LOGGING
# =========================================================

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger("api-server")


# =========================================================
# FASTAPI APP
# =========================================================

app = FastAPI(
    title="NEXUS COMPLY API",
    description=(
        "AI-powered video compliance auditing API"
    ),
    version="1.0.0"
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


# =========================================================
# REQUEST MODEL
# =========================================================

class AuditRequest(BaseModel):

    video_url: str


# =========================================================
# RESPONSE MODELS
# =========================================================

class ComplianceIssue(BaseModel):

    category: str

    severity: str

    description: str


class AuditResponse(BaseModel):

    session_id: str

    video_id: str

    status: str

    final_report: str

    compliance_results: list[ComplianceIssue]

    errors: list[str]


# =========================================================
# ROOT
# =========================================================

@app.get("/")
def root():

    return {
        "service": "NEXUS COMPLY",
        "status": "running",
        "docs": "/docs",
        "health": "/health"
    }


# =========================================================
# HEALTH
# =========================================================

@app.get("/health")
def health():

    return {
        "status": "healthy",
        "service": "NEXUS COMPLY"
    }


# =========================================================
# AUDIT
# =========================================================

@app.post(
    "/audit",
    response_model=AuditResponse
)
async def audit_video(
    request: AuditRequest
):

    session_id = str(
        uuid.uuid4()
    )

    video_id = (
        f"vid_{session_id[:8]}"
    )

    logger.info(
        "Received audit request: %s",
        request.video_url
    )

    logger.info(
        "Starting compliance workflow: %s",
        session_id
    )

    # =====================================================
    # INITIAL LANGGRAPH STATE
    # =====================================================

    initial_inputs = {

        "video_url":
            request.video_url,

        "video_id":
            video_id,

        "compliance_results":
            [],

        "errors":
            []
    }

    # =====================================================
    # EXECUTE WORKFLOW
    # =====================================================

    try:

        final_state = (
            compliance_graph.invoke(
                initial_inputs
            )
        )

        logger.info(
            "Compliance workflow completed: %s",
            session_id
        )

        # =================================================
        # RETURN RESULT
        # =================================================

        return AuditResponse(

            session_id=session_id,

            video_id=final_state.get(
                "video_id",
                video_id
            ),

            status=final_state.get(
                "final_status",
                "UNKNOWN"
            ),

            final_report=final_state.get(
                "final_report",
                "No report generated."
            ),

            compliance_results=final_state.get(
                "compliance_results",
                []
            ),

            errors=final_state.get(
                "errors",
                []
            )
        )

    except Exception as e:

        logger.exception(
            "Audit workflow failed: %s",
            session_id
        )

        return AuditResponse(

            session_id=session_id,

            video_id=video_id,

            status="FAIL",

            final_report="AUDIT FAILED",

            compliance_results=[],

            errors=[
                str(e)
            ]
        )