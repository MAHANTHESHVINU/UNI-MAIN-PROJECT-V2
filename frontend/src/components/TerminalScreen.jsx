import React from 'react';
import { Play, AlertCircle, CheckCircle, ShieldAlert, Cpu, ArrowRight } from './Icons';

export default function TerminalScreen({
  videoUrl,
  setVideoUrl,
  loading,
  error,
  result,
  violations,
  onStartAudit,
  onOpenInspector,
  onFocusView
}) {
  const sampleUrls = [
    "https://youtu.be/V5TdVernYqU?si=x_J4A20J6Wy3rqbZ",
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  ];

  return (
    <div className="terminal-display-screen">
      {/* Top Console Bar */}
      <div className="terminal-screen-header">
        <div className="term-window-dots">
          <span className="dot red"></span>
          <span className="dot yellow"></span>
          <span className="dot green"></span>
        </div>
        <div className="term-screen-title">
          <Cpu size={14} className="term-icon" />
          <span>NEXUS-AUDIT-KERNEL v2.4 // NODE-01</span>
        </div>
        <div className="term-badge">LIVE TTY</div>
      </div>

      {/* Screen Body */}
      <div className="terminal-screen-body">
        {loading ? (
          <div className="term-loading-view">
            <div className="term-radar-scan">
              <div className="radar-ring r1"></div>
              <div className="radar-ring r2"></div>
              <div className="radar-line"></div>
            </div>
            <div className="term-load-text">
              <h4>INDEXING VIDEO &amp; MULTI-MODAL AUDIT</h4>
              <p className="pulse-text">LangGraph Agent Pipeline active &bull; Analyzing audio, OCR, and frames</p>
            </div>
            <div className="term-progress-bar">
              <div className="term-progress-fill"></div>
            </div>
          </div>
        ) : result ? (
          <div className="term-result-summary">
            <div className="term-result-header">
              <div className="term-verdict">
                {violations.length > 0 ? (
                  <span className="verdict-tag fail">
                    <ShieldAlert size={16} /> {violations.length} VIOLATIONS IDENTIFIED
                  </span>
                ) : (
                  <span className="verdict-tag pass">
                    <CheckCircle size={16} /> COMPLIANCE VERIFIED
                  </span>
                )}
              </div>
              <div className="term-meta-tag">
                SESSION: {result.video_id || 'ID-COMPLETED'}
              </div>
            </div>

            <div className="term-metrics-grid">
              <div className="term-metric-box">
                <span className="m-val">{violations.length}</span>
                <span className="m-label">TOTAL ISSUES</span>
              </div>
              <div className="term-metric-box">
                <span className="m-val text-red">
                  {violations.filter(v => v.severity === 'HIGH' || v.severity === 'CRITICAL').length}
                </span>
                <span className="m-label">HIGH SEVERITY</span>
              </div>
              <div className="term-metric-box">
                <span className="m-val text-cyan">
                  {result.compliance_results ? 'PASS/REVIEW' : 'COMPLETED'}
                </span>
                <span className="m-label">PIPELINE STATUS</span>
              </div>
            </div>

            <div className="term-actions-row">
              <button
                type="button"
                className="term-btn-primary"
                onClick={onOpenInspector}
              >
                OPEN AUDIT INSPECTOR <ArrowRight size={14} />
              </button>
              <button
                type="button"
                className="term-btn-secondary"
                onClick={() => onFocusView('results')}
              >
                VIEW TELEMETRY SCREEN
              </button>
            </div>
          </div>
        ) : (
          <div className="term-input-view">
            <div className="term-prompt-line">
              <span className="term-prompt">&gt; NEXUS_AUDIT:~$</span>
              <span className="term-instruction">Enter target video stream URL to initiate AI multi-agent compliance scan:</span>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                onStartAudit();
              }}
              className="term-form"
            >
              <div className="term-input-wrapper">
                <input
                  type="text"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://youtu.be/..."
                  className="term-url-input"
                  autoFocus
                />
                <button
                  type="submit"
                  className="term-submit-btn"
                  disabled={!videoUrl.trim()}
                >
                  <Play size={14} /> AUDIT
                </button>
              </div>
            </form>

            {error && (
              <div className="term-error-banner">
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}

            <div className="term-presets">
              <span className="presets-label">QUICK SAMPLE:</span>
              {sampleUrls.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  className="preset-pill"
                  onClick={() => setVideoUrl(url)}
                >
                  Sample #{i + 1}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Screen Footer */}
      <div className="terminal-screen-footer">
        <span>MODE: GRAFFICO-3D-RUNTIME</span>
        <span className="blink-cursor">█</span>
        <span>LATENCY: 12ms</span>
      </div>
    </div>
  );
}
