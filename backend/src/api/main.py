import logging
import uuid
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parents[3]
load_dotenv(BASE_DIR / ".env", override=True)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from backend.src.graph.workflow import app as compliance_graph

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("api-server")

app = FastAPI(
    title="NEXUS COMPLY API",
    description="AI-powered video compliance auditing API with TECAR evidence traceability",
    version="1.1.0",
)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

class AuditRequest(BaseModel):
    video_url: str

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
    verified_compliance_results: list[dict]
    confidence_results: list[dict]
    evidence_items: list[dict]
    temporal_clusters: list[dict]
    policy_provenance: dict
    audit_dossier: dict
    errors: list[str]

@app.get("/")
def root():
    return {"service": "NEXUS COMPLY", "status": "running", "docs": "/docs", "health": "/health"}

@app.get("/health")
def health():
    return {"status": "healthy", "service": "NEXUS COMPLY"}

@app.post("/audit", response_model=AuditResponse)
async def audit_video(request: AuditRequest):
    session_id = str(uuid.uuid4())
    video_id = f"vid_{session_id[:8]}"
    logger.info("Received audit request: %s", request.video_url)
    logger.info("Starting compliance workflow: %s", session_id)

    initial_inputs = {
        "video_url": request.video_url,
        "video_id": video_id,
        "compliance_results": [],
        "errors": [],
    }

    try:
        final_state = compliance_graph.invoke(initial_inputs)
        logger.info("Compliance workflow completed: %s", session_id)
        return AuditResponse(
            session_id=session_id,
            video_id=final_state.get("video_id", video_id),
            status=final_state.get("final_status", "UNKNOWN"),
            final_report=final_state.get("final_report", "No report generated."),
            compliance_results=final_state.get("compliance_results", []),
            verified_compliance_results=final_state.get("verified_compliance_results", []),
            confidence_results=final_state.get("confidence_results", []),
            evidence_items=final_state.get("evidence_items", []),
            temporal_clusters=final_state.get("temporal_clusters", []),
            policy_provenance=final_state.get("policy_provenance", {}),
            audit_dossier=final_state.get("audit_dossier", {}),
            errors=final_state.get("errors", []),
        )
    except Exception as e:
        logger.exception("Audit workflow failed: %s", session_id)
        return AuditResponse(
            session_id=session_id,
            video_id=video_id,
            status="FAIL",
            final_report="AUDIT FAILED",
            compliance_results=[],
            verified_compliance_results=[],
            confidence_results=[],
            evidence_items=[],
            temporal_clusters=[],
            policy_provenance={"status": "FAILED"},
            audit_dossier={},
            errors=[str(e)],
        )
