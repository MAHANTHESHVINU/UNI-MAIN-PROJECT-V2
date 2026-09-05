import React from 'react';
import { ShieldAlert } from './Icons';

export default function ComplianceRadar({ result, violationsCount = 0 }) {
  const basePenalty = Math.min(45, violationsCount * 9);
  const scores = [
    { label: "FTC_DISCLOSURE", code: "RULE_16_CFR", val: Math.max(50, 95 - basePenalty), max: 100 },
    { label: "AUDIO_CLARITY", code: "STT_CONF", val: 98, max: 100 },
    { label: "VISUAL_CONSPICUITY", code: "OCR_PROMINENCE", val: Math.max(55, 92 - basePenalty * 0.8), max: 100 },
    { label: "ENDORSEMENT_TAG", code: "AFFILIATE_LINK", val: Math.max(60, 90 - basePenalty * 0.6), max: 100 },
    { label: "TRUTH_IN_ADS", code: "CLAIM_SUBSTANT", val: Math.max(65, 96 - basePenalty * 0.5), max: 100 }
  ];

  const overallScore = Math.round(
    scores.reduce((acc, curr) => acc + curr.val, 0) / scores.length
  );

  const cx = 150;
  const cy = 135;
  const r = 85;
  const total = scores.length;

  const getPolygonPoints = (radiusMultiplier) => {
    return Array.from({ length: total }).map((_, i) => {
      const angle = (Math.PI * 2 / total) * i - Math.PI / 2;
      const x = cx + r * radiusMultiplier * Math.cos(angle);
      const y = cy + r * radiusMultiplier * Math.sin(angle);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
  };

  const dataPoints = scores.map((s, i) => {
    const ratio = s.val / s.max;
    const angle = (Math.PI * 2 / total) * i - Math.PI / 2;
    const x = cx + r * ratio * Math.cos(angle);
    const y = cy + r * ratio * Math.sin(angle);
    return { x, y, score: s.val, label: s.label, code: s.code };
  });

  const dataPolygonString = dataPoints.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  return (
    <div className="technical-card compliance-radar-card">
      {/* Corner Crosshair Reticles */}
      <span className="card-reticle top-left">+</span>
      <span className="card-reticle top-right">+</span>
      <span className="card-reticle bottom-left">+</span>
      <span className="card-reticle bottom-right">+</span>

      <div className="radar-header">
        <div className="radar-title-group">
          <span className="tech-badge-inline">[ POLAR_RADAR // MOD_05 ]</span>
          <h3 className="tech-heading">REGULATORY VECTOR MATRIX</h3>
        </div>
        <div className="radar-score-badge technical-score-badge">
          <span className="score-prefix">INDEX:</span>
          <span className="score-number">{overallScore}</span>
          <span className="score-total">/100</span>
        </div>
      </div>

      <div className="radar-svg-wrap">
        <svg viewBox="0 0 300 270" className="radar-svg technical-radar-svg">
          <defs>
            <linearGradient id="radarTechGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.15" />
            </linearGradient>
          </defs>

          {/* Tactical Circular Compass Range Rings */}
          <circle cx={cx} cy={cy} r={r * 1.15} fill="none" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 4" />
          <circle cx={cx} cy={cy} r={r * 0.5} fill="none" stroke="rgba(255,255,255,0.06)" strokeDasharray="2 3" />

          {/* Degree Ticks */}
          {[0, 72, 144, 216, 288].map((deg, idx) => {
            const rad = ((deg - 90) * Math.PI) / 180;
            const tx = cx + (r * 1.25) * Math.cos(rad);
            const ty = cy + (r * 1.25) * Math.sin(rad);
            return (
              <text
                key={idx}
                x={tx}
                y={ty}
                fontSize="7"
                fontFamily="var(--font-mono)"
                fill="var(--text-muted)"
                textAnchor="middle"
                dominantBaseline="central"
              >
                {String(deg).padStart(3, '0')}°
              </text>
            );
          })}

          {/* Concentric Guide Pentagons */}
          {[0.25, 0.5, 0.75, 1.0].map((level) => (
            <polygon
              key={level}
              points={getPolygonPoints(level)}
              fill="none"
              stroke="rgba(255,255,255,0.12)"
              strokeDasharray={level === 1.0 ? "none" : "2 3"}
              className="radar-grid-line"
            />
          ))}

          {/* Radial Axis Lines */}
          {Array.from({ length: total }).map((_, i) => {
            const angle = (Math.PI * 2 / total) * i - Math.PI / 2;
            const x = cx + r * Math.cos(angle);
            const y = cy + r * Math.sin(angle);
            return (
              <line
                key={i}
                x1={cx}
                y1={cy}
                x2={x}
                y2={y}
                stroke="rgba(255,255,255,0.15)"
                className="radar-axis-line"
              />
            );
          })}

          {/* Center Crosshair */}
          <line x1={cx - 8} y1={cy} x2={cx + 8} y2={cy} stroke="#00f0ff" strokeWidth="1" opacity="0.6" />
          <line x1={cx} y1={cy - 8} x2={cx} y2={cy + 8} stroke="#00f0ff" strokeWidth="1" opacity="0.6" />

          {/* Filled Data Polygon */}
          <polygon
            points={dataPolygonString}
            fill="url(#radarTechGrad)"
            stroke="#00f0ff"
            strokeWidth="1.8"
            className="radar-data-polygon"
          />

          {/* Data Points and Technical Labels */}
          {dataPoints.map((p, i) => {
            const angle = (Math.PI * 2 / total) * i - Math.PI / 2;
            const lx = cx + (r + 26) * Math.cos(angle);
            const ly = cy + (r + 16) * Math.sin(angle);

            return (
              <g key={i}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="3.5"
                  fill="#00f0ff"
                  stroke="#080a0f"
                  strokeWidth="1.5"
                />
                <text
                  x={lx}
                  y={ly}
                  fontSize="7.5"
                  fontFamily="var(--font-mono)"
                  fill="var(--text-secondary)"
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  {p.label} [{p.score}%]
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="radar-legend technical-legend">
        <div className="legend-item">
          <span className="legend-dot pass"></span>
          <span>RANGE_NOMINAL &gt; 85%</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot warn"></span>
          <span>RANGE_FLAGGED &le; 85%</span>
        </div>
        <div className="legend-readout">
          <span>POLAR_RES: 0.1°</span>
        </div>
      </div>
    </div>
  );
}
