import React from 'react';
import { ShieldAlert } from './Icons';

export default function ComplianceRadar({ result, violationsCount = 0 }) {
  // Score calculations based on violations
  const basePenalty = Math.min(45, violationsCount * 9);
  const scores = [
    { label: "FTC DISCLOSURE", val: Math.max(50, 95 - basePenalty), max: 100 },
    { label: "AUDIO CLARITY", val: 98, max: 100 },
    { label: "VISUAL CONSPICUITY", val: Math.max(55, 92 - basePenalty * 0.8), max: 100 },
    { label: "ENDORSEMENT TAG", val: Math.max(60, 90 - basePenalty * 0.6), max: 100 },
    { label: "TRUTH IN ADS", val: Math.max(65, 96 - basePenalty * 0.5), max: 100 }
  ];

  const overallScore = Math.round(
    scores.reduce((acc, curr) => acc + curr.val, 0) / scores.length
  );

  const cx = 150;
  const cy = 135;
  const r = 90;
  const total = scores.length;

  // Compute pentagon points for given radius
  const getPolygonPoints = (radiusMultiplier) => {
    return Array.from({ length: total }).map((_, i) => {
      const angle = (Math.PI * 2 / total) * i - Math.PI / 2;
      const x = cx + r * radiusMultiplier * Math.cos(angle);
      const y = cy + r * radiusMultiplier * Math.sin(angle);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
  };

  // Compute data polygon points
  const dataPoints = scores.map((s, i) => {
    const ratio = s.val / s.max;
    const angle = (Math.PI * 2 / total) * i - Math.PI / 2;
    const x = cx + r * ratio * Math.cos(angle);
    const y = cy + r * ratio * Math.sin(angle);
    return { x, y, score: s.val, label: s.label };
  });

  const dataPolygonString = dataPoints.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  return (
    <div className="compliance-radar-card">
      <div className="radar-header">
        <div className="radar-title-group">
          <span className="radar-tag">[ REGULATORY AUDIT RADAR ]</span>
          <h3>Multi-Axis Compliance Assessment</h3>
        </div>
        <div className="radar-score-badge">
          <span className="score-number">{overallScore}</span>
          <span className="score-total">/ 100</span>
        </div>
      </div>

      <div className="radar-svg-wrap">
        <svg viewBox="0 0 300 270" className="radar-svg">
          <defs>
            <linearGradient id="radarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          {/* Concentric Guide Pentagons */}
          {[0.25, 0.5, 0.75, 1.0].map((level) => (
            <polygon
              key={level}
              points={getPolygonPoints(level)}
              fill="none"
              stroke="#e2e8f0"
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
                stroke="#e2e8f0"
                className="radar-axis-line"
              />
            );
          })}

          {/* Filled Data Polygon */}
          <polygon
            points={dataPolygonString}
            fill="url(#radarGrad)"
            stroke="#0284c7"
            strokeWidth="2"
            className="radar-data-polygon"
          />

          {/* Data Points and Corner Labels */}
          {dataPoints.map((p, i) => {
            const angle = (Math.PI * 2 / total) * i - Math.PI / 2;
            const lx = cx + (r + 26) * Math.cos(angle);
            const ly = cy + (r + 18) * Math.sin(angle);

            return (
              <g key={i}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="4"
                  fill="#0284c7"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  className="radar-dot"
                />
                <text
                  x={lx}
                  y={ly}
                  fontSize="8.5"
                  fontFamily="var(--font-mono)"
                  fill="currentColor"
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="radar-axis-text"
                >
                  {p.label} ({p.score}%)
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="radar-legend">
        <div className="legend-item">
          <span className="legend-dot pass"></span>
          <span>COMPLIANT RANGE (&gt;85%)</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot warn"></span>
          <span>FLAGGED DISCLOSURE REVIEW</span>
        </div>
      </div>
    </div>
  );
}

