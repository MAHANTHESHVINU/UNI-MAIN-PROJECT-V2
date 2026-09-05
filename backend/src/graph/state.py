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
    """Defines the data schema for LangGraph execution content."""

    video_url: str
    video_id: str
    Local_file_path: Optional[str]
    video_metadata: Dict[str, Any]
    transcript: Optional[str]
    ocr_text: List[str]
    temporal_evidence: List[Dict[str, Any]]
    evidence_items: List[Dict[str, Any]]
    evidence_summary: Dict[str, Any]
    compliance_results: Annotated[List[ComplianceIssue], operator.add]
    final_status: str
    final_report: str
    errors: Annotated[list[str], operator.add]
