import operator
from typing import Annotated, List, Dict, Optional, Any, TypedDict

# DEFINE THE SCHEMA FOR A SINGLE COMPLIANCE RESULT

class ComplianceIssue(TypedDict):
    category: str
    description: str
    severity: str
    timestamp: Optional[str]


# DEFINE THE GLOBAL GRAPH STATE

class VideoAuditState(TypedDict):
    """
    Defines the data schema for LangGraph execution content.
    """

    # INPUT PARAMETERS
    video_url: str
    video_id: str

    # INGESTION AND EXTRACTION DATA
    Local_file_path: Optional[str]
    video_metadata: Dict[str, Any]
    transcript: Optional[str]
    ocr_text: List[str]

    # =========================================================
    # EVIDENCE-CHAIN LAYER
    # =========================================================
    # These fields are intentionally separate from compliance_results.
    # The evidence builder records source observations first; the auditor
    # makes the compliance decision afterwards.
    evidence_items: List[Dict[str, Any]]
    evidence_summary: Dict[str, Any]

    # ANALYSIS OUTPUT
    compliance_results: Annotated[List[ComplianceIssue], operator.add]

    # FINAL DELIVERABLES
    final_status: str
    final_report: str

    # SYSTEM OBSERVABILITY
    errors: Annotated[list[str], operator.add]
