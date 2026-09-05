"""Policy provenance for reproducible RAG compliance decisions.

Retrieves the same policy context used for auditing, assigns stable rule IDs,
and records content hashes plus available metadata. Findings are then mapped
to the retrieved rules so an audit can explain which policy evidence supported
its decision.
"""

import hashlib
import json
import os
import re
from typing import Any, Dict, List

from langchain_community.vectorstores import AzureSearch
from langchain_openai import AzureChatOpenAI, AzureOpenAIEmbeddings
from langchain_core.messages import SystemMessage, HumanMessage


def _stable_hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()[:16]


def _parse_json(content: Any) -> Dict[str, Any]:
    text = content if isinstance(content, str) else str(content)
    text = text.strip()
    match = re.search(r"\{.*\}", text, re.DOTALL)
    return json.loads(match.group(0) if match else text)


def _metadata(doc: Any) -> Dict[str, Any]:
    raw = getattr(doc, "metadata", {}) or {}
    return {
        "source": raw.get("source") or raw.get("file_name") or raw.get("filepath"),
        "title": raw.get("title") or raw.get("name"),
        "version": raw.get("version") or raw.get("policy_version") or raw.get("revision"),
        "effective_date": raw.get("effective_date") or raw.get("effectiveFrom"),
    }


def policy_provenance_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """Retrieve, fingerprint and map the policy rules used by the audit."""
    findings = state.get("compliance_results") or []
    transcript = state.get("transcript") or ""
    ocr = state.get("ocr_text") or []
    if isinstance(ocr, str):
        ocr = [ocr]

    try:
        embeddings = AzureOpenAIEmbeddings(
            azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
            api_key=os.getenv("AZURE_OPENAI_API_KEY"),
            azure_deployment=os.getenv("AZURE_OPENAI_EMBEDDING_DEPLOYMENT", "text-embedding-3-small"),
            api_version=os.getenv("AZURE_OPENAI_API_VERSION"),
        )
        vector_store = AzureSearch(
            azure_search_endpoint=os.getenv("AZURE_SEARCH_ENDPOINT"),
            azure_search_key=os.getenv("AZURE_SEARCH_API_KEY"),
            index_name=os.getenv("AZURE_SEARCH_INDEX_NAME"),
            embedding_function=embeddings.embed_query,
        )
        docs = vector_store.similarity_search(transcript + "\n" + " ".join(map(str, ocr)), k=3)
    except Exception as exc:
        return {
            "policy_rules": [],
            "policy_provenance": {
                "status": "UNAVAILABLE",
                "error": str(exc),
                "retrieval_count": 0,
            },
        }

    rules: List[Dict[str, Any]] = []
    for index, doc in enumerate(docs, start=1):
        content = str(getattr(doc, "page_content", "") or "").strip()
        if not content:
            continue
        metadata = _metadata(doc)
        rules.append({
            "rule_id": f"R{index:03d}",
            "content_hash": _stable_hash(content),
            "content": content,
            **metadata,
        })

    mappings: List[Dict[str, Any]] = []
    if findings and rules:
        llm = AzureChatOpenAI(
            azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
            api_key=os.getenv("AZURE_OPENAI_API_KEY"),
            azure_deployment=os.getenv("AZURE_OPENAI_CHAT_DEPLOYMENT"),
            api_version=os.getenv("AZURE_OPENAI_API_VERSION"),
            temperature=0.0,
        )
        rule_context = "\n\n".join(
            f"{rule['rule_id']} | hash={rule['content_hash']} | {rule['content']}"
            for rule in rules
        )
        for index, finding in enumerate(findings, start=1):
            prompt = f"""
Map this compliance finding to the retrieved policy rules.
Finding {index}: {json.dumps(finding, ensure_ascii=False)}

RETRIEVED RULES:
{rule_context}

Return ONLY JSON:
{{
  "finding_index": {index},
  "rule_ids": ["R001"],
  "reason": "Short explanation of why these rules apply."
}}
Only use rule IDs shown above. If none apply, return an empty rule_ids list.
"""
            try:
                result = _parse_json(llm.invoke([
                    SystemMessage(content="Map findings only to supplied policy rules."),
                    HumanMessage(content=prompt),
                ]).content)
            except Exception:
                result = {
                    "finding_index": index,
                    "rule_ids": [],
                    "reason": "Policy mapping could not be parsed; manual review required.",
                }
            valid_ids = {rule["rule_id"] for rule in rules}
            result["rule_ids"] = [rid for rid in result.get("rule_ids", []) if rid in valid_ids]
            mappings.append(result)

    by_finding = {item["finding_index"]: item for item in mappings}
    enriched_findings = []
    for index, finding in enumerate(findings, start=1):
        enriched = dict(finding)
        mapping = by_finding.get(index, {"rule_ids": [], "reason": "No policy mapping available."})
        enriched["policy_provenance"] = mapping
        enriched_findings.append(enriched)

    provenance = {
        "status": "RESOLVED" if rules else "NO_RULES",
        "retrieval_count": len(rules),
        "retrieval_query_hash": _stable_hash(transcript + "\n" + " ".join(map(str, ocr))),
        "rules": [
            {key: value for key, value in rule.items() if key != "content"}
            for rule in rules
        ],
        "finding_mappings": mappings,
    }
    return {
        "policy_rules": rules,
        "policy_provenance": provenance,
        "compliance_results": enriched_findings,
    }
