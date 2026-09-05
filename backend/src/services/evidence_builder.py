"""Evidence-chain construction for multimodal compliance auditing.

The builder creates a normalized evidence layer between video indexing and
compliance reasoning. It deliberately does not invent timestamps: when the
upstream indexer does not expose temporal coordinates, the evidence item is
marked as temporally unanchored.
"""

from typing import Any, Dict, List


def _make_item(
    source_type: str,
    content: str,
    start_seconds: Any = None,
    end_seconds: Any = None,
    confidence: Any = None,
) -> Dict[str, Any]:
    return {
        "source_type": source_type,
        "content": content,
        "start_seconds": start_seconds,
        "end_seconds": end_seconds,
        "confidence": confidence,
        "temporal_anchor": (
            "EXACT"
            if start_seconds is not None and end_seconds is not None
            else "UNANCHORED"
        ),
    }


def evidence_builder_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """Build normalized evidence records from indexed video observations."""
    evidence_items: List[Dict[str, Any]] = []

    # Preferred path: timestamp-preserving extraction from Video Indexer.
    temporal_evidence = state.get("temporal_evidence") or []
    for item in temporal_evidence:
        if not item.get("content"):
            continue
        evidence_items.append(
            _make_item(
                item.get("source_type", "UNKNOWN"),
                str(item["content"]),
                item.get("start_seconds"),
                item.get("end_seconds"),
                item.get("confidence"),
            )
        )

    # Backward-compatible fallback for existing indexed state.
    if not evidence_items:
        transcript = state.get("transcript") or ""
        if transcript:
            evidence_items.append(_make_item("SPEECH", transcript))

        ocr_text = state.get("ocr_text") or []
        if isinstance(ocr_text, str):
            ocr_text = [ocr_text]
        for text in ocr_text:
            if text:
                evidence_items.append(_make_item("OCR", str(text)))

    exact = sum(
        1
        for item in evidence_items
        if item["temporal_anchor"] == "EXACT"
    )
    speech = sum(1 for item in evidence_items if item["source_type"] == "SPEECH")
    ocr = sum(1 for item in evidence_items if item["source_type"] == "OCR")

    summary = {
        "total_items": len(evidence_items),
        "exact_temporal_items": exact,
        "unanchored_items": len(evidence_items) - exact,
        "speech_items": speech,
        "ocr_items": ocr,
        "temporal_coverage": (
            exact / len(evidence_items) if evidence_items else 0.0
        ),
    }

    return {
        "evidence_items": evidence_items,
        "evidence_summary": summary,
    }
