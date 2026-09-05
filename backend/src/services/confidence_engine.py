"""Deterministic confidence scoring for verified compliance findings.

Confidence is derived from observable evidence properties rather than asking
the LLM to invent a confidence percentage.
"""

from typing import Any, Dict, List


def _clamp(value: float) -> float:
    return max(0.0, min(1.0, value))


def _strength(items: List[Dict[str, Any]]) -> float:
    if not items:
        return 0.0
    scores = []
    for item in items:
        score = 0.55
        if item.get("quote"):
            score += 0.15
        if item.get("start_seconds") is not None and item.get("end_seconds") is not None:
            score += 0.20
        if item.get("source_type") in {"SPEECH", "OCR"}:
            score += 0.10
        scores.append(min(score, 1.0))
    return sum(scores) / len(scores)


def _multimodal_agreement(supporting: List[Dict[str, Any]]) -> float:
    modalities = {item.get("source_type") for item in supporting if item.get("source_type")}
    if len(modalities) >= 2:
        return 1.0
    if len(modalities) == 1:
        return 0.55
    return 0.0


def confidence_engine_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """Calculate transparent confidence scores from verifier outputs."""
    verification_results = state.get("verification_results") or []
    findings = state.get("compliance_results") or []
    results: List[Dict[str, Any]] = []

    for index, finding in enumerate(findings, start=1):
        verification = next(
            (item for item in verification_results if item.get("finding_index") == index),
            {},
        )
        supporting = verification.get("supporting_evidence") or []
        counter = verification.get("counter_evidence") or []
        decision = verification.get("decision", "WEAKENED")

        support_strength = _strength(supporting)
        counter_strength = _strength(counter)
        multimodal = _multimodal_agreement(supporting)
        verification_factor = {
            "CONFIRMED": 1.0,
            "WEAKENED": 0.55,
            "REJECTED": 0.15,
        }.get(decision, 0.55)

        temporal = 0.0
        if any(
            item.get("start_seconds") is not None and item.get("end_seconds") is not None
            for item in supporting
        ):
            temporal = 1.0
        elif supporting:
            temporal = 0.35

        score = (
            0.35 * support_strength
            + 0.20 * temporal
            + 0.20 * multimodal
            + 0.25 * verification_factor
            - 0.20 * counter_strength
        )
        score = _clamp(score)

        results.append({
            "finding_index": index,
            "category": finding.get("category", "Unknown"),
            "confidence": round(score * 100, 1),
            "support_strength": round(support_strength, 3),
            "counter_strength": round(counter_strength, 3),
            "temporal_alignment": round(temporal, 3),
            "multimodal_agreement": round(multimodal, 3),
            "verification_factor": round(verification_factor, 3),
            "decision": decision,
        })

    return {"confidence_results": results}
