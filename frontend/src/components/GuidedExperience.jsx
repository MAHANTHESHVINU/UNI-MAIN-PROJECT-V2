import React, { Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import NavigatorAgent from './NavigatorAgent';
import GuideDialogue from './GuideDialogue';
import { Play, AlertCircle, RefreshCw } from './Icons';

export default function GuidedExperience({
  videoUrl,
  setVideoUrl,
  loading,
  error,
  result,
  violations,
  onStartAudit,
  onResetAudit,
  onOpenInspector,
  theme = 'light'
}) {
  const isLight = theme === 'light';
  const inputRef = useRef();

  const handlePickSample = (url) => {
    setVideoUrl(url);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className={`guided-experience-container ${isLight ? 'theme-light' : 'theme-dark'}`}>
      {/* Background Architectural Elements */}
      <div className="guided-bg-glow"></div>

      {/* Main Guided Stage Grid */}
      <div className="guided-stage-grid">
        {/* Left Column: 3D Character Stage */}
        <div className="character-stage-column">
          <div className="stage-canvas-wrap">
            <Canvas
              shadows
              camera={{ position: [0, 0.4, 3.2], fov: 38 }}
              gl={{
                antialias: true,
                alpha: true,
                powerPreference: 'high-performance',
                toneMapping: THREE.ACESFilmicToneMapping,
                toneMappingExposure: isLight ? 1.25 : 1.4
              }}
            >
              {/* Studio Key & Ambient Light */}
              <ambientLight intensity={isLight ? 0.9 : 0.5} />
              <directionalLight
                position={[3, 5, 4]}
                intensity={isLight ? 2.2 : 1.4}
                castShadow
                shadow-mapSize-width={1024}
                shadow-mapSize-height={1024}
                color="#ffffff"
              />
              {/* Colored Rim Light (Cyan/Purple for tech look) */}
              <pointLight
                position={[-2.5, 1.5, -1]}
                intensity={loading ? 1.5 : 0.8}
                color={loading ? "#a855f7" : "#00e5ff"}
                distance={6}
              />
              <pointLight
                position={[2.5, -1, 1]}
                intensity={0.5}
                color="#f59e0b"
                distance={5}
              />

              {/* 3D Humanoid Navigator Character */}
              <Suspense fallback={null}>
                <NavigatorAgent
                  auditState={{ loading, result, violationsCount: violations.length }}
                  theme={theme}
                />
              </Suspense>

              {/* Soft Floor Shadow */}
              <ContactShadows
                position={[0, -1.35, 0]}
                opacity={0.65}
                scale={4.5}
                blur={1.8}
                far={3}
              />

              {/* Subtle Orbit with strict limits */}
              <OrbitControls
                enableZoom={false}
                enablePan={false}
                minPolarAngle={Math.PI / 2.3}
                maxPolarAngle={Math.PI / 1.85}
                minAzimuthAngle={-Math.PI / 6}
                maxAzimuthAngle={Math.PI / 6}
                dampingFactor={0.08}
              />
            </Canvas>
          </div>

          {/* Interactive Mouse Guide Tip */}
          <div className="mouse-tracker-hint">
            <span className="dot-radar"></span>
            <span>MOVE CURSOR &bull; CHARACTER TRACKS YOUR GAZE</span>
          </div>
        </div>

        {/* Right Column: Narrative Speech Dialogue & Audit Controls */}
        <div className="guided-controls-column">
          {/* Step 1: Character's Speech Bubble & Step Narrative */}
          <GuideDialogue
            auditState={{ loading, result, violationsCount: violations.length }}
            onPickSample={handlePickSample}
            onResetAudit={onResetAudit}
            onOpenInspector={onOpenInspector}
            soundEnabled={true}
            setSoundEnabled={() => {}}
          />

          {/* Step 2: Interactive Ingestion Console (Pointed to by Character) */}
          <div className="guided-input-card">
            <div className="input-card-header">
              <span className="step-badge">[ STEP 01 // INGESTION ]</span>
              <span className="format-note">YOUTUBE &bull; MP4 &bull; WEBM</span>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                onStartAudit();
              }}
              className="guided-form"
            >
              <div className="guided-input-box">
                <input
                  ref={inputRef}
                  type="text"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="Paste video stream URL (e.g. https://youtu.be/...)"
                  className="guided-text-input"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={!videoUrl.trim() || loading}
                  className={`btn-guided-submit ${loading ? 'loading' : ''}`}
                >
                  {loading ? (
                    <>
                      <span className="btn-spinner"></span>
                      <span>SCANNING...</span>
                    </>
                  ) : (
                    <>
                      <Play size={14} />
                      <span>START AUDIT</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {error && (
              <div className="guided-error-alert">
                <AlertCircle size={15} />
                <span>{error}</span>
              </div>
            )}

            {/* Quick Benchmark Chips */}
            <div className="guided-benchmarks">
              <span className="benchmarks-label">QUICK BENCHMARKS:</span>
              <button
                type="button"
                className="bench-chip"
                onClick={() => handlePickSample("https://youtu.be/V5TdVernYqU?si=x_J4A20J6Wy3rqbZ")}
              >
                Sample 1 (Sponsored Ad)
              </button>
              <button
                type="button"
                className="bench-chip"
                onClick={() => handlePickSample("https://www.youtube.com/watch?v=dQw4w9WgXcQ")}
              >
                Sample 2 (Benchmark Video)
              </button>
            </div>
          </div>

          {/* Step 3: Live Telemetry Deck */}
          <div className="guided-telemetry-deck">
            <div className="telemetry-item">
              <span className="telemetry-label">PIPELINE KERNEL</span>
              <span className="telemetry-val">LANGGRAPH 0.2</span>
            </div>
            <div className="telemetry-item">
              <span className="telemetry-label">INSPECTION ENGINE</span>
              <span className="telemetry-val">AZURE VI + WHISPER</span>
            </div>
            <div className="telemetry-item">
              <span className="telemetry-label">TEMPORAL PRECISION</span>
              <span className="telemetry-val text-cyan">&plusmn;0.02s</span>
            </div>
            <div className="telemetry-item">
              <span className="telemetry-label">HEAD-TRACKING</span>
              <span className="telemetry-val text-green">ACTIVE 60 FPS</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

