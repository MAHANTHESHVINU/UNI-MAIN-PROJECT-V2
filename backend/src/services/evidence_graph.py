from __future__ import annotations

from collections import defaultdict
from typing import Any, Dict, List


def _evidence_id(item: Dict[str, Any], index: int) -> str:
    existing = item.get("evidence_id") or item.get("id")
    if existing:
        return str(existing)
    return f"E{index + 1:04d}"


def build_evidence_graph(
    evidence_items: List[Dict[str, Any]],
    temporal_clusters: List[Dict[str, Any]],
    findings: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """Build a deterministic, serializable evidence graph for TECAR.

    Nodes are evidence items, temporal clusters, findings and policy references.
    Edges preserve provenance without inventing timestamps or policy relationships.
    """
    nodes: List[Dict[str, Any]] = []
    edges: List[Dict[str, Any]] = []
    evidence_by_content: Dict[str, str] = {}

    for index, item in enumerate(evidence_items or []):
        evidence_id = _evidence_id(item, index)
        node = dict(item)
        node["evidence_id"] = evidence_id
        nodes.append({"id": evidence_id, "type": "evidence", "data": node})
        normalized = str(item.get("content", "")).strip().lower()
        if normalized:
            evidence_by_content[normalized] = evidence_id

    for index, cluster in enumerate(temporal_clusters or []):
        cluster_id = str(cluster.get("cluster_id") or f"TC{index + 1:04d}")
        nodes.append({
            "id": cluster_id,
            "type": "temporal_cluster",
            "data": {
                "start": cluster.get("start"),
                "end": cluster.get("end"),
                "duration": cluster.get("duration"),
                "modalities": cluster.get("modalities", []),
                "evidence_count": cluster.get("evidence_count", 0),
            },
        })
        for evidence in cluster.get("evidence", []) or []:
            normalized = str(evidence.get("content", "")).strip().lower()
            evidence_id = evidence_by_content.get(normalized)
            if evidence_id:
                edges.append({"source": evidence_id, "target": cluster_id, "type": "belongs_to"})

    for index, finding in enumerate(findings or []):
        finding_id = f"F{index + 1:04d}"
        nodes.append({
            "id": finding_id,
            "type": "finding",
            "data": {
                "category": finding.get("category"),
                "severity": finding.get("severity"),
                "description": finding.get("description"),
                "timestamp": finding.get("timestamp"),
            },
        })

    finding_nodes = [n for n in nodes if n["type"] == "finding"]
    evidence_nodes = [n for n in nodes if n["type"] == "evidence"]
    for finding_index, finding in enumerate(findings or []):
        finding_id = finding_nodes[finding_index]["id"]
        finding_text = str(finding.get("description", "")).lower()
        for evidence_node in evidence_nodes:
            content = str(evidence_node["data"].get("content", "")).lower()
            if content and (content in finding_text or finding_text in content):
                edges.append({"source": evidence_node["id"], "target": finding_id, "type": "supports_candidate"})

    return {
        "method": "TECAR",
        "nodes": nodes,
        "edges": edges,
        "node_counts": {
            "evidence": sum(n["type"] == "evidence" for n in nodes),
            "temporal_cluster": sum(n["type"] == "temporal_cluster" for n in nodes),
            "finding": sum(n["type"] == "finding" for n in nodes),
        },
    }


def evidence_graph_node(state: Dict[str, Any]) -> Dict[str, Any]:
    graph = build_evidence_graph(
        state.get("evidence_items", []),
        state.get("temporal_clusters", []),
        state.get("compliance_results", []),
    )
    return {"evidence_graph": graph}
