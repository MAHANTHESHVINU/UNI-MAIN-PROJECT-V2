"""Temporal clustering for the NEXUS COMPLY evidence chain.

Groups multimodal observations whose real Azure Video Indexer time windows
are close enough to describe the same event. Unanchored observations are
kept separately and are never assigned fabricated timestamps.
"""

from typing import Any, Dict, List


DEFAULT_GAP_SECONDS = 2.0


def _is_anchored(item: Dict[str, Any]) -> bool:
    return item.get("start_seconds") is not None and item.get("end_seconds") is not None


def build_temporal_clusters(
    evidence_items: List[Dict[str, Any]],
    max_gap_seconds: float = DEFAULT_GAP_SECONDS,
) -> List[Dict[str, Any]]:
    """Build deterministic temporal clusters from normalized evidence items."""
    anchored = [item for item in evidence_items if _is_anchored(item)]
    unanchored = [item for item in evidence_items if not _is_anchored(item)]

    anchored.sort(key=lambda item: (float(item["start_seconds"]), float(item["end_seconds"])))

    clusters: List[Dict[str, Any]] = []
    for item in anchored:
        start = float(item["start_seconds"])
        end = float(item["end_seconds"])

        if not clusters or start > clusters[-1]["end_seconds"] + max_gap_seconds:
            clusters.append({
                "cluster_id": f"T{len(clusters) + 1:03d}",
                "start_seconds": start,
                "end_seconds": end,
                "evidence": [item],
                "modalities": [item.get("source_type", "UNKNOWN")],
            })
            continue

        cluster = clusters[-1]
        cluster["end_seconds"] = max(cluster["end_seconds"], end)
        cluster["evidence"].append(item)
        source = item.get("source_type", "UNKNOWN")
        if source not in cluster["modalities"]:
            cluster["modalities"].append(source)

    for cluster in clusters:
        cluster["duration_seconds"] = max(
            0.0, cluster["end_seconds"] - cluster["start_seconds"]
        )
        cluster["multimodal"] = len(cluster["modalities"]) > 1
        cluster["evidence_count"] = len(cluster["evidence"])

    if unanchored:
        clusters.append({
            "cluster_id": "UNANCHORED",
            "start_seconds": None,
            "end_seconds": None,
            "duration_seconds": None,
            "evidence": unanchored,
            "modalities": sorted({item.get("source_type", "UNKNOWN") for item in unanchored}),
            "multimodal": len({item.get("source_type", "UNKNOWN") for item in unanchored}) > 1,
            "evidence_count": len(unanchored),
        })

    return clusters


def temporal_cluster_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """LangGraph node that enriches state with temporal evidence clusters."""
    items = state.get("evidence_items") or []
    clusters = build_temporal_clusters(items)
    return {"temporal_clusters": clusters}
