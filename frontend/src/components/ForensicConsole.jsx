import React from 'react';
import { Play, ShieldAlert, CheckCircle, ArrowRight, AlertCircle, RefreshCw } from './Icons';

export default function ForensicConsole({
  videoUrl,
  setVideoUrl,
  loading,
  error,
  result,
  violations,
  onStartAudit,
  onResetAudit,
  onOpenInspector
}) {
  const sampleUrls = [
    "https://youtu.be/V5TdVernYqU?si=x_J4A20J6Wy3rqbZ",
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  ];

  return (
    <div className="forensic-console-card">
      <div className="console-top-meta">
        <div className="console-brand-tag">
          <span className="dot-cyan"></span>
          <span>NEXUS // COMPLY KERNEL v2.4</span>
        </div>
        <div className="console-session-id">
          {result ? `SESSION: ${result.video_id || 'VID-VERIFIED'}` : '[ READY FOR INGESTION ]'}
        </div>
      </div>

      <div className="console-main-body">
        {loading ? (
          <div className="console-loading-state">
            <div className="loading-waveform-bar">
              <span className="wave w1"></span>
              <span className="wave w2"></span>
              <span className="wave w3"></span>
              <span className="wave w4"></span>
              <span className="wave w5"></span>
              <span className="wave w6"></span>
              <span className="wave w7"></span>
            </div>
            <div className="loading-status-text">
              <h3>DISPATCHING MULTI-MODAL AUDIT AGENTS</h3>
              <p>Analyzing audio harmonics, extracting video keyframes, and running Azure Video Indexer OCR...</p>
            </div>
            <div className="console-linear-progress">
              <div className="progress-bar-fill"></div>
            </div>
          </div>
        ) : result ? (
          <div className="console-result-state">
            <div className="result-headline-row">
              <div className="result-verdict">
                {violations.length > 0 ? (
                  <span className="verdict-chip violation">
                    <ShieldAlert size={18} /> {violations.length} COMPLIANCE VIOLATIONS DETECTED
                  </span>
                ) : (
                  <span className="verdict-chip clean">
                    <CheckCircle size={18} /> AUDIT CLEARED &bull; ZERO DEFECTS
                  </span>
                )}
              </div>
              <button className="console-btn-reset" onClick={onResetAudit}>
                <RefreshCw size={14} /> NEW AUDIT
              </button>
            </div>

            <div className="result-stats-row">
              <div className="stat-card">
                <span className="stat-num">{violations.length}</span>
                <span className="stat-txt">[ RECORDED FINDINGS ]</span>
              </div>
              <div className="stat-card">
                <span className="stat-num text-danger">
                  {violations.filter(v => v.severity === 'HIGH' || v.severity === 'CRITICAL').length}
                </span>
                <span className="stat-txt">[ HIGH SEVERITY RISKS ]</span>
              </div>
              <div className="stat-card">
                <span className="stat-num text-accent">
                  {result.compliance_results ? 'PASS/REVIEW' : 'VERIFIED'}
                </span>
                <span className="stat-txt">[ PIPELINE INTEGRITY ]</span>
              </div>
            </div>

            <div className="result-action-bar">
              <button className="btn-open-dossier" onClick={onOpenInspector}>
                OPEN FORENSIC EVIDENCE INSPECTOR <ArrowRight size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div className="console-input-state">
            <div className="console-input-instruction">
              <span className="inst-mono">[ INGESTION // TARGET URL ]</span>
              <p>Paste an external video URL to execute autonomous regulatory compliance inspection across all temporal frames.</p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                onStartAudit();
              }}
              className="console-input-form"
            >
              <div className="console-input-box">
                <input
                  type="text"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://youtu.be/..."
                  className="console-text-input"
                />
                <button
                  type="submit"
                  disabled={!videoUrl.trim()}
                  className="console-submit-btn"
                >
                  <Play size={15} /> RUN AUDIT
                </button>
              </div>
            </form>

            {error && (
              <div className="console-error-alert">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="console-benchmarks-row">
              <span className="bench-title">BENCHMARK SAMPLES:</span>
              {sampleUrls.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setVideoUrl(url)}
                  className="bench-btn"
                >
                  Sample #{i + 1}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="console-bottom-bar">
        <span className="btm-meta">LATENCY: 14ms &bull; GPU: ACCELERATED &bull; ARCHITECTURE: LANGGRAPH v0.2</span>
        <span className="btm-tag">SECURE AUDIT CONTAINER</span>
      </div>
    </div>
  );
}
