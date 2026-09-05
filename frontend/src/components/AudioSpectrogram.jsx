import React from 'react';
import { Volume2, Cpu } from './Icons';

export default function AudioSpectrogram({ loading, result }) {
  return (
    <div className={`spectrogram-card ${loading ? 'active' : ''}`}>
      <div className="spectrogram-header">
        <div className="spectrogram-title">
          <Volume2 size={13} className="spectrogram-icon" />
          <span>MULTI-MODAL AUDIO SPECTRUM // 48kHz WHISPER STT</span>
        </div>
        <div className="spectrogram-meta">
          <span className={`meta-pill ${loading ? 'active' : ''}`}>
            {loading ? 'DEMUXING HARMONICS' : result ? 'AUDIO PARSED' : 'STANDBY'}
          </span>
        </div>
      </div>

      {/* Dynamic Animated Waveform Bars */}
      <div className="waveform-container">
        {Array.from({ length: 42 }).map((_, i) => {
          const baseHeight = 15 + Math.sin(i * 0.4) * 25 + Math.cos(i * 0.8) * 20;
          const animDelay = (i * 0.05).toFixed(2);
          const duration = (0.6 + (i % 5) * 0.15).toFixed(2);

          return (
            <div
              key={i}
              className={`wave-bar ${loading ? 'pulse' : ''}`}
              style={{
                height: loading ? undefined : `${Math.max(12, Math.min(85, baseHeight))}%`,
                animationDelay: `${animDelay}s`,
                animationDuration: `${duration}s`
              }}
            ></div>
          );
        })}
      </div>

      <div className="spectrogram-footer">
        <div className="stream-ticker">
          <Cpu size={12} />
          <span>FRAME EMBEDDINGS: 24 FPS &bull; TEMPORAL WINDOW: 2.0s &bull; FFT CHANNELS: 512</span>
        </div>
        <div className="spectrogram-hz">
          <span>20 Hz</span>
          <span>&mdash;&mdash;&mdash;&mdash;&mdash;&mdash;&mdash;&mdash;</span>
          <span>24 kHz</span>
        </div>
      </div>
    </div>
  );
}
