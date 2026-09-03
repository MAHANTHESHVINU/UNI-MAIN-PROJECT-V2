import React from 'react';

export default function RadialReticle({ loading, result }) {
  return (
    <div className="radial-reticle-container">
      {/* Precision Dome SVG Arc (Direct homage to drone.riotters.com) */}
      <svg
        className="radial-svg-arc"
        viewBox="0 0 960 480"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer Dotted Semi-Circle Arc */}
        <path
          d="M 40 480 A 440 440 0 0 1 920 480"
          stroke="#24363F"
          strokeOpacity="0.22"
          strokeWidth="1.2"
          strokeDasharray="4 6"
        />

        {/* Secondary Solid Precision Arc */}
        <path
          d="M 120 480 A 360 360 0 0 1 840 480"
          stroke="#24363F"
          strokeOpacity="0.14"
          strokeWidth="1"
        />

        {/* Inner Laser Track */}
        <path
          d="M 220 480 A 260 260 0 0 1 740 480"
          stroke={loading ? "#0284c7" : "#24363F"}
          strokeOpacity={loading ? "0.6" : "0.18"}
          strokeWidth="1.5"
          className={loading ? "arc-pulse-scan" : ""}
        />

        {/* Degree Markers & Ticks */}
        {[30, 60, 90, 120, 150].map((deg) => {
          const rad = (deg * Math.PI) / 180;
          const cx = 480;
          const cy = 480;
          const r1 = 430;
          const r2 = 450;
          const x1 = cx - r1 * Math.cos(rad);
          const y1 = cy - r1 * Math.sin(rad);
          const x2 = cx - r2 * Math.cos(rad);
          const y2 = cy - r2 * Math.sin(rad);

          return (
            <g key={deg}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#24363F"
                strokeOpacity="0.35"
                strokeWidth="1.5"
              />
              <text
                x={cx - 465 * Math.cos(rad)}
                y={cy - 465 * Math.sin(rad)}
                fill="#24363F"
                fillOpacity="0.45"
                fontSize="9"
                fontFamily="var(--font-mono)"
                textAnchor="middle"
                dominantBaseline="central"
              >
                {deg}°
              </text>
            </g>
          );
        })}

        {/* Central Top Reticle Diamond */}
        <g transform="translate(480, 40)">
          <circle cx="0" cy="0" r="14" stroke="#24363F" strokeOpacity="0.25" strokeWidth="1" />
          <circle cx="0" cy="0" r="3" fill="#0284c7" />
          <line x1="-18" y1="0" x2="18" y2="0" stroke="#24363F" strokeOpacity="0.3" strokeWidth="1" />
          <line x1="0" y1="-18" x2="0" y2="18" stroke="#24363F" strokeOpacity="0.3" strokeWidth="1" />
        </g>
      </svg>

      {/* Industrial Spec Callouts (Leader Lines) */}
      <div className="spec-callout callout-left">
        <div className="spec-metric">±0.02s</div>
        <div className="spec-label">[ TEMPORAL RESOLUTION ]</div>
        <div className="spec-sub">Frame-accurate audio &amp; OCR synchronization</div>
        <div className="spec-leader-line left-line"></div>
      </div>

      <div className="spec-callout callout-center">
        <div className="spec-metric">240,000</div>
        <div className="spec-label">[ PTS/S LIDAR CAPTURE ]</div>
        <div className="spec-sub">Multi-modal visual embedding array</div>
      </div>

      <div className="spec-callout callout-right">
        <div className="spec-metric">99.4%</div>
        <div className="spec-label">[ REGULATORY RECALL ]</div>
        <div className="spec-sub">Autonomous LangGraph compliance agents</div>
        <div className="spec-leader-line right-line"></div>
      </div>
    </div>
  );
}
