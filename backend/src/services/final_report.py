"""Build an evidence-linked audit dossier from the completed graph state.

This node does not generate new findings. It assembles the auditor's findings,
grounded verification decisions, evidence references, and deterministic
confidence into a traceable final report.
"""

from typing import Any, Dict, List


def _format_time(seconds: Any) -> str:
    if seconds is None:
        return "UNANCHORED"
    seconds = float(seconds)
    minutes = int(seconds // 60)
    remaining = seconds % 60
    return f"{minutes:02d}:{remaining:05.2f}"


def final_report_node(state: Dict[str, Any]) -> Dict[str, Any]:
    findings = state.get("compliance_results") or []
    verifications = state.get("grounded_verification_results") or state.get("verification_results") or []
    confidences = state.get("confidence_results") or []
    clusters = state.get("temporal_clusters") or []

    verification_by_index = {
        item.get("finding_index"): item for item in verifications
    }
    confidence_by_index = {
        item.get("finding_index"): item for item in confidences
    }

    dossier_findings: List[Dict[str, Any]] = []
    for index, finding in enumerate(findings, start=1):
        verification = verification_by_index.get(index, {})
        confidence = confidence_by_index.get(index, {})
        dossier_findings.append({
            "finding_index": index,
            "category": finding.get("category", "Unknown"),
            "severity": finding.get("severity", "UNKNOWN"),
            "description": finding.get("description", ""),
            "verification": {
                "decision": verification.get("decision", "UNVERIFIED"),
                "reason": verification.get("reason", ""),
                "supporting_evidence": verification.get("supporting_evidence", []),
                "counter_evidence": verification.get("counter_evidence", []),
                "grounding_summary": verification.get("grounding_summary", {}),
                "grounding_override": verification.get("grounding_override"),
            },
            "confidence": confidence.get("confidence", 0.0),
            "confidence_components": {
                key: value
                for key, value in confidence.items()
                if key in {
                    "support_strength",
                    "counter_strength",
                    "temporal_alignment",
                    "multimodal_agreement",
                    "verification_factor",
                    "grounding_factor",
                }
            },
        })

    lines = [
        "NEXUS COMPLY — EVIDENCE-LINKED AUDIT REPORT",
        "=" * 52,
        f"FINAL STATUS: {state.get('final_status', 'FAIL')}",
        f"VIOLATIONS: {len(findings)}",
        f"TEMPORAL CLUSTERS: {len(clusters)}",
        "",
        "DECISION TRACE",
        "------------",
    ]

    if not dossier_findings:
        lines.append("No compliance violations were identified.")
    else:
        for item in dossier_findings:
            verification = item["verification"]
            lines.extend([
                f"[{item['finding_index']}] {item['category']} | {item['severity']}",
                f"Decision: {verification['decision']} | Confidence: {item['confidence']:.1f}%",
                f"Finding: {item['description']}",
                f"Reason: {verification['reason'] or 'No verifier reason supplied.'}",
            ])

            grounding = verification.get("grounding_summary") or {}
            if grounding:
                lines.append(
                    "Grounding: "
                    f"{grounding.get('grounded_supporting', 0)}/"
                    f"{grounding.get('supporting_claims', 0)} supporting claims grounded; "
                    f"{grounding.get('grounded_counter', 0)}/"
                    f"{grounding.get('counter_claims', 0)} counter claims grounded."
                )

            if verification.get("grounding_override"):
                lines.append(f"Grounding override: {verification['grounding_override']}")

            supporting = verification["supporting_evidence"]
            counter = verification["counter_evidence"]
            if supporting:
                lines.append("Supporting evidence:")
                for evidence in supporting[:5]:
                    window = f"{_format_time(evidence.get('grounded_start_seconds', evidence.get('start_seconds')))}-{_format_time(evidence.get('grounded_end_seconds', evidence.get('end_seconds')))}"
                    marker = "GROUNDED" if evidence.get("grounded") else "UNSUPPORTED"
                    lines.append(
                        f"  - [{window}] {evidence.get('grounded_source_type', evidence.get('source_type', 'UNKNOWN'))} "
                        f"[{marker}]: {evidence.get('quote', '')}"
                    )
            else:
                lines.append("Supporting evidence: none returned by verifier.")

            if counter:
                lines.append("Counter-evidence:")
                for evidence in counter[:5]:
                    window = f"{_format_time(evidence.get('grounded_start_seconds', evidence.get('start_seconds')))}-{_format_time(evidence.get('grounded_end_seconds', evidence.get('end_seconds')))}"
                    marker = "GROUNDED" if evidence.get("grounded") else "UNSUPPORTED"
                    lines.append(
                        f"  - [{window}] {evidence.get('grounded_source_type', evidence.get('source_type', 'UNKNOWN'))} "
                        f"[{marker}]: {evidence.get('quote', '')}"
                    )
            else:
                lines.append("Counter-evidence: none identified.")
            lines.append("")

    dossier = {
        "method": "TECAR",
        "status": state.get("final_status", "FAIL"),
        "finding_count": len(dossier_findings),
        "temporal_cluster_count": len(clusters),
        "grounding_validated": True,
        "findings": dossier_findings,
        "report": "\n".join(lines),
    }

    return {
        "final_report": dossier["report"],
        "audit_dossier": dossier,
        "verified_compliance_results": dossier_findings,
    }
