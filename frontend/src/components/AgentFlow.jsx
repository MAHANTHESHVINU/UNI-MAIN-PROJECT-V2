import React from 'react';
import { Cpu, ShieldAlert, CheckCircle, ArrowRight } from './Icons';

export default function AgentFlow({ loading, result }) {
  const steps = [
    { id: '01', name: 'STREAM INGEST', desc: 'Demux & buffer audio/video frames', state: loading ? 'active' : result ? 'done' : 'idle' },
    { id: '02', name: 'LIDAR OCR VISION', desc: 'Azure VI scene & text detection', state: loading ? 'active' : result ? 'done' : 'idle' },
    { id: '03', name: 'WHISPER STT', desc: 'Multi-lingual audio transcription', state: loading ? 'active' : result ? 'done' : 'idle' },
    { id: '04', name: 'LANGGRAPH REASONER', desc: 'FTC & regulatory compliance graph', state: loading ? 'active' : result ? 'done' : 'idle' },
    { id: '05', name: 'FORENSIC DOSSIER', desc: 'Violation verification & risk score', state: result ? 'done' : 'idle' }
  ];

  return (
    <section className="agent-flow-section">
      <div className="section-header-row">
        <div className="section-title-group">
          <span className="section-num-pill">02</span>
          <span className="section-tag-label">[ PIPELINE ARCHITECTURE ]</span>
        </div>
        <div className="section-status-pill">
          <span className={`status-dot ${loading ? 'pulse' : result ? 'online' : 'ready'}`}></span>
          <span>{loading ? 'AGENTS DISPATCHED // EXECUTING GRAPH' : result ? 'SESSION COMPLETED' : 'STANDBY // READY'}</span>
        </div>
      </div>

      <div className="flow-grid">
        {steps.map((s, idx) => (
          <div key={s.id} className={`flow-node-card ${s.state}`}>
            <div className="node-top">
              <span className="node-id">{s.id}</span>
              <span className={`node-badge badge-${s.state}`}>{s.state.toUpperCase()}</span>
            </div>
            <div className="node-name">{s.name}</div>
            <div className="node-desc">{s.desc}</div>
            {idx < steps.length - 1 && (
              <div className="node-connector">
                <ArrowRight size={12} className="connector-arrow" />
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
