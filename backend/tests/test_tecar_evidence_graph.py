from backend.src.services.evidence_graph import build_evidence_graph


def test_evidence_graph_assigns_stable_ids_and_links_clusters():
    evidence = [
        {"source": "speech", "content": "Please disclose that this is sponsored.", "start": 10.0, "end": 12.0},
        {"source": "ocr", "content": "#ad", "start": 10.5, "end": 11.5},
    ]
    clusters = [
        {
            "cluster_id": "TC0001",
            "start": 10.0,
            "end": 12.0,
            "duration": 2.0,
            "modalities": ["speech", "ocr"],
            "evidence_count": 2,
            "evidence": evidence,
        }
    ]
    findings = [
        {
            "category": "DISCLOSURE",
            "severity": "HIGH",
            "description": "Please disclose that this is sponsored.",
            "timestamp": "00:10",
        }
    ]

    graph = build_evidence_graph(evidence, clusters, findings)

    assert graph["method"] == "TECAR"
    assert graph["node_counts"] == {"evidence": 2, "temporal_cluster": 1, "finding": 1}
    assert {n["id"] for n in graph["nodes"] if n["type"] == "evidence"} == {"E0001", "E0002"}
    assert any(e["source"] == "E0001" and e["target"] == "TC0001" for e in graph["edges"])
    assert any(e["source"] == "E0002" and e["target"] == "TC0001" for e in graph["edges"])
    assert any(e["source"] == "E0001" and e["target"] == "F0001" for e in graph["edges"])
