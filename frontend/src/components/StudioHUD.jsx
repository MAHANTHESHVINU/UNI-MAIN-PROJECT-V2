import React, { useState, useEffect } from 'react';
import { Monitor, Server, Eye, BarChart3, Volume2, VolumeX, Maximize2, RefreshCw } from './Icons';

// Web Audio API synth sound generator
const playTechChirp = (type = 'click') => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === 'click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.04);
    } else if (type === 'action') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.08);
    }
  } catch {
    // AudioContext blocked or not supported
  }
};

export default function StudioHUD({
  targetView,
  setTargetView,
  auditState,
  onResetAudit,
  showDetailModal,
  setShowDetailModal
}) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [clock, setClock] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setClock(now.toLocaleTimeString('en-US', { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleNavClick = (view) => {
    if (soundEnabled) playTechChirp('click');
    setTargetView(view);
  };

  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
    if (!soundEnabled) playTechChirp('action');
  };

  const toggleFullscreen = () => {
    if (soundEnabled) playTechChirp('click');
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div className="studio-hud-overlay">
      {/* Top Studio Bar */}
      <header className="studio-topbar">
        <div className="studio-brand">
          <div className="studio-logo-pulse"></div>
          <div className="studio-title-group">
            <span className="studio-name">NEXUS // STUDIO</span>
            <span className="studio-sub">GRAFFICO 3D COMPLIANCE LAB</span>
          </div>
        </div>

        {/* Center Live System Status */}
        <div className="studio-status-pill">
          <span className={`status-indicator ${auditState.loading ? 'loading' : auditState.result ? 'active' : 'idle'}`}></span>
          <span className="status-label">
            {auditState.loading
              ? 'RUNNING VIDEO AUDIT & FRAME ANALYSIS'
              : auditState.result
              ? `SESSION: ${auditState.result.video_id || 'COMPLETED'}`
              : 'SYSTEM READY // IDLE'}
          </span>
        </div>

        {/* Right Tools */}
        <div className="studio-right-tools">
          <span className="studio-clock">{clock} UTC</span>
          <button
            className={`hud-icon-btn ${soundEnabled ? 'active' : ''}`}
            onClick={toggleSound}
            title="Toggle Audio Feedback"
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          <button
            className="hud-icon-btn"
            onClick={toggleFullscreen}
            title="Toggle Fullscreen"
          >
            <Maximize2 size={16} />
          </button>
          {auditState.result && (
            <button
              className="hud-action-pill"
              onClick={() => {
                if (soundEnabled) playTechChirp('action');
                setShowDetailModal(true);
              }}
            >
              INSPECT VIOLATIONS
            </button>
          )}
        </div>
      </header>

      {/* Bottom Floating Camera Switcher Dock */}
      <nav className="studio-dock">
        <div className="dock-container">
          <button
            className={`dock-btn ${targetView === 'overview' ? 'active' : ''}`}
            onClick={() => handleNavClick('overview')}
            title="Isometric Room Overview"
          >
            <Eye size={18} />
            <span>ROOM VIEW</span>
          </button>

          <button
            className={`dock-btn ${targetView === 'terminal' ? 'active' : ''}`}
            onClick={() => handleNavClick('terminal')}
            title="Workstation Audit Terminal"
          >
            <Monitor size={18} />
            <span>AUDIT TERMINAL</span>
          </button>

          <button
            className={`dock-btn ${targetView === 'servers' ? 'active' : ''}`}
            onClick={() => handleNavClick('servers')}
            title="Server Cluster"
          >
            <Server size={18} />
            <span>DATA CORE</span>
          </button>

          <button
            className={`dock-btn ${targetView === 'results' ? 'active' : ''}`}
            onClick={() => handleNavClick('results')}
            title="Live Telemetry"
          >
            <BarChart3 size={18} />
            <span>TELEMETRY</span>
          </button>

          {auditState.result && (
            <button
              className="dock-btn dock-reset"
              onClick={() => {
                if (soundEnabled) playTechChirp('click');
                onResetAudit();
              }}
              title="Start New Audit"
            >
              <RefreshCw size={18} />
              <span>NEW AUDIT</span>
            </button>
          )}
        </div>
      </nav>
    </div>
  );
}
