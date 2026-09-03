import React, { useState } from 'react';
import { X, ShieldAlert, AlertTriangle, Info, Download, Check, Copy } from './Icons';

export default function InspectorModal({
  isOpen,
  onClose,
  result,
  violations,
  selectedViolation,
  setSelectedViolation
}) {
  const [copied, setCopied] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState('ALL');

  if (!isOpen || !result) return null;

  const filteredViolations = violations.filter(v => {
    if (filterSeverity === 'ALL') return true;
    return v.severity === filterSeverity;
  });

  const activeViolation = selectedViolation || (filteredViolations.length > 0 ? filteredViolations[0] : null);

  const reportText = result.final_report || result.report || result.summary || JSON.stringify(result, null, 2);

  const handleCopyReport = () => {
    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadReport = () => {
    const blob = new Blob([reportText], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus_compliance_audit_${result.video_id || 'report'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="inspector-modal-backdrop" onClick={onClose}>
      <div className="inspector-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="inspector-header">
          <div className="inspector-title-group">
            <div className="inspector-badge">AUDIT EVIDENCE INSPECTOR</div>
            <h2>Compliance Findings &amp; Forensic Log</h2>
            <div className="inspector-sub">
              Target ID: <code>{result.video_id || 'VID-UNKNOWN'}</code> &bull; Session: <code>{result.session_id || 'LIVE'}</code>
            </div>
          </div>

          <div className="inspector-header-actions">
            <button className="inspector-btn" onClick={handleCopyReport}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? 'COPIED' : 'COPY REPORT'}</span>
            </button>
            <button className="inspector-btn" onClick={handleDownloadReport}>
              <Download size={14} />
              <span>DOWNLOAD MD</span>
            </button>
            <button className="inspector-close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Severity Filter Pills */}
        <div className="inspector-filters">
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
            <button
              key={sev}
              className={`filter-pill ${filterSeverity === sev ? 'active' : ''}`}
              onClick={() => setFilterSeverity(sev)}
            >
              {sev}
            </button>
          ))}
          <span className="filter-count">
            Showing {filteredViolations.length} of {violations.length} recorded items
          </span>
        </div>

        {/* Two-Column Body: Violation List + Active Item Detail */}
        <div className="inspector-grid">
          {/* Left Column: Violations List */}
          <div className="inspector-list-col">
            {filteredViolations.length === 0 ? (
              <div className="empty-violations-state">
                <Check size={32} className="text-cyan" />
                <p>No violations recorded matching &ldquo;{filterSeverity}&rdquo; filter.</p>
              </div>
            ) : (
              filteredViolations.map((v) => (
                <div
                  key={v.id}
                  className={`inspector-item-card ${activeViolation?.id === v.id ? 'selected' : ''}`}
                  onClick={() => setSelectedViolation(v)}
                >
                  <div className="card-top">
                    <span className={`sev-badge sev-${v.severity.toLowerCase()}`}>
                      {v.severity}
                    </span>
                    {v.timestamp && <span className="card-timestamp">@{v.timestamp}</span>}
                  </div>
                  <div className="card-title">{v.title}</div>
                  <div className="card-snippet">{v.description.slice(0, 100)}...</div>
                </div>
              ))
            )}
          </div>

          {/* Right Column: Active Violation & Summary Report */}
          <div className="inspector-detail-col">
            {activeViolation ? (
              <div className="active-violation-panel">
                <div className="panel-badge-row">
                  <span className={`sev-badge sev-${activeViolation.severity.toLowerCase()}`}>
                    SEVERITY: {activeViolation.severity}
                  </span>
                  {activeViolation.timestamp && (
                    <span className="timestamp-badge">FRAME TIMESTAMP: {activeViolation.timestamp}</span>
                  )}
                </div>

                <h3 className="panel-title">{activeViolation.title}</h3>
                
                <div className="panel-section">
                  <span className="section-label">DETAILED EVIDENCE &amp; REASONING</span>
                  <div className="panel-desc-box">{activeViolation.description}</div>
                </div>

                <div className="panel-section">
                  <span className="section-label">RECOMMENDED REGULATORY ACTION</span>
                  <div className="panel-action-box">
                    Flag video section for editorial redaction. Verify adherence to FTC disclosure / privacy safeguards.
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty-panel">
                <Info size={28} />
                <p>Select a violation from the left list to view forensic breakdown.</p>
              </div>
            )}

            {/* Final Markdown Report Preview */}
            <div className="report-markdown-preview">
              <span className="section-label">LANGGRAPH EXECUTIVE REPORT</span>
              <pre className="report-pre">{reportText}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
