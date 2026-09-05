import React, { useState, useMemo } from 'react';
import { Play, ShieldAlert, AlertCircle, Eye } from './Icons';

// Extract YouTube ID if valid
function getYouTubeEmbedUrl(url) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
}

export default function VideoTimelineDeck({
  videoUrl,
  violations = [],
  onSelectViolation,
  selectedViolationId
}) {
  const [activeHoverPin, setActiveHoverPin] = useState(null);
  const embedUrl = useMemo(() => getYouTubeEmbedUrl(videoUrl), [videoUrl]);

  // Generate timeline markers with normalized percentages
  const timelineMarkers = useMemo(() => {
    if (violations.length === 0) return [];
    return violations.map((v, i) => {
      let percent = 15 + ((i * 22) % 75);
      if (v.timestamp && typeof v.timestamp === 'string') {
        const parts = v.timestamp.split(':');
        if (parts.length === 2) {
          const secs = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
          percent = Math.min(95, Math.max(5, (secs % 180) / 1.8));
        }
      }
      return {
        ...v,
        percent,
        markerId: v.id
      };
    });
  }, [violations]);

  return (
    <div className="technical-card video-timeline-deck-card">
      {/* Corner Crosshair Reticles */}
      <span className="card-reticle top-left">+</span>
      <span className="card-reticle top-right">+</span>
      <span className="card-reticle bottom-left">+</span>
      <span className="card-reticle bottom-right">+</span>

      <div className="deck-header">
        <div className="deck-title-row">
          <span className="tech-badge-inline">[ TEMPORAL_INSPECTOR // CAM_01 ]</span>
          <h3 className="tech-heading">FRAME SCANNER &bull; SMPTE TIMECODE</h3>
        </div>
        <div className="deck-meta">
          <span className="marker-count tech-count-tag">{violations.length} ANOMALIES PINNED</span>
        </div>
      </div>

      {/* Embedded Video Player or Technical HUD Viewport */}
      <div className="video-player-container technical-player-viewport">
        {embedUrl ? (
          <iframe
            src={embedUrl}
            title="Video Audit Player"
            className="video-iframe"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="video-mock-fallback technical-hud-grid">
            <div className="hud-aim-crosshair"></div>
            <div className="mock-reticle">
              <Play size={24} className="mock-play" />
              <span className="hud-target-text">TARGET_STREAM: 1920x1080@60FPS</span>
              <span className="mock-url">{videoUrl || "https://youtu.be/sample_stream"}</span>
            </div>
            <div className="hud-corner-readout tl">FPS: 59.94</div>
            <div className="hud-corner-readout tr">SMPTE: 00:00:00:00</div>
            <div className="hud-corner-readout bl">ISO: 400</div>
            <div className="hud-corner-readout br">BURST: 24-FRM</div>
          </div>
        )}
      </div>

      {/* Interactive Timeline Scrubber Bar */}
      <div className="timeline-scrubber-section">
        <div className="timeline-labels-row technical-labels">
          <span>00:00:00:00 [ IN ]</span>
          <span className="timeline-instruction">[ SCRUB_TIMELINE &bull; SELECT PIN TO LOCATE ]</span>
          <span>00:03:00:00 [ OUT ]</span>
        </div>

        <div className="timeline-track-bar technical-track-bar">
          <div className="timeline-track-fill"></div>

          {/* Color-Coded Temporal Pins */}
          {timelineMarkers.map((marker) => {
            const isSelected = selectedViolationId === marker.markerId;
            const isHovered = activeHoverPin === marker.markerId;

            return (
              <div
                key={marker.markerId}
                className={`timeline-pin pin-${marker.severity.toLowerCase()} ${isSelected ? 'selected' : ''}`}
                style={{ left: `${marker.percent}%` }}
                onMouseEnter={() => setActiveHoverPin(marker.markerId)}
                onMouseLeave={() => setActiveHoverPin(null)}
                onClick={() => onSelectViolation(marker.markerId)}
              >
                <div className="pin-head"></div>
                <div className="pin-stem"></div>

                {/* Technical Floating Tooltip */}
                {(isHovered || isSelected) && (
                  <div className="pin-popover-tooltip technical-tooltip">
                    <div className="popover-top">
                      <span className={`popover-badge sev-${marker.severity.toLowerCase()}`}>
                        {marker.severity}
                      </span>
                      <span className="popover-time">
                        SMPTE: {marker.timestamp ? `${marker.timestamp}:00` : `FRM_${marker.id * 24}`}
                      </span>
                    </div>
                    <div className="popover-title">{marker.title}</div>
                    <div className="popover-cta">&gt;&gt; JUMP TO AUDIT RECORD</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
