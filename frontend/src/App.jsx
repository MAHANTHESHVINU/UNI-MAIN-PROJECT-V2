import React, { useMemo, useState } from "react";
import "./App.css";
import AudioSpectrogram from "./components/AudioSpectrogram";
import ComplianceRadar from "./components/ComplianceRadar";
import VideoTimelineDeck from "./components/VideoTimelineDeck";
import {
  Play,
  AlertCircle,
  CheckCircle,
  ShieldAlert,
  RefreshCw,
  Sun,
  Moon,
  Download,
  Filter,
  FileText,
  Copy,
  Check
} from "./components/Icons";

const API_URL = "http://127.0.0.1:8000";

function getViolations(result) {
  if (!result) return [];

  if (Array.isArray(result.compliance_results)) {
    return result.compliance_results;
  }

  if (
    result.compliance_results &&
    Array.isArray(result.compliance_results.violations)
  ) {
    return result.compliance_results.violations;
  }

  if (Array.isArray(result.violations)) {
    return result.violations;
  }

  if (Array.isArray(result.results)) {
    return result.results;
  }

  return [];
}

function normalizeViolation(item, index) {
  if (typeof item === "string") {
    return {
      id: index + 1,
      title: "Compliance Violation",
      description: item,
      severity: "HIGH",
      timestamp: `00:${String((index + 1) * 14).padStart(2, '0')}`,
      recommendation: "Review and ensure conspicuous disclosure per FTC guidelines."
    };
  }

  return {
    id: index + 1,
    title:
      item?.title ||
      item?.type ||
      item?.category ||
      item?.rule ||
      `Violation ${index + 1}`,
    description:
      item?.description ||
      item?.reason ||
      item?.details ||
      item?.message ||
      JSON.stringify(item),
    severity: String(item?.severity || item?.risk || "HIGH").toUpperCase(),
    timestamp: item?.timestamp || item?.time || item?.start_time || `00:${String((index + 1) * 14).padStart(2, '0')}`,
    recommendation:
      item?.recommendation ||
      item?.remediation ||
      item?.action ||
      "Add clear and conspicuous disclosures in visual and audio tracks."
  };
}

