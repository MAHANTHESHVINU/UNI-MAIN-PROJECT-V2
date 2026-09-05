'''
THIS MODULE DEFINES THE DAG: DIRECTED ACYCLIC GRAPH THAT ORCHESTRATES
THE VIDEO COMPLIANCE AUDIT PROCESS.

START -> INDEX_VIDEO_NODE -> EVIDENCE_BUILDER -> TEMPORAL_CLUSTER -> AUDIT_CONTENT_NODE -> END
'''

from langgraph.graph import StateGraph, END

from backend.src.graph.state import VideoAuditState
from backend.src.graph.nodes import (
    index_video_node,
    audit_content_node,
)
from backend.src.services.evidence_builder import evidence_builder_node
from backend.src.services.temporal_cluster import temporal_cluster_node


def create_graph():
    """Constructs and compiles the LangGraph workflow."""

    workflow = StateGraph(VideoAuditState)

    workflow.add_node("indexer", index_video_node)
    workflow.add_node("evidence_builder", evidence_builder_node)
    workflow.add_node("temporal_cluster", temporal_cluster_node)
    workflow.add_node("auditor", audit_content_node)

    workflow.set_entry_point("indexer")

    workflow.add_edge("indexer", "evidence_builder")
    workflow.add_edge("evidence_builder", "temporal_cluster")
    workflow.add_edge("temporal_cluster", "auditor")
    workflow.add_edge("auditor", END)

    return workflow.compile()


app = create_graph()
