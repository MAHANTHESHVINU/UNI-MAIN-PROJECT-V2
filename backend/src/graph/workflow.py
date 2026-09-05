'''
THIS MODULE DEFINES THE DAG: DIRECTED ACYCLIC GRAPH THAT ORCHESTRATES
THE VIDEO COMPLIANCE AUDIT PROCESS.

START -> INDEX_VIDEO_NODE -> EVIDENCE_BUILDER -> AUDIT_CONTENT_NODE -> END
'''

from langgraph.graph import StateGraph, END

from backend.src.graph.state import VideoAuditState
from backend.src.graph.nodes import (
    index_video_node,
    audit_content_node,
)
from backend.src.services.evidence_builder import evidence_builder_node


def create_graph():
    """
    Constructs and compiles the LangGraph workflow.
    """

    workflow = StateGraph(VideoAuditState)

    # Existing production nodes
    workflow.add_node("indexer", index_video_node)
    workflow.add_node("auditor", audit_content_node)

    # New Evidence-Chain methodology node
    workflow.add_node("evidence_builder", evidence_builder_node)

    workflow.set_entry_point("indexer")

    # Evidence is built BEFORE compliance reasoning.
    workflow.add_edge("indexer", "evidence_builder")
    workflow.add_edge("evidence_builder", "auditor")
    workflow.add_edge("auditor", END)

    return workflow.compile()


app = create_graph()
