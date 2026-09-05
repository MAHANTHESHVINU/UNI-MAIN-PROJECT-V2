import React, { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle, ArrowRight, Play, RefreshCw, Cpu, Volume2, VolumeX } from './Icons';

export default function GuideDialogue({
  auditState,
  onPickSample,
  onResetAudit,
  onOpenInspector,
  soundEnabled,
  setSoundEnabled
}) {
  const { loading, result, violationsCount } = auditState;
  const [displayedText, setDisplayedText] = useState("");
  const [fullMessage, setFullMessage] = useState("");

  // Determine current narrative script based on lifecycle
  useEffect(() => {
    let msg = "";
    if (loading) {
      msg = "Hold on tight! I'm actively analyzing video keyframes, extracting OCR overlays, and validating disclosures against FTC guidelines...";
    } else if (result) {
      if (violationsCount > 0) {
        msg = `Inspection concluded! We detected ${violationsCount} potential compliance violations across the video stream. Let's inspect the evidence together.`;
      } else {
        msg = "Audit cleared! Every frame meets full compliance standards with zero deceptive patterns detected.";
      }
    } else {
      msg = "Hello! I'm your AI compliance officer. I'll navigate you through inspecting any video stream for regulatory violations. Paste a video URL below to start!";
    }
    setFullMessage(msg);
  }, [loading, result, violationsCount]);

  // Smooth typewriter effect
  useEffect(() => {
    setDisplayedText("");
    let i = 0;
    const interval = setInterval(() => {
      if (i < fullMessage.length) {
        setDisplayedText(fullMessage.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 18);
    return () => clearInterval(interval);
  }, [fullMessage]);

  return (
    <div className="guide-dialogue-card">
      {/* Speech Bubble Arrow */}
      <div className="guide-speech-arrow"></div>

      <div className="dialogue-header">
        <div className="agent-identity">
          <span className="agent-avatar-badge">
            <span className="avatar-core"></span>
          </span>
          <div className="agent-text-meta">
            <span className="agent-name">ALEX // COMPLIANCE NAVIGATOR</span>
            <span className="agent-role">AUTONOMOUS REGULATORY AGENT</span>
          </div>
        </div>

        <div className="dialogue-tools">
          <button
            className="dialogue-icon-btn"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? "Mute Guide Voice" : "Enable Guide Voice"}
          >
            {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </button>
        </div>
      </div>

      {/* Typewritten Dialogue Body */}
      <div className="dialogue-body">
        <p className="dialogue-speech-text">
          {displayedText}
          <span className="dialogue-cursor">|</span>
        </p>
      </div>

      {/* Interactive Contextual Actions */}
      <div className="dialogue-actions-row">
        {loading ? (
          <div className="scanning-pill-status">
            <span className="scanning-spinner"></span>
            <span>FRAME ANALYSIS IN PROGRESS...</span>
          </div>
        ) : result ? (
          <div className="verdict-actions-group">
            {violationsCount > 0 ? (
              <button className="btn-guide-action danger" onClick={onOpenInspector}>
                <ShieldAlert size={14} /> INSPECT {violationsCount} VIOLATIONS <ArrowRight size={14} />
              </button>
            ) : (
              <button className="btn-guide-action success" onClick={onOpenInspector}>
                <CheckCircle size={14} /> VIEW COMPLIANCE CERTIFICATE <ArrowRight size={14} />
              </button>
            )}
            <button className="btn-guide-action subtle" onClick={onResetAudit}>
              <RefreshCw size={13} /> AUDIT ANOTHER VIDEO
            </button>
          </div>
        ) : (
          <div className="quick-suggestions-row">
            <span className="suggestions-lbl">TRY A TEST CASE:</span>
            <button
              className="suggestion-chip"
              onClick={() => onPickSample("https://youtu.be/V5TdVernYqU?si=x_J4A20J6Wy3rqbZ")}
            >
              Sponsored Ad Sample
            </button>
            <button
              className="suggestion-chip"
              onClick={() => onPickSample("https://www.youtube.com/watch?v=dQw4w9WgXcQ")}
            >
              Benchmark Music Video
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
