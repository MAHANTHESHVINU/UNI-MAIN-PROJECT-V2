'''
THIS MODULE DEFINES THE DAG: DIRECTED ACYCLIC GRAPH THAT ORCHESTRATES
THE VIDEO COMPLIANCE AUDIT PROCESS.

START -> INDEX_VIDEO_NODE -> EVIDENCE_BUILDER -> TEMPORAL_CLUSTER ->
AUDIT_CONTENT_NODE -> EVIDENCE_VERIFIER -> EVIDENCE_GROUNDING ->
POLICY_PROVENANCE -> CONFIDENCE_ENGINE -> FINAL_REPORT -> END
'''

from langgraph.graph import StateGraph, END

from backend.src.graph.state import VideoAuditState
from backend.src.graph.nodes import (
    index_video_node,
    audit_content_node,
)
from backend.src.services.evidence_builder import evidence_builder_node
from backend.src.services.temporal_cluster import temporal_cluster_node
from backend.src.services.evidence_verifier import evidence_verifier_node
from backend.src.services.evidence_grounding import evidence_grounding_node
from backend.src.services.policy_provenance import policy_provenance_node
from backend.src.services.confidence_engine import confidence_engine_node
from backend.src.services.final_report import final_report_node


def create_graph():
    """Constructs and compiles the LangGraph workflow."""
    workflow = StateGraph(VideoAuditState)

    workflow.add_node("indexer", index_video_node)
    workflow.add_node("evidence_builder", evidence_builder_node)
    workflow.add_node("temporal_cluster", temporal_cluster_node)
    workflow.add_node("auditor", audit_content_node)
    workflow.add_node("evidence_verifier", evidence_verifier_node)
    workflow.add_node("evidence_grounding", evidence_grounding_node)
    workflow.add_node("policy_provenance", policy_provenance_node)
    workflow.add_node("confidence_engine", confidence_engine_node)
    workflow.add_node("final_report", final_report_node)

    workflow.set_entry_point("indexer")
    workflow.add_edge("indexer", "evidence_builder")
    workflow.add_edge("evidence_builder", "temporal_cluster")
    workflow.add_edge("temporal_cluster", "auditor")
    workflow.add_edge("auditor", "evidence_verifier")
    workflow.add_edge("evidence_verifier", "evidence_grounding")
    workflow.add_edge("evidence_grounding", "policy_provenance")
    workflow.add_edge("policy_provenance", "confidence_engine")
    workflow.add_edge("confidence_engine", "final_report")
    workflow.add_edge("final_report", END)

    return workflow.compile()


app = create_graph()