export default function App() {
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [theme, setTheme] = useState("dark");
  const [filterSeverity, setFilterSeverity] = useState("ALL");
  const [selectedViolationId, setSelectedViolationId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const sampleUrls = [
    { label: "Sponsored Ad Sample", url: "https://youtu.be/V5TdVernYqU?si=x_J4A20J6Wy3rqbZ" },
    { label: "Benchmark Video", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }
  ];

  const violations = useMemo(() => {
    return getViolations(result).map(normalizeViolation);
  }, [result]);

  const filteredViolations = useMemo(() => {
    if (filterSeverity === "ALL") return violations;
    return violations.filter((v) => v.severity === filterSeverity);
  }, [violations, filterSeverity]);

  async function startAudit() {
    if (!videoUrl.trim()) {
      setError("Please enter a valid video stream URL.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setSelectedViolationId(null);

    try {
      const response = await fetch(`${API_URL}/audit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          video_url: videoUrl.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Audit request failed with status ${response.status}`);
      }

      const data = await response.json();
      console.log("NEXUS COMPLY AUDIT RESULT:", data);
      setResult(data);
    } catch (err) {
      console.error(err);
      setError(
        err?.message ||
          "Unable to connect to the backend server. Ensure FastAPI is running on port 8000."
      );
    } finally {
      setLoading(false);
    }
  }

  function resetAudit() {
    setResult(null);
    setError("");
    setSelectedViolationId(null);
  }

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const copyCitation = (violation) => {
    const citation = `[NEXUS COMPLY AUDIT] Timestamp: ${violation.timestamp || 'N/A'} | Severity: ${violation.severity} | Rule: ${violation.title}\nFindings: ${violation.description}\nRemediation: ${violation.recommendation}`;
    navigator.clipboard.writeText(citation).then(() => {
      setCopiedId(violation.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const downloadReport = () => {
    if (!result) return;
    const lines = [
      "# NEXUS COMPLY // REGULATORY AUDIT REPORT",
      `Generated: ${new Date().toISOString()}`,
      `Target URL: ${videoUrl}`,
      `Total Violations: ${violations.length}`,
      "",
      "## Findings Breakdown",
      ""
    ];

    violations.forEach((v, i) => {
      lines.push(`### ${i + 1}. [${v.severity}] ${v.title}`);
      if (v.timestamp) lines.push(`- **Timestamp:** ${v.timestamp}`);
      lines.push(`- **Description:** ${v.description}`);
      lines.push(`- **Remediation:** ${v.recommendation}`);
      lines.push("");
    });

    const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `compliance-audit-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`clean-app ${theme === "light" ? "theme-light" : "theme-dark"}`}>
      {/* Ambient Atmospheric Glow */}
      <div className="ambient-glow"></div>

      {/* Top Navbar */}
      <header className="clean-navbar">
        <div className="navbar-container">
          <div className="nav-brand">
            <div className="brand-logo-icon">
              <span className="dot"></span>
            </div>
            <div className="brand-text">
              <span className="brand-name">nexus comply</span>
              <span className="brand-tag">ENTERPRISE v2.4</span>
            </div>
          </div>

          <div className="nav-right">
            <div className="system-status-pill">
              <span className={`status-indicator ${loading ? "busy" : "ready"}`}></span>
              <span>{loading ? "PROCESSING AUDIT" : "SYSTEM READY"}</span>
            </div>

            <button
              className="theme-toggle-btn"
              onClick={toggleTheme}
              title={`Switch to ${theme === "light" ? "Dark" : "Light"} Mode`}
            >
              {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="clean-main-container">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-badge">
            <span>[ MULTI-MODAL COMPLIANCE KERNEL ]</span>
          </div>
          <h1 className="hero-headline">
            Turn video streams into
            <br />
            audit-ready compliance evidence.
          </h1>
          <p className="hero-subtext">
            Autonomous multi-agent verification for digital media. Inspect video streams across FTC, FCC, and global advertising mandates with temporal keyframe precision.
          </p>
        </section>

        {/* Audit Input Card */}
        <section className="audit-input-card">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              startAudit();
            }}
            className="audit-form"
          >
            <div className="input-group">
              <input
                type="text"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="Paste video stream URL (YouTube, MP4, WebM)..."
                className="audit-text-input"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={!videoUrl.trim() || loading}
                className="btn-run-audit"
              >
                {loading ? (
                  <>
                    <span className="loading-spinner"></span>
                    <span>RUNNING AUDIT...</span>
                  </>
                ) : (
                  <>
                    <Play size={15} />
                    <span>RUN COMPLIANCE AUDIT</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {error && (
            <div className="error-alert">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Benchmark Chips */}
          <div className="benchmarks-bar">
            <span className="benchmarks-title">QUICK SAMPLES:</span>
            {sampleUrls.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                className="sample-chip"
                onClick={() => setVideoUrl(sample.url)}
                disabled={loading}
              >
                {sample.label}
              </button>
            ))}
          </div>
        </section>

        {/* Multi-Modal Audio Waveform Spectrogram */}
        <AudioSpectrogram loading={loading} result={result} />

        {/* Multi-Agent Pipeline Status */}
        <section className="pipeline-deck">
          <div className="pipeline-step">
            <div className="step-num">01</div>
            <div className="step-content">
              <span className="step-title">STREAM INGESTION</span>
              <span className="step-sub">Demux &amp; temporal buffering</span>
            </div>
            <span className={`step-badge ${loading ? "active" : result ? "done" : "idle"}`}>
              {loading ? "ACTIVE" : result ? "DONE" : "IDLE"}
            </span>
          </div>

          <div className="pipeline-step">
            <div className="step-num">02</div>
            <div className="step-content">
              <span className="step-title">WHISPER STT</span>
              <span className="step-sub">Audio transcript alignment</span>
            </div>
            <span className={`step-badge ${loading ? "active" : result ? "done" : "idle"}`}>
              {loading ? "ACTIVE" : result ? "DONE" : "IDLE"}
            </span>
          </div>

          <div className="pipeline-step">
            <div className="step-num">03</div>
            <div className="step-content">
              <span className="step-title">AZURE VI OCR</span>
              <span className="step-sub">Visual text &amp; scene inspection</span>
            </div>
            <span className={`step-badge ${loading ? "active" : result ? "done" : "idle"}`}>
              {loading ? "ACTIVE" : result ? "DONE" : "IDLE"}
            </span>
          </div>

          <div className="pipeline-step">
            <div className="step-num">04</div>
            <div className="step-content">
              <span className="step-title">LANGGRAPH REASONER</span>
              <span className="step-sub">FTC regulatory verification</span>
            </div>
            <span className={`step-badge ${loading ? "active" : result ? "done" : "idle"}`}>
              {loading ? "ACTIVE" : result ? "DONE" : "IDLE"}
            </span>
          </div>
        </section>

        {/* Results & Interactive Forensic Suite */}
        {result && (
          <section className="results-section">
            {/* 2-Column Analytical Deck: Video Scrubber & Compliance Radar */}
            <div className="forensic-analytical-deck">
              <div className="analytical-col-left">
                <VideoTimelineDeck
                  videoUrl={videoUrl}
                  violations={violations}
                  onSelectViolation={(id) => {
                    setSelectedViolationId(id);
                    const el = document.getElementById(`violation-${id}`);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                  selectedViolationId={selectedViolationId}
                />
              </div>
              <div className="analytical-col-right">
                <ComplianceRadar
                  result={result}
                  violationsCount={violations.length}
                />
              </div>
            </div>

            {/* Findings Header & Filters */}
            <div className="findings-toolbar">
              <div className="filter-chips-group">
                <span className="filter-icon"><Filter size={14} /></span>
                {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map((sev) => (
                  <button
                    key={sev}
                    className={`filter-btn ${filterSeverity === sev ? "active" : ""}`}
                    onClick={() => setFilterSeverity(sev)}
                  >
                    {sev} {sev === "ALL" ? `(${violations.length})` : `(${violations.filter(v => v.severity === sev).length})`}
                  </button>
                ))}
              </div>

              <div className="findings-actions">
                <button className="btn-export-report" onClick={downloadReport}>
                  <Download size={14} />
                  <span>EXPORT DOSSIER (.MD)</span>
                </button>
                <button className="btn-reset-audit" onClick={resetAudit}>
                  <RefreshCw size={14} />
                  <span>NEW AUDIT</span>
                </button>
              </div>
            </div>

            {/* Violation Cards Grid */}
            <div className="findings-list">
              {filteredViolations.length === 0 ? (
                <div className="clean-empty-state">
                  <CheckCircle size={32} className="empty-icon" />
                  <h3>No violations found matching "{filterSeverity}"</h3>
                  <p>All scanned frames adhere to regulatory disclosure guidelines.</p>
                </div>
              ) : (
                filteredViolations.map((violation) => {
                  const isSelected = selectedViolationId === violation.id;
                  const isCopied = copiedId === violation.id;

                  return (
                    <div
                      id={`violation-${violation.id}`}
                      key={violation.id}
                      className={`violation-card ${isSelected ? "selected-highlight" : ""}`}
                      onClick={() => setSelectedViolationId(isSelected ? null : violation.id)}
                    >
                      <div className="violation-card-top">
                        <div className="badge-row">
                          <span className={`severity-tag sev-${violation.severity.toLowerCase()}`}>
                            {violation.severity}
                          </span>
                          {violation.timestamp && (
                            <span className="timestamp-tag">
                              TIMESTAMP: {violation.timestamp}
                            </span>
                          )}
                        </div>
                        <div className="card-right-actions">
                          <button
                            className="btn-copy-citation"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyCitation(violation);
                            }}
                            title="Copy forensic citation to clipboard"
                          >
                            {isCopied ? (
                              <>
                                <Check size={12} className="text-success" />
                                <span className="text-success">COPIED</span>
                              </>
                            ) : (
                              <>
                                <Copy size={12} />
                                <span>COPY CITATION</span>
                              </>
                            )}
                          </button>
                          <span className="violation-id">#{violation.id}</span>
                        </div>
                      </div>

                      <h3 className="violation-title">{violation.title}</h3>
                      <p className="violation-desc">{violation.description}</p>

                      <div className="remediation-box">
                        <span className="remediation-label">RECOMMENDED REMEDIATION:</span>
                        <p>{violation.recommendation}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        )}
      </main>

      {/* Clean Footer */}
      <footer className="clean-footer">
        <div className="footer-container">
          <span>NEXUS COMPLY &bull; AUTONOMOUS REGULATORY AUDIT SYSTEM</span>
          <span>LANGGRAPH &bull; AZURE VIDEO INDEXER &bull; OPENAI WHISPER</span>
        </div>
      </footer>
    </div>
  );
}