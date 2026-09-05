"""Evidence verification for compliance findings.

Each auditor finding is challenged against the normalized temporal evidence.
The verifier asks for both supporting and counter-evidence so a first-pass
LLM hypothesis is not treated as ground truth.
"""

import json
import os
import re
from typing import Any, Dict, List

from langchain_openai import AzureChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage


def _parse_json(content: Any) -> Dict[str, Any]:
    text = content if isinstance(content, str) else str(content)
    text = text.strip()
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        text = match.group(0)
    return json.loads(text)


def _evidence_text(state: Dict[str, Any]) -> str:
    clusters = state.get("temporal_clusters") or []
    if clusters:
        lines: List[str] = []
        for cluster in clusters:
            start = cluster.get("start_seconds")
            end = cluster.get("end_seconds")
            window = "UNANCHORED" if start is None else f"{start:.2f}s-{end:.2f}s"
            for item in cluster.get("evidence", []):
                lines.append(
                    f"[{window}] {item.get('source_type', 'UNKNOWN')}: {item.get('content', '')}"
                )
        return "\n".join(lines)

    return "\n".join(
        f"[{item.get('source_type', 'UNKNOWN')}] {item.get('content', '')}"
        for item in (state.get("evidence_items") or [])
    )


def evidence_verifier_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """Verify every first-pass compliance finding against available evidence."""
    findings = state.get("compliance_results") or []
    if not findings:
        return {"verification_results": [], "verified_compliance_results": []}

    llm = AzureChatOpenAI(
        azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
        api_key=os.getenv("AZURE_OPENAI_API_KEY"),
        azure_deployment=os.getenv("AZURE_OPENAI_CHAT_DEPLOYMENT"),
        api_version=os.getenv("AZURE_OPENAI_API_VERSION"),
        temperature=0.0,
    )

    evidence = _evidence_text(state)
    verified: List[Dict[str, Any]] = []

    for index, finding in enumerate(findings, start=1):
        prompt = f"""
You are an independent compliance evidence verifier.

A first-pass auditor produced this finding:
{json.dumps(finding, ensure_ascii=False)}

AVAILABLE VIDEO EVIDENCE:
{evidence}

Challenge the finding. Identify evidence that SUPPORTS it and evidence that
CONTRADICTS or weakens it. Do not invent evidence, timestamps, or facts.
If no counter-evidence exists, explicitly return an empty counter_evidence list.

Return ONLY valid JSON:
{{
  "finding_index": {index},
  "decision": "CONFIRMED" | "WEAKENED" | "REJECTED",
  "supporting_evidence": [{{"source_type": "SPEECH|OCR|UNKNOWN", "quote": "...", "start_seconds": null, "end_seconds": null}}],
  "counter_evidence": [{{"source_type": "SPEECH|OCR|UNKNOWN", "quote": "...", "start_seconds": null, "end_seconds": null}}],
  "reason": "Short evidence-grounded explanation."
}}
"""
        response = llm.invoke([
            SystemMessage(content="Verify compliance findings strictly from supplied evidence."),
            HumanMessage(content=prompt),
        ])
        try:
            result = _parse_json(response.content)
        except Exception:
            result = {
                "finding_index": index,
                "decision": "WEAKENED",
                "supporting_evidence": [],
                "counter_evidence": [],
                "reason": "Verifier response could not be parsed; finding requires review.",
            }
        verified.append(result)

    # Preserve the original findings and attach verification metadata.
    enriched = []
    for index, finding in enumerate(findings, start=1):
        verification = next(
            (item for item in verified if item.get("finding_index") == index),
            None,
        )
        enriched_finding = dict(finding)
        if verification:
            enriched_finding["verification"] = verification
        enriched.append(enriched_finding)

    return {
        "verification_results": verified,
        "verified_compliance_results": enriched,
    }
