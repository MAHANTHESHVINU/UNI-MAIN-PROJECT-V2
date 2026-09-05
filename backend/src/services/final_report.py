"""Build an evidence-linked audit dossier from the completed graph state.

This node does not generate new findings. It assembles the auditor's findings,
verification decisions, evidence references, and deterministic confidence into
a traceable final report.
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
    verifications = state.get("verification_results") or []
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

            supporting = verification["supporting_evidence"]
            counter = verification["counter_evidence"]
            if supporting:
                lines.append("Supporting evidence:")
                for evidence in supporting[:5]:
                    window = f"{_format_time(evidence.get('start_seconds'))}-{_format_time(evidence.get('end_seconds'))}"
                    lines.append(
                        f"  - [{window}] {evidence.get('source_type', 'UNKNOWN')}: "
                        f"{evidence.get('quote', '')}"
                    )
            else:
                lines.append("Supporting evidence: none returned by verifier.")

            if counter:
                lines.append("Counter-evidence:")
                for evidence in counter[:5]:
                    window = f"{_format_time(evidence.get('start_seconds'))}-{_format_time(evidence.get('end_seconds'))}"
                    lines.append(
                        f"  - [{window}] {evidence.get('source_type', 'UNKNOWN')}: "
                        f"{evidence.get('quote', '')}"
                    )
            else:
                lines.append("Counter-evidence: none identified.")
            lines.append("")

    dossier = {
        "method": "TECAR",
        "status": state.get("final_status", "FAIL"),
        "finding_count": len(dossier_findings),
        "temporal_cluster_count": len(clusters),
        "findings": dossier_findings,
        "report": "\n".join(lines),
    }

    return {
        "final_report": dossier["report"],
        "audit_dossier": dossier,
        "verified_compliance_results": dossier_findings,
    }
