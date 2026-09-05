import React from 'react';
import { Volume2, Cpu } from './Icons';

export default function AudioSpectrogram({ loading, result }) {
  const dbLevels = ["0dB", "-6dB", "-12dB", "-24dB", "-48dB"];

  return (
    <div className={`technical-card spectrogram-card ${loading ? 'active' : ''}`}>
      {/* Corner Crosshair Reticles */}
      <span className="card-reticle top-left">+</span>
      <span className="card-reticle top-right">+</span>
      <span className="card-reticle bottom-left">+</span>
      <span className="card-reticle bottom-right">+</span>

      <div className="spectrogram-header">
        <div className="spectrogram-title">
          <span className="tech-badge-inline">[ TELEMETRY // STT_02 ]</span>
          <span>ACOUSTIC HARMONICS &bull; 48,000 Hz FFT SPECTRUM</span>
        </div>
        <div className="spectrogram-meta">
          <span className="tech-readout">FFT_SIZE: 512</span>
          <span className={`meta-pill ${loading ? 'active' : ''}`}>
            {loading ? 'DEMUXING_PACKETS' : result ? 'SPECTRUM_SYNCED' : 'STANDBY // READY'}
          </span>
        </div>
      </div>

      {/* Main Waveform & dB Scale Layout */}
      <div className="spectrum-analyzer-layout">
        {/* dB Vertical Scale */}
        <div className="db-scale-axis">
          {dbLevels.map((db, i) => (
            <span key={i} className="db-tick">{db}</span>
          ))}
        </div>

        {/* Dynamic Animated Waveform Bars */}
        <div className="waveform-container technical-waveform">
          {Array.from({ length: 48 }).map((_, i) => {
            const baseHeight = 18 + Math.sin(i * 0.35) * 28 + Math.cos(i * 0.7) * 22;
            const animDelay = (i * 0.04).toFixed(2);
            const duration = (0.5 + (i % 6) * 0.12).toFixed(2);

            return (
              <div
                key={i}
                className={`wave-bar ${loading ? 'pulse' : ''}`}
                style={{
                  height: loading ? undefined : `${Math.max(14, Math.min(92, baseHeight))}%`,
                  animationDelay: `${animDelay}s`,
                  animationDuration: `${duration}s`
                }}
              ></div>
            );
          })}
        </div>
      </div>

      <div className="spectrogram-footer">
        <div className="stream-ticker">
          <Cpu size={12} />
          <span>WINDOW: HANNING &bull; OVERLAP: 75% &bull; SAMPLE_RATE: 48kHz &bull; CODEC: OPUS/AAC</span>
        </div>
        <div className="spectrogram-hz">
          <span>20 Hz</span>
          <span className="hz-ruler">&mdash;&mdash;&mdash;&mdash;&mdash;&mdash;&mdash;&mdash;&mdash;&mdash;</span>
          <span>24,000 Hz</span>
        </div>
      </div>
    </div>
  );
}
