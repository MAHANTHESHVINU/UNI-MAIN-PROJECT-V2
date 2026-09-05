"""Deterministic confidence scoring for grounded, policy-linked findings."""

from typing import Any, Dict, List


def _clamp(value: float) -> float:
    return max(0.0, min(1.0, value))


def _strength(items: List[Dict[str, Any]]) -> float:
    grounded = [item for item in items if item.get("grounded")]
    if not grounded:
        return 0.0
    scores = []
    for item in grounded:
        score = 0.55
        if item.get("quote"):
            score += 0.15
        if item.get("grounded_start_seconds") is not None and item.get("grounded_end_seconds") is not None:
            score += 0.20
        if item.get("grounded_source_type") in {"SPEECH", "OCR"}:
            score += 0.10
        scores.append(min(score, 1.0))
    return sum(scores) / len(scores)


def _multimodal_agreement(supporting: List[Dict[str, Any]]) -> float:
    modalities = {
        item.get("grounded_source_type")
        for item in supporting
        if item.get("grounded") and item.get("grounded_source_type")
    }
    if len(modalities) >= 2:
        return 1.0
    if len(modalities) == 1:
        return 0.55
    return 0.0


def _policy_relevance(finding: Dict[str, Any], rules: List[Dict[str, Any]]) -> float:
    rule_ids = (finding.get("policy_provenance") or {}).get("rule_ids") or []
    if not rules:
        return 0.0
    valid = {rule.get("rule_id") for rule in rules}
    matched = len([rid for rid in rule_ids if rid in valid])
    if matched == 0:
        return 0.0
    return min(1.0, matched / max(1, min(3, len(rules))))


def confidence_engine_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """Calculate transparent confidence from evidence and policy provenance."""
    verification_results = state.get("grounded_verification_results") or state.get("verification_results") or []
    findings = state.get("compliance_results") or []
    rules = state.get("policy_rules") or []
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
        verification_factor = {"CONFIRMED": 1.0, "WEAKENED": 0.55, "REJECTED": 0.15}.get(decision, 0.55)
        grounded_support = [item for item in supporting if item.get("grounded")]
        temporal = 1.0 if any(
            item.get("grounded_start_seconds") is not None and item.get("grounded_end_seconds") is not None
            for item in grounded_support
        ) else (0.35 if grounded_support else 0.0)
        grounding_factor = len(grounded_support) / len(supporting) if supporting else 0.0
        policy_relevance = _policy_relevance(finding, rules)

        score = _clamp(
            0.25 * support_strength
            + 0.15 * temporal
            + 0.15 * multimodal
            + 0.20 * verification_factor
            + 0.15 * grounding_factor
            + 0.10 * policy_relevance
            - 0.20 * counter_strength
        )

        results.append({
            "finding_index": index,
            "category": finding.get("category", "Unknown"),
            "confidence": round(score * 100, 1),
            "support_strength": round(support_strength, 3),
            "counter_strength": round(counter_strength, 3),
            "temporal_alignment": round(temporal, 3),
            "multimodal_agreement": round(multimodal, 3),
            "verification_factor": round(verification_factor, 3),
            "grounding_factor": round(grounding_factor, 3),
            "policy_relevance": round(policy_relevance, 3),
            "decision": decision,
        })

    return {"confidence_results": results}
