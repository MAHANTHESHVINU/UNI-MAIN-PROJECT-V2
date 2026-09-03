import React, { useMemo, useState, Suspense } from "react";
import "./App.css";
import HeroSphere from "./components/HeroSphere";

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
    timestamp: item?.timestamp || item?.time || item?.start_time || null,
  };
}

function App() {
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [selectedViolation, setSelectedViolation] = useState(null);

  const violations = useMemo(() => {
    return getViolations(result).map(normalizeViolation);
  }, [result]);

  async function startAudit() {
    if (!videoUrl.trim()) {
      setError("Enter a video URL first.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setSelectedViolation(null);

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
        throw new Error(`Audit failed with status ${response.status}`);
      }

      const data = await response.json();

      console.log("NEXUS COMPLY RESULT:", data);

      setResult(data);
    } catch (err) {
      console.error(err);
      setError(
        err?.message ||
          "Unable to connect to the NEXUS COMPLY backend."
      );
    } finally {
      setLoading(false);
    }
  }

  function resetAudit() {
    setResult(null);
    setError("");
    setSelectedViolation(null);
  }

  return (
    <div className="nexus-app">

      {/* NAVIGATION */}

      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">
            <span></span>
            <span></span>
            <span></span>
          </div>

          <div>
            <div className="brand-name">NEXUS</div>
            <div className="brand-sub">COMPLY</div>
          </div>
        </div>

        <div className="nav-center">
          <span className="nav-active">AI AUDIT</span>
          <span>ANALYTICS</span>
          <span>REPORTS</span>
        </div>

        <div className="system-status">
          <span className="status-dot"></span>
          SYSTEM ONLINE
        </div>
      </header>


      {/* HERO */}

      <main>

        <section className="hero">

          <div className="hero-copy">

            <div className="eyebrow">
              <span></span>
              INTELLIGENT VIDEO COMPLIANCE
            </div>

            <h1>
              Turn every frame
              <br />
              into <em>evidence.</em>
            </h1>

            <p className="hero-description">
              NEXUS COMPLY analyzes video with AI,
              identifies regulatory violations, and
              transforms complex evidence into actionable
              compliance intelligence.
            </p>

            <div className="hero-stats">
              <div>
                <strong>AI</strong>
                <span>VISION ENGINE</span>
              </div>

              <div>
                <strong>RAG</strong>
                <span>POLICY REASONING</span>
              </div>

              <div>
                <strong>24/7</strong>
                <span>CONTINUOUS AUDIT</span>
              </div>
            </div>

          </div>


          {/* 3D HERO VISUAL */}

          <div className="hero-visual">

            <div className="core-glow"></div>

            {/* Three.js 3D Sphere */}
            <div className="hero-canvas">
              <Suspense fallback={null}>
                <HeroSphere />
              </Suspense>
            </div>

            <div className="floating-card card-top">
              <span className="mini-dot"></span>
              VIDEO INPUT
              <strong>READY</strong>
            </div>

            <div className="floating-card card-right">
              <span>AI ANALYSIS</span>
              <strong>ACTIVE</strong>
              <div className="signal-bars">
                <i></i>
                <i></i>
                <i></i>
                <i></i>
                <i></i>
              </div>
            </div>

            <div className="floating-card card-bottom">
              <span>POLICY GRAPH</span>
              <strong>CONNECTED</strong>
            </div>

          </div>

        </section>


        {/* AUDIT CONSOLE */}

        <section className="audit-section">

          <div className="section-label">
            <span>01</span>
            START AN AUDIT
          </div>

          <div className="audit-console">

            <div className="console-heading">
              <div>
                <span className="console-kicker">
                  VIDEO ANALYSIS
                </span>

                <h2>
                  What should we
                  <br />
                  <em>inspect?</em>
                </h2>
              </div>

              <div className="console-number">
                01
              </div>
            </div>


            <div className="url-box">

              <div className="input-icon">
                ↗
              </div>

              <input
                type="text"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    startAudit();
                  }
                }}
                placeholder="Paste YouTube or video URL"
                disabled={loading}
              />

              <button
                className="audit-button"
                onClick={startAudit}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="button-spinner"></span>
                    ANALYZING
                  </>
                ) : (
                  <>
                    RUN AUDIT
                    <span>→</span>
                  </>
                )}
              </button>

            </div>

            <div className="console-footer">
              <span>
                SUPPORTED INPUT · YOUTUBE · MP4 · WEB VIDEO
              </span>

              <span>
                AI-POWERED COMPLIANCE ANALYSIS
              </span>
            </div>

          </div>

        </section>


        {/* PROCESSING */}

        {loading && (
          <section className="processing-section">

            <div className="processing-visual">

              <div className="scan-ring"></div>
              <div className="scan-ring ring-two"></div>
              <div className="scan-core">
                <span></span>
              </div>

            </div>

            <div className="processing-copy">

              <span className="processing-label">
                NEXUS ENGINE
              </span>

              <h2>
                Reading every
                <br />
                <em>frame.</em>
              </h2>

              <p>
                Video intelligence, OCR, retrieval,
                policy reasoning and compliance analysis
                are running in sequence.
              </p>

              <div className="progress-track">
                <div className="progress-fill"></div>
              </div>

              <div className="processing-status">
                <span>ANALYSIS IN PROGRESS</span>
                <span>AI ENGINE ACTIVE</span>
              </div>

            </div>

          </section>
        )}


        {/* ERROR */}

        {error && !loading && (
          <section className="error-section">

            <div className="error-icon">!</div>

            <div>
              <span>CONNECTION ERROR</span>
              <p>{error}</p>
            </div>

            <button onClick={startAudit}>
              RETRY →
            </button>

          </section>
        )}


        {/* RESULTS */}

        {result && !loading && (
          <section className="results-section">

            <div className="section-label">
              <span>02</span>
              AUDIT RESULTS
            </div>


            <div className="result-header">

              <div>
                <span className="result-kicker">
                  COMPLIANCE REPORT
                </span>

                <h2>
                  Audit
                  <br />
                  <em>complete.</em>
                </h2>
              </div>


              <div
                className={`result-status ${
                  violations.length > 0 ? "failed" : "passed"
                }`}
              >
                <span></span>

                {violations.length > 0
                  ? "FAIL"
                  : "PASS"}
              </div>

            </div>


            {/* RESULT METRICS */}

            <div className="metrics-grid">

              <div className="metric-card">
                <span>VIOLATIONS</span>
                <strong>{violations.length}</strong>
                <small>DETECTED</small>
              </div>

              <div className="metric-card">
                <span>AUDIT STATUS</span>
                <strong>
                  {violations.length > 0 ? "FAIL" : "PASS"}
                </strong>
                <small>COMPLIANCE</small>
              </div>

              <div className="metric-card">
                <span>SESSION</span>
                <strong>
                  {result.session_id
                    ? String(result.session_id).slice(0, 8)
                    : "N/A"}
                </strong>
                <small>IDENTIFIER</small>
              </div>

              <div className="metric-card">
                <span>VIDEO</span>
                <strong>
                  {result.video_id
                    ? String(result.video_id).slice(0, 12)
                    : "PROCESSED"}
                </strong>
                <small>ASSET</small>
              </div>

            </div>


            {/* VIOLATIONS */}

            <div className="violations-area">

              <div className="violations-heading">

                <div>
                  <span>COMPLIANCE INTELLIGENCE</span>
                  <h3>
                    Detected violations
                  </h3>
                </div>

                <span className="violation-count">
                  {violations.length.toString().padStart(2, "0")}
                </span>

              </div>


              {violations.length === 0 ? (
                <div className="no-violations">
                  <div className="success-mark">✓</div>

                  <div>
                    <strong>
                      No violations detected
                    </strong>

                    <p>
                      The analyzed content passed the
                      available compliance checks.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="violations-list">

                  {violations.map((violation, index) => (

                    <button
                      className={`violation-row ${
                        selectedViolation === index
                          ? "selected"
                          : ""
                      }`}
                      key={violation.id}
                      onClick={() =>
                        setSelectedViolation(
                          selectedViolation === index
                            ? null
                            : index
                        )
                      }
                    >

                      <div className="violation-index">
                        {(index + 1)
                          .toString()
                          .padStart(2, "0")}
                      </div>

                      <div className="violation-main">

                        <div className="violation-title">
                          {violation.title}
                        </div>

                        <div className="violation-description">
                          {violation.description}
                        </div>

                        {selectedViolation === index && (
                          <div className="violation-expanded">

                            {violation.timestamp && (
                              <span>
                                TIMESTAMP ·{" "}
                                {violation.timestamp}
                              </span>
                            )}

                            <span>
                              SEVERITY ·{" "}
                              {violation.severity}
                            </span>

                          </div>
                        )}

                      </div>

                      <div
                        className={`severity severity-${violation.severity.toLowerCase()}`}
                      >
                        {violation.severity}
                      </div>

                      <div className="violation-arrow">
                        →
                      </div>

                    </button>

                  ))}

                </div>
              )}

            </div>


            {/* FINAL REPORT */}

            <div className="final-report">

              <div className="report-heading">
                <span>AI SYNTHESIS</span>

                <div className="report-line"></div>
              </div>

              <div className="report-content">

                <div className="quote-mark">
                  "
                </div>

                <p>
                  {result.final_report ||
                    result.report ||
                    result.summary ||
                    "The compliance engine completed the analysis successfully."}
                </p>

              </div>

            </div>


            <div className="result-actions">

              <button
                className="secondary-button"
                onClick={resetAudit}
              >
                ← NEW AUDIT
              </button>

              <button
                className="primary-button"
                onClick={() =>
                  window.print()
                }
              >
                EXPORT REPORT
                <span>↗</span>
              </button>

            </div>

          </section>
        )}

      </main>


      {/* FOOTER */}

      <footer className="footer">

        <div>
          NEXUS COMPLY
        </div>

        <div>
          INTELLIGENT COMPLIANCE INFRASTRUCTURE
        </div>

        <div>
          v1.0 · AI SYSTEM
        </div>

      </footer>

    </div>
  );
}

export default App;