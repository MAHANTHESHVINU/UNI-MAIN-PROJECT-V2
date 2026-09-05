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
      // If timestamp exists, parse mm:ss or generate distributed point
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
    <div className="video-timeline-deck-card">
      <div className="deck-header">
        <div className="deck-title-row">
          <span className="deck-tag">[ FORENSIC VIDEO TIMELINE ]</span>
          <h3>Temporal Keyframe Inspection</h3>
        </div>
        <div className="deck-meta">
          <span className="marker-count">{violations.length} VIOLATION PINS</span>
        </div>
      </div>

      {/* Embedded Video Player or Aesthetic Frame Deck */}
      <div className="video-player-container">
        {embedUrl ? (
          <iframe
            src={embedUrl}
            title="Video Audit Player"
            className="video-iframe"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="video-mock-fallback">
            <div className="mock-reticle">
              <Play size={28} className="mock-play" />
              <span>INSPECTION FRAME STREAM</span>
              <span className="mock-url">{videoUrl || "https://youtu.be/sample"}</span>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Timeline Scrubber Bar */}
      <div className="timeline-scrubber-section">
        <div className="timeline-labels-row">
          <span>00:00 [ START ]</span>
          <span className="timeline-instruction">CLICK MARKER TO JUMP TO FINDING</span>
          <span>END OF STREAM</span>
        </div>

        <div className="timeline-track-bar">
          {/* Subtle Progress Fill */}
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

                {/* Rich Floating Tooltip on Hover */}
                {(isHovered || isSelected) && (
                  <div className="pin-popover-tooltip">
                    <div className="popover-top">
                      <span className={`popover-badge sev-${marker.severity.toLowerCase()}`}>
                        {marker.severity}
                      </span>
                      <span className="popover-time">
                        {marker.timestamp || `FRAME #${marker.id * 24}`}
                      </span>
                    </div>
                    <div className="popover-title">{marker.title}</div>
                    <div className="popover-cta">Click to view details &darr;</div>
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

