# TECAR: Temporal Evidence-Chain Auditing and Reasoning

## Purpose

NEXUS COMPLY uses TECAR to turn a multimodal video compliance decision into a traceable audit rather than an unsupported LLM classification.

## Pipeline

```text
VIDEO
  |
  v
EVIDENCE EXTRACTION
 speech + OCR + temporal metadata
  |
  v
TEMPORAL CLUSTERING
 aligned evidence windows
  |
  v
COMPLIANCE AUDITOR
 candidate violations
  |
  v
EVIDENCE GRAPH
 evidence -> temporal cluster -> candidate finding
  |
  v
EVIDENCE VERIFIER
 supporting + counter-evidence
  |
  v
GROUNDING VALIDATOR
 claims matched against extracted evidence
  |
  v
POLICY PROVENANCE
 retrieved rule IDs + hashes + metadata
  |
  v
CONFIDENCE ENGINE
 evidence-derived confidence components
  |
  v
FINAL AUDIT DOSSIER
```

## Research contribution

The differentiator is the **audit methodology**, not the individual use of LangChain, LangGraph, RAG, Azure Video Indexer, OCR, or an LLM. The system explicitly preserves evidence provenance and verification state across the audit.

### 1. Temporal evidence chain

Speech and OCR evidence are normalized and grouped into temporal clusters without fabricating timestamps. This allows a finding to be evaluated in the context of the evidence window in which it occurred.

### 2. Supporting and counter-evidence

A candidate finding is not treated as final immediately. The verifier requests both supporting evidence and counter-evidence. Grounding then checks whether the verifier's claims can be matched to extracted evidence.

### 3. Evidence grounding

Verifier claims are matched using evidence content, source, and temporal overlap. A `CONFIRMED` decision with no grounded supporting evidence is downgraded to `WEAKENED` rather than being accepted as fully supported.

### 4. Policy provenance

Retrieved policy rules are assigned stable rule IDs and content hashes. The audit dossier records which rules were associated with each finding and preserves available source/version/effective-date metadata.

### 5. Evidence-derived confidence

Confidence is computed from measurable components including grounded support strength, temporal alignment, multimodal agreement, verification outcome, grounding validity, policy relevance, and counter-evidence strength. The model is not asked to invent a confidence percentage.

## Audit trace objects

The API exposes:

- `evidence_items`
- `temporal_clusters`
- `evidence_graph`
- `verified_compliance_results`
- `confidence_results`
- `policy_provenance`
- `audit_dossier`
- `final_report`

The explicit evidence graph uses deterministic identifiers such as `E0001` for evidence, `TC0001` for temporal clusters, and `F0001` for candidate findings.

## Important limitation

Policy provenance should ideally consume the exact policy context used by the auditor. If the auditor and provenance retriever execute independent searches, retrieval drift is possible. A future hardening step should persist the auditor's retrieved policy chunks in state and map provenance only against those exact chunks.
