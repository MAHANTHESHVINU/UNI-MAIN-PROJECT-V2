"""Build an evidence- and policy-linked audit dossier.

This node assembles findings, grounded evidence, policy rule provenance, and
deterministic confidence without generating new compliance findings.
"""

from typing import Any, Dict, List


def _format_time(seconds: Any) -> str:
    if seconds is None:
        return "UNANCHORED"
    seconds = float(seconds)
    return f"{int(seconds // 60):02d}:{seconds % 60:05.2f}"


def final_report_node(state: Dict[str, Any]) -> Dict[str, Any]:
    findings = state.get("compliance_results") or []
    verifications = state.get("grounded_verification_results") or state.get("verification_results") or []
    confidences = state.get("confidence_results") or []
    clusters = state.get("temporal_clusters") or []
    provenance = state.get("policy_provenance") or {}
    rules = state.get("policy_rules") or []

    verification_by_index = {item.get("finding_index"): item for item in verifications}
    confidence_by_index = {item.get("finding_index"): item for item in confidences}
    rule_by_id = {rule.get("rule_id"): rule for rule in rules}

    dossier_findings: List[Dict[str, Any]] = []
    for index, finding in enumerate(findings, start=1):
        verification = verification_by_index.get(index, {})
        confidence = confidence_by_index.get(index, {})
        mapping = finding.get("policy_provenance") or {}
        rule_ids = [rid for rid in mapping.get("rule_ids", []) if rid in rule_by_id]
        dossier_findings.append({
            "finding_index": index,
            "category": finding.get("category", "Unknown"),
            "severity": finding.get("severity", "UNKNOWN"),
            "description": finding.get("description", ""),
            "policy_provenance": {
                "rule_ids": rule_ids,
                "mapping_reason": mapping.get("reason", ""),
                "rules": [
                    {key: value for key, value in rule_by_id[rid].items() if key != "content"}
                    for rid in rule_ids
                ],
            },
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
                key: value for key, value in confidence.items()
                if key in {"support_strength", "counter_strength", "temporal_alignment", "multimodal_agreement", "verification_factor", "grounding_factor", "policy_relevance"}
            },
        })

    lines = [
        "NEXUS COMPLY — EVIDENCE-LINKED AUDIT REPORT",
        "=" * 52,
        f"FINAL STATUS: {state.get('final_status', 'FAIL')}",
        f"VIOLATIONS: {len(findings)}",
        f"TEMPORAL CLUSTERS: {len(clusters)}",
        f"POLICY RULES RETRIEVED: {len(rules)}",
        f"POLICY RETRIEVAL: {provenance.get('status', 'UNKNOWN')}",
        "",
        "DECISION TRACE",
        "------------",
    ]

    if not dossier_findings:
        lines.append("No compliance violations were identified.")
    else:
        for item in dossier_findings:
            verification = item["verification"]
            policy = item["policy_provenance"]
            lines.extend([
                f"[{item['finding_index']}] {item['category']} | {item['severity']}",
                f"Decision: {verification['decision']} | Confidence: {item['confidence']:.1f}%",
                f"Finding: {item['description']}",
                f"Policy rules: {', '.join(policy['rule_ids']) if policy['rule_ids'] else 'NONE MAPPED'}",
                f"Policy basis: {policy['mapping_reason'] or 'No policy mapping reason supplied.'}",
                f"Reason: {verification['reason'] or 'No verifier reason supplied.'}",
            ])
            grounding = verification.get("grounding_summary") or {}
            if grounding:
                lines.append(
                    f"Grounding: {grounding.get('grounded_supporting', 0)}/{grounding.get('supporting_claims', 0)} supporting; "
                    f"{grounding.get('grounded_counter', 0)}/{grounding.get('counter_claims', 0)} counter."
                )
            supporting = verification["supporting_evidence"]
            counter = verification["counter_evidence"]
            if supporting:
                lines.append("Supporting evidence:")
                for evidence in supporting[:5]:
                    start = evidence.get("grounded_start_seconds", evidence.get("start_seconds"))
                    end = evidence.get("grounded_end_seconds", evidence.get("end_seconds"))
                    marker = "GROUNDED" if evidence.get("grounded") else "UNSUPPORTED"
                    lines.append(f"  - [{_format_time(start)}-{_format_time(end)}] [{marker}] {evidence.get('quote', '')}")
            else:
                lines.append("Supporting evidence: none returned by verifier.")
            if counter:
                lines.append("Counter-evidence:")
                for evidence in counter[:5]:
                    start = evidence.get("grounded_start_seconds", evidence.get("start_seconds"))
                    end = evidence.get("grounded_end_seconds", evidence.get("end_seconds"))
                    marker = "GROUNDED" if evidence.get("grounded") else "UNSUPPORTED"
                    lines.append(f"  - [{_format_time(start)}-{_format_time(end)}] [{marker}] {evidence.get('quote', '')}")
            else:
                lines.append("Counter-evidence: none identified.")
            lines.append("")

    dossier = {
        "method": "TECAR",
        "status": state.get("final_status", "FAIL"),
        "finding_count": len(dossier_findings),
        "temporal_cluster_count": len(clusters),
        "policy_provenance": provenance,
        "grounding_validated": True,
        "findings": dossier_findings,
        "report": "\n".join(lines),
    }
    return {
        "final_report": dossier["report"],
        "audit_dossier": dossier,
        "verified_compliance_results": dossier_findings,
    }
