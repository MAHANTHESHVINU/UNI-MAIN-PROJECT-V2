"""Machine-ground evidence validation for the TECAR audit chain.

The LLM verifier may describe evidence using quotes or timestamps. This node
checks those claims against the normalized evidence produced upstream and
marks unsupported evidence as ungrounded instead of trusting the verifier.
"""

from typing import Any, Dict, List, Optional


def _normalize(value: Any) -> str:
    return " ".join(str(value or "").lower().split())


def _number(value: Any) -> Optional[float]:
    try:
        return float(value) if value is not None else None
    except (TypeError, ValueError):
        return None


def _matches_item(claim: Dict[str, Any], item: Dict[str, Any]) -> bool:
    claim_text = _normalize(claim.get("quote"))
    item_text = _normalize(item.get("content"))

    text_match = bool(claim_text and item_text and (
        claim_text in item_text or item_text in claim_text
    ))

    claim_start = _number(claim.get("start_seconds"))
    claim_end = _number(claim.get("end_seconds"))
    item_start = _number(item.get("start_seconds"))
    item_end = _number(item.get("end_seconds"))

    if claim_start is not None and claim_end is not None and item_start is not None and item_end is not None:
        time_match = claim_start <= item_end + 0.5 and claim_end >= item_start - 0.5
    else:
        time_match = claim_start is None and claim_end is None

    source_match = (
        not claim.get("source_type")
        or claim.get("source_type") == "UNKNOWN"
        or claim.get("source_type") == item.get("source_type")
    )

    return text_match and time_match and source_match


def _ground_claims(claims: List[Dict[str, Any]], evidence_items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    grounded: List[Dict[str, Any]] = []
    for claim in claims:
        matched = next((item for item in evidence_items if _matches_item(claim, item)), None)
        checked = dict(claim)
        checked["grounded"] = matched is not None
        if matched:
            checked["evidence_id"] = matched.get("evidence_id")
            checked["grounded_source_type"] = matched.get("source_type")
            checked["grounded_start_seconds"] = matched.get("start_seconds")
            checked["grounded_end_seconds"] = matched.get("end_seconds")
        else:
            checked["grounding_reason"] = "No matching normalized evidence item was found."
        grounded.append(checked)
    return grounded


def evidence_grounding_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """Validate verifier evidence claims against upstream normalized evidence."""
    evidence_items = state.get("evidence_items") or []
    verification_results = state.get("verification_results") or []
    grounded_results: List[Dict[str, Any]] = []

    for verification in verification_results:
        supporting = _ground_claims(
            verification.get("supporting_evidence") or [], evidence_items
        )
        counter = _ground_claims(
            verification.get("counter_evidence") or [], evidence_items
        )
        result = dict(verification)
        result["supporting_evidence"] = supporting
        result["counter_evidence"] = counter
        result["grounding_summary"] = {
            "supporting_claims": len(supporting),
            "grounded_supporting": sum(1 for item in supporting if item.get("grounded")),
            "counter_claims": len(counter),
            "grounded_counter": sum(1 for item in counter if item.get("grounded")),
        }

        # A finding cannot remain CONFIRMED when none of its supporting
        # evidence can be grounded in the machine-extracted evidence.
        if result.get("decision") == "CONFIRMED" and supporting and not any(
            item.get("grounded") for item in supporting
        ):
            result["decision"] = "WEAKENED"
            result["grounding_override"] = "CONFIRMED downgraded because supporting evidence was not grounded."

        grounded_results.append(result)

    return {"grounded_verification_results": grounded_results}
