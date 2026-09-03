import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Float, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

// Smooth Camera Controller with animated lerp
function CameraController({ targetView, controlsRef }) {
  const cameraPositions = useMemo(() => ({
    overview: { pos: [4.8, 3.4, 5.2], target: [0, 0.9, 0] },
    terminal: { pos: [0, 1.45, 1.65], target: [0, 1.35, -0.2] },
    servers: { pos: [-2.0, 1.9, 1.8], target: [-2.2, 1.4, -0.6] },
    results: { pos: [2.0, 1.8, 2.2], target: [1.2, 1.2, 0] }
  }), []);

  const targetVec = useMemo(() => new THREE.Vector3(), []);
  const posVec = useMemo(() => new THREE.Vector3(), []);

  useFrame((state) => {
    const config = cameraPositions[targetView] || cameraPositions.overview;
    posVec.set(...config.pos);
    targetVec.set(...config.target);

    state.camera.position.lerp(posVec, 0.05);

    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetVec, 0.05);
      controlsRef.current.update();
    }
  });

  return null;
}

// Server Rack with blinking activity lights
function ServerRack({ onFocus, isLight }) {
  const ledsRef = useRef();

  useFrame(({ clock }) => {
    if (ledsRef.current) {
      const t = clock.getElapsedTime();
      ledsRef.current.children.forEach((led, idx) => {
        const speed = 2 + (idx % 4);
        led.material.opacity = (Math.sin(t * speed + idx) > 0.1) ? 0.95 : 0.2;
      });
    }
  });

  return (
    <group position={[-2.4, 0, -0.6]} onClick={(e) => { e.stopPropagation(); onFocus('servers'); }} style={{ cursor: 'pointer' }}>
      {/* Rack Frame */}
      <mesh position={[0, 1.3, 0]} castShadow>
        <boxGeometry args={[0.9, 2.6, 0.8]} />
        <meshStandardMaterial
          color={isLight ? "#e2e8f0" : "#0f172a"}
          roughness={0.4}
          metalness={isLight ? 0.3 : 0.8}
        />
      </mesh>
      {/* Front Glass Door */}
      <mesh position={[0, 1.3, 0.41]}>
        <planeGeometry args={[0.82, 2.45]} />
        <meshPhysicalMaterial
          color={isLight ? "#38bdf8" : "#06b6d4"}
          transparent
          opacity={isLight ? 0.35 : 0.25}
          roughness={0.1}
          transmission={0.7}
        />
      </mesh>
      {/* Internal Blades */}
      {[0.4, 0.75, 1.1, 1.45, 1.8, 2.15].map((y, i) => (
        <group key={i} position={[0, y, 0]}>
          <mesh>
            <boxGeometry args={[0.8, 0.24, 0.7]} />
            <meshStandardMaterial color={isLight ? "#cbd5e1" : "#1e293b"} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0, 0.36]}>
            <boxGeometry args={[0.76, 0.2, 0.02]} />
            <meshStandardMaterial color={isLight ? "#0f172a" : "#020617"} roughness={0.8} />
          </mesh>
        </group>
      ))}
      {/* Blinking LEDs */}
      <group ref={ledsRef}>
        {Array.from({ length: 18 }).map((_, i) => {
          const row = Math.floor(i / 3);
          const col = i % 3;
          const isError = i === 7 || i === 14;
          return (
            <mesh key={i} position={[-0.28 + col * 0.28, 0.4 + row * 0.35, 0.38]}>
              <sphereGeometry args={[0.025, 16, 16]} />
              <meshBasicMaterial
                color={isError ? "#ef4444" : "#10b981"}
                transparent
              />
            </mesh>
          );
        })}
      </group>
      <pointLight position={[0, 1.3, 0.6]} color="#00e5ff" intensity={isLight ? 0.3 : 0.5} distance={2.5} />
    </group>
  );
}

// Studio Speakers (Audio Monitors)
function StudioSpeakers({ isLight }) {
  return (
    <>
      {/* Left Speaker */}
      <group position={[-0.85, 0.94, -0.15]} rotation={[0, 0.25, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.16, 0.26, 0.16]} />
          <meshStandardMaterial color={isLight ? "#334155" : "#0f172a"} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.04, 0.082]}>
          <circleGeometry args={[0.05, 24]} />
          <meshStandardMaterial color={isLight ? "#e2e8f0" : "#f59e0b"} roughness={0.5} />
        </mesh>
        <mesh position={[0, -0.06, 0.082]}>
          <circleGeometry args={[0.03, 20]} />
          <meshStandardMaterial color="#020617" roughness={0.2} />
        </mesh>
      </group>

      {/* Right Speaker */}
      <group position={[0.85, 0.94, -0.15]} rotation={[0, -0.25, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.16, 0.26, 0.16]} />
          <meshStandardMaterial color={isLight ? "#334155" : "#0f172a"} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.04, 0.082]}>
          <circleGeometry args={[0.05, 24]} />
          <meshStandardMaterial color={isLight ? "#e2e8f0" : "#f59e0b"} roughness={0.5} />
        </mesh>
        <mesh position={[0, -0.06, 0.082]}>
          <circleGeometry args={[0.03, 20]} />
          <meshStandardMaterial color="#020617" roughness={0.2} />
        </mesh>
      </group>
    </>
  );
}

// Workstation Desk with Realistic Studio Details
function WorkstationDesk({ onFocus, activeView, auditState, isLight, children }) {
  const deskWoodColor = isLight ? "#d4a373" : "#1e293b"; // Natural blonde oak in light mode
  const metalLegsColor = isLight ? "#e2e8f0" : "#090d16";

  return (
    <group position={[0, 0, 0]}>
      {/* Desk Top (Natural Blonde Oak or Graphite) */}
      <mesh position={[0, 0.76, 0]} receiveShadow castShadow>
        <boxGeometry args={[2.5, 0.06, 1.15]} />
        <meshStandardMaterial color={deskWoodColor} roughness={0.4} metalness={0.1} />
      </mesh>

      {/* Desk Legs (Sleek minimalist steel legs) */}
      <mesh position={[-1.15, 0.38, 0]} castShadow>
        <boxGeometry args={[0.06, 0.76, 1.05]} />
        <meshStandardMaterial color={metalLegsColor} metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[1.15, 0.38, 0]} castShadow>
        <boxGeometry args={[0.06, 0.76, 1.05]} />
        <meshStandardMaterial color={metalLegsColor} metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Desk Cable Mat */}
      <mesh position={[0, 0.795, 0.08]}>
        <boxGeometry args={[1.6, 0.005, 0.65]} />
        <meshStandardMaterial color={isLight ? "#334155" : "#0b1120"} roughness={0.9} />
      </mesh>

      {/* Mechanical Keyboard */}
      <mesh position={[0, 0.81, 0.22]} castShadow>
        <boxGeometry args={[0.55, 0.025, 0.18]} />
        <meshStandardMaterial color={isLight ? "#f8fafc" : "#111827"} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.825, 0.22]}>
        <boxGeometry args={[0.52, 0.005, 0.15]} />
        <meshBasicMaterial color={isLight ? "#38bdf8" : "#00e5ff"} />
      </mesh>

      {/* Ergonomic Mouse */}
      <mesh position={[0.42, 0.81, 0.22]} castShadow>
        <boxGeometry args={[0.08, 0.03, 0.12]} />
        <meshStandardMaterial color={isLight ? "#cbd5e1" : "#1e293b"} roughness={0.3} />
      </mesh>

      {/* Audio Monitor Speakers */}
      <StudioSpeakers isLight={isLight} />

      {/* Main Screen Stand */}
      <mesh position={[0, 1.05, -0.28]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.55, 16]} />
        <meshStandardMaterial color={isLight ? "#94a3b8" : "#334155"} metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.795, -0.28]}>
        <cylinderGeometry args={[0.15, 0.15, 0.015, 24]} />
        <meshStandardMaterial color={isLight ? "#94a3b8" : "#334155"} metalness={0.8} />
      </mesh>

      {/* Main Curved Display Bezel */}
      <group position={[0, 1.36, -0.2]} onClick={(e) => { e.stopPropagation(); onFocus('terminal'); }}>
        <mesh castShadow>
          <boxGeometry args={[1.42, 0.7, 0.04]} />
          <meshStandardMaterial color={isLight ? "#1e293b" : "#0f172a"} roughness={0.3} metalness={0.6} />
        </mesh>
        
        {/* Back Ambient Glow */}
        <pointLight position={[0, 0, -0.15]} color={auditState.loading ? "#a855f7" : "#00e5ff"} intensity={isLight ? 0.3 : 0.6} distance={2} />

        {/* Embedded Interactive UI Screen */}
        <Html
          transform
          distanceFactor={1.1}
          position={[0, 0, 0.025]}
          style={{
            width: '880px',
            height: '420px',
            pointerEvents: activeView === 'terminal' || activeView === 'overview' ? 'auto' : 'none'
          }}
        >
          <div className={`virtual-screen-container ${isLight ? 'theme-light' : ''}`}>
            {children}
          </div>
        </Html>
      </group>

      {/* Secondary Monitor on Right */}
      <group position={[0.95, 1.35, -0.12]} rotation={[0, -0.38, 0]} onClick={(e) => { e.stopPropagation(); onFocus('results'); }}>
        <mesh castShadow>
          <boxGeometry args={[0.48, 0.72, 0.03]} />
          <meshStandardMaterial color={isLight ? "#1e293b" : "#0f172a"} roughness={0.4} metalness={0.7} />
        </mesh>
        <mesh position={[0, 0, 0.02]}>
          <planeGeometry args={[0.44, 0.68]} />
          <meshBasicMaterial color={isLight ? "#0f172a" : "#030712"} />
        </mesh>
        <Html
          transform
          distanceFactor={1.1}
          position={[0, 0, 0.025]}
          style={{ width: '300px', height: '460px', pointerEvents: 'none' }}
        >
          <div className={`secondary-telemetry-screen ${isLight ? 'theme-light' : ''}`}>
            <div className="sec-header">
              <span className="dot pulse"></span>
              <span>AUDIT TELEMETRY</span>
            </div>
            <div className="sec-metric">
              <span className="sec-lbl">SECURITY CORES</span>
              <span className="sec-val">12 / 12 ACTIVE</span>
            </div>
            <div className="sec-metric">
              <span className="sec-lbl">COMPLIANCE INDEX</span>
              <span className="sec-val sec-cyan">{auditState.result ? '89.4%' : 'READY'}</span>
            </div>
            <div className="sec-graph">
              <div className="bar b1"></div>
              <div className="bar b2"></div>
              <div className="bar b3"></div>
              <div className="bar b4"></div>
              <div className="bar b5"></div>
            </div>
            <div className="sec-log-stream">
              <div className="log-line">&gt; agent.session.init: OK</div>
              <div className="log-line">&gt; langgraph.node: READY</div>
              <div className="log-line">&gt; azure.vi.token: SYNCED</div>
              {auditState.loading && <div className="log-line log-pulse">&gt; ANALYZING FRAMES...</div>}
            </div>
          </div>
        </Html>
      </group>

      {/* PC Tower on Floor */}
      <group position={[1.05, 0.38, 0.15]}>
        <mesh castShadow>
          <boxGeometry args={[0.26, 0.58, 0.52]} />
          <meshStandardMaterial color={isLight ? "#f1f5f9" : "#0b0f19"} roughness={0.3} metalness={0.5} />
        </mesh>
        <mesh position={[-0.135, 0, 0]}>
          <planeGeometry args={[0.5, 0.54]} />
          <meshPhysicalMaterial color={isLight ? "#38bdf8" : "#00e5ff"} transparent opacity={0.3} roughness={0.1} />
        </mesh>
        <pointLight position={[-0.05, 0.1, 0]} color="#38bdf8" intensity={0.3} distance={0.8} />
      </group>

      {/* Ceramic Coffee Mug on Saucer */}
      <group position={[-0.7, 0.81, 0.18]}>
        {/* Saucer */}
        <mesh position={[0, 0.005, 0]}>
          <cylinderGeometry args={[0.07, 0.06, 0.01, 24]} />
          <meshStandardMaterial color={isLight ? "#f8fafc" : "#334155"} roughness={0.2} />
        </mesh>
        {/* Mug */}
        <mesh position={[0, 0.045, 0]} castShadow>
          <cylinderGeometry args={[0.045, 0.04, 0.08, 20]} />
          <meshStandardMaterial color={isLight ? "#ea580c" : "#f8fafc"} roughness={0.3} />
        </mesh>
      </group>

      {/* Headphone Stand with Headphones */}
      <group position={[-1.0, 0.95, -0.3]}>
        {/* Stand Base */}
        <mesh position={[0, -0.15, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.015, 20]} />
          <meshStandardMaterial color={isLight ? "#64748b" : "#334155"} metalness={0.8} />
        </mesh>
        {/* Stand Stem */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.3, 16]} />
          <meshStandardMaterial color={isLight ? "#64748b" : "#334155"} metalness={0.8} />
        </mesh>
        {/* Headphone Headband */}
        <mesh position={[0, 0.15, 0]}>
          <torusGeometry args={[0.08, 0.015, 12, 24, Math.PI]} rotation={[0, 0, Math.PI]} />
          <meshStandardMaterial color="#0f172a" roughness={0.5} />
        </mesh>
        {/* Left Earcup */}
        <mesh position={[-0.08, 0.08, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 0.03, 16]} rotation={[0, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#1e293b" roughness={0.4} />
        </mesh>
        {/* Right Earcup */}
        <mesh position={[0.08, 0.08, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 0.03, 16]} rotation={[0, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#1e293b" roughness={0.4} />
        </mesh>
      </group>

      {/* Anglepoise Desk Lamp */}
      <group position={[-0.95, 0.95, 0.15]} rotation={[0, 0.4, 0]}>
        <mesh position={[0, -0.15, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.015, 20]} />
          <meshStandardMaterial color={isLight ? "#f8fafc" : "#1e293b"} />
        </mesh>
        {/* Lower Arm */}
        <mesh position={[0, 0, 0]} rotation={[0, 0, -0.2]}>
          <cylinderGeometry args={[0.008, 0.008, 0.28, 12]} />
          <meshStandardMaterial color={isLight ? "#94a3b8" : "#475569"} metalness={0.8} />
        </mesh>
        {/* Lamp Shade */}
        <mesh position={[0.08, 0.16, 0]} rotation={[0, 0, 0.8]}>
          <coneGeometry args={[0.07, 0.12, 20]} />
          <meshStandardMaterial color={isLight ? "#f8fafc" : "#1e293b"} />
        </mesh>
        {/* Warm lamp light */}
        <pointLight position={[0.1, 0.12, 0]} color="#fef08a" intensity={0.6} distance={1.2} />
      </group>

      {/* Modern Studio Chair */}
      <group position={[0, 0.45, 0.85]} rotation={[0, 0.1, 0]}>
        <mesh position={[0, 0.2, 0]} castShadow>
          <cylinderGeometry args={[0.28, 0.28, 0.08, 24]} />
          <meshStandardMaterial color={isLight ? "#334155" : "#0f172a"} roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.52, 0.22]} rotation={[-0.1, 0, 0]} castShadow>
          <boxGeometry args={[0.42, 0.55, 0.05]} />
          <meshStandardMaterial color={isLight ? "#475569" : "#1e293b"} roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.06, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.35, 16]} />
          <meshStandardMaterial color={isLight ? "#94a3b8" : "#475569"} metalness={0.9} />
        </mesh>
        <mesh position={[0, -0.1, 0]}>
          <cylinderGeometry args={[0.26, 0.26, 0.02, 5]} />
          <meshStandardMaterial color={isLight ? "#94a3b8" : "#334155"} metalness={0.8} />
        </mesh>
      </group>

      {/* Wire Mesh Wastebasket */}
      <group position={[1.05, 0.15, -0.3]}>
        <mesh>
          <cylinderGeometry args={[0.14, 0.1, 0.3, 16, 1, true]} />
          <meshStandardMaterial color={isLight ? "#94a3b8" : "#334155"} wireframe />
        </mesh>
      </group>
    </group>
  );
}

// Scandinavian Wooden Shelving Unit with Books & Decor
function StudioBookshelf({ isLight }) {
  const shelfWood = isLight ? "#d4a373" : "#1e293b";

  return (
    <group position={[2.6, 0, -2.4]} rotation={[0, -0.2, 0]}>
      {/* Outer Frame */}
      <mesh position={[0, 1.4, 0]} castShadow>
        <boxGeometry args={[1.6, 2.8, 0.38]} />
        <meshStandardMaterial color={shelfWood} roughness={0.5} />
      </mesh>
      {/* Interior Back Panel */}
      <mesh position={[0, 1.4, 0.16]}>
        <planeGeometry args={[1.52, 2.72]} />
        <meshStandardMaterial color={isLight ? "#f5f0ea" : "#0f172a"} />
      </mesh>

      {/* Shelves & Props */}
      {[0.5, 1.1, 1.7, 2.3].map((y, idx) => (
        <group key={idx} position={[0, y, 0]}>
          {/* Shelf Plank */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[1.52, 0.04, 0.36]} />
            <meshStandardMaterial color={shelfWood} roughness={0.4} />
          </mesh>
          {/* Books on Shelves */}
          {idx === 0 && (
            <group position={[-0.4, 0.12, 0]}>
              {['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'].map((col, bIdx) => (
                <mesh key={bIdx} position={[bIdx * 0.06, 0, 0]}>
                  <boxGeometry args={[0.045, 0.22, 0.24]} />
                  <meshStandardMaterial color={col} roughness={0.3} />
                </mesh>
              ))}
            </group>
          )}
          {idx === 1 && (
            <group position={[0.3, 0.12, 0]}>
              <mesh position={[0, 0, 0]}>
                <cylinderGeometry args={[0.08, 0.06, 0.18, 16]} />
                <meshStandardMaterial color={isLight ? "#e07a5f" : "#475569"} roughness={0.6} />
              </mesh>
            </group>
          )}
          {idx === 2 && (
            <group position={[-0.2, 0.1, 0]}>
              <mesh position={[0, 0, 0]}>
                <sphereGeometry args={[0.08, 16, 16]} />
                <meshStandardMaterial color={isLight ? "#f59e0b" : "#00e5ff"} metalness={0.7} roughness={0.2} />
              </mesh>
            </group>
          )}
        </group>
      ))}
    </group>
  );
}

// Large Architectural Loft Window with Daylight
function LoftWindow({ isLight }) {
  return (
    <group position={[-3.6, 2.8, 0]} rotation={[0, Math.PI / 2, 0]}>
      {/* Window Frame */}
      <mesh position={[0, 0, 0.02]}>
        <boxGeometry args={[3.2, 2.4, 0.08]} />
        <meshStandardMaterial color={isLight ? "#334155" : "#0f172a"} roughness={0.3} />
      </mesh>
      {/* Glass Pane */}
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[3.0, 2.2]} />
        <meshPhysicalMaterial
          color={isLight ? "#e0f2fe" : "#0f172a"}
          transmission={0.9}
          roughness={0.05}
          thickness={0.02}
        />
      </mesh>
      {/* Window Mullion Grid */}
      <mesh position={[0, 0, 0.03]}>
        <boxGeometry args={[0.04, 2.2, 0.03]} />
        <meshStandardMaterial color={isLight ? "#334155" : "#0f172a"} />
      </mesh>
      <mesh position={[0, 0, 0.03]}>
        <boxGeometry args={[3.0, 0.04, 0.03]} />
        <meshStandardMaterial color={isLight ? "#334155" : "#0f172a"} />
      </mesh>
      {/* Exterior Daylight Backdrop */}
      <mesh position={[0, 0, -0.2]}>
        <planeGeometry args={[4, 3]} />
        <meshBasicMaterial color={isLight ? "#bfdbfe" : "#030712"} />
      </mesh>
    </group>
  );
}

// Wall Corkboard / Moodboard with Compliance Notes
function CorkMoodboard({ isLight }) {
  return (
    <group position={[-0.4, 3.1, -3.15]}>
      {/* Board Frame */}
      <mesh>
        <boxGeometry args={[2.4, 1.3, 0.04]} />
        <meshStandardMaterial color={isLight ? "#d4a373" : "#1e293b"} />
      </mesh>
      {/* Cork Texture Area */}
      <mesh position={[0, 0, 0.022]}>
        <planeGeometry args={[2.3, 1.2]} />
        <meshStandardMaterial color={isLight ? "#c7a379" : "#242f44"} roughness={0.9} />
      </mesh>

      {/* Pinned Sticky Notes */}
      <mesh position={[-0.7, 0.25, 0.028]}>
        <planeGeometry args={[0.22, 0.22]} />
        <meshStandardMaterial color="#fef08a" />
      </mesh>
      <mesh position={[-0.4, 0.22, 0.028]}>
        <planeGeometry args={[0.26, 0.2]} />
        <meshStandardMaterial color="#fbcfe8" />
      </mesh>
      <mesh position={[0.2, 0.15, 0.028]}>
        <planeGeometry args={[0.5, 0.35]} />
        <meshStandardMaterial color="#e0f2fe" />
      </mesh>
      <mesh position={[0.7, -0.15, 0.028]}>
        <planeGeometry args={[0.24, 0.24]} />
        <meshStandardMaterial color="#bbf7d0" />
      </mesh>
      <mesh position={[-0.6, -0.2, 0.028]}>
        <planeGeometry args={[0.4, 0.26]} />
        <meshStandardMaterial color="#fed7aa" />
      </mesh>
    </group>
  );
}

// Architectural Tall Plant in Fluted Ceramic Pot on Tripod Stand
function DesignerPlant({ isLight }) {
  return (
    <group position={[-2.3, 0, 1.8]}>
      {/* Wood Stand */}
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.04, 20]} />
        <meshStandardMaterial color={isLight ? "#d4a373" : "#334155"} />
      </mesh>
      {/* 3 Tripod Legs */}
      {[0, (2 * Math.PI) / 3, (4 * Math.PI) / 3].map((angle, i) => (
        <mesh
          key={i}
          position={[Math.cos(angle) * 0.18, 0.15, Math.sin(angle) * 0.18]}
          rotation={[0.1 * Math.sin(angle), 0, -0.1 * Math.cos(angle)]}
        >
          <cylinderGeometry args={[0.02, 0.015, 0.35, 12]} />
          <meshStandardMaterial color={isLight ? "#d4a373" : "#334155"} />
        </mesh>
      ))}

      {/* Ceramic Planter Pot */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.24, 0.19, 0.55, 24]} />
        <meshStandardMaterial color={isLight ? "#f8fafc" : "#1e293b"} roughness={0.3} />
      </mesh>

      {/* Large Monstera / Fiddle Leaf Foliage */}
      <group position={[0, 0.85, 0]}>
        {[
          [0, 0.4, 0, 0.28],
          [0.18, 0.3, 0.15, 0.24],
          [-0.16, 0.35, -0.12, 0.25],
          [-0.2, 0.2, 0.14, 0.22],
          [0.15, 0.22, -0.18, 0.23]
        ].map(([x, y, z, r], idx) => (
          <mesh key={idx} position={[x, y, z]} castShadow>
            <sphereGeometry args={[r, 16, 16]} />
            <meshStandardMaterial color={idx % 2 === 0 ? "#15803d" : "#16a34a"} roughness={0.6} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// Room Architecture (Floor, Walls, Rug, Lighting)
function StudioRoom({ isLight }) {
  const floorColor = isLight ? "#e8e2d8" : "#060913"; // Warm light concrete / terrazzo
  const wallColor = isLight ? "#f6f4ee" : "#0a0f1d"; // Warm Scandinavian lime wash
  const sideWallColor = isLight ? "#ece7de" : "#080c18";
  const rugColor = isLight ? "#dcd4c7" : "#0f172a";

  return (
    <group position={[0, 0, 0]}>
      {/* Studio Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[16, 16]} />
        <meshStandardMaterial color={floorColor} roughness={0.4} metalness={0.1} />
      </mesh>

      {/* Cozy Textured Area Rug under Desk */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0.3]} receiveShadow>
        <circleGeometry args={[2.2, 48]} />
        <meshStandardMaterial color={rugColor} roughness={0.9} />
      </mesh>

      {/* Floor Grid Lines */}
      <gridHelper
        args={[16, 32, isLight ? "#cbd5e1" : "#00e5ff", isLight ? "#e2e8f0" : "#1e293b"]}
        position={[0, 0.008, 0]}
      />

      {/* Back Wall */}
      <mesh position={[0, 3, -3.2]} receiveShadow>
        <planeGeometry args={[14, 6]} />
        <meshStandardMaterial color={wallColor} roughness={0.8} />
      </mesh>

      {/* Left Wall */}
      <mesh position={[-3.6, 3, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[14, 6]} />
        <meshStandardMaterial color={sideWallColor} roughness={0.8} />
      </mesh>

      {/* Architectural Loft Window */}
      <LoftWindow isLight={isLight} />

      {/* Cork Moodboard on Wall */}
      <CorkMoodboard isLight={isLight} />

      {/* Tall Studio Bookshelf */}
      <StudioBookshelf isLight={isLight} />

      {/* Potted Designer Plant */}
      <DesignerPlant isLight={isLight} />

      {/* Soft Contact Shadows on Floor */}
      <ContactShadows
        position={[0, 0.01, 0]}
        opacity={isLight ? 0.45 : 0.7}
        scale={9}
        blur={2.4}
        far={4}
      />
    </group>
  );
}

export default function OfficeScene({ targetView, setTargetView, auditState, theme = 'light', children }) {
  const controlsRef = useRef();
  const isLight = theme === 'light';

  const bgColor = isLight ? "#f4efe8" : "#030712";

  return (
    <div className={`office-canvas-viewport ${isLight ? 'light-viewport' : ''}`}>
      <Canvas
        shadows
        camera={{ position: [4.8, 3.4, 5.2], fov: 42 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={[bgColor]} />
        <fog attach="fog" args={[bgColor, 7, 20]} />

        {/* Ambient Natural Studio Light */}
        <ambientLight intensity={isLight ? 1.4 : 0.5} />
        
        {/* Directional Sunbeam through the Window */}
        <directionalLight
          position={[-6, 7, 4]}
          intensity={isLight ? 2.2 : 0.8}
          castShadow
          shadow-bias={-0.0001}
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          color={isLight ? "#fff9e6" : "#e0f2fe"}
        />

        {/* Key Desk Spotlight */}
        <spotLight
          position={[1.8, 4.5, 2.5]}
          angle={0.55}
          penumbra={0.8}
          intensity={isLight ? 1.0 : 1.8}
          castShadow
          color={isLight ? "#ffffff" : "#e0f2fe"}
        />

        {/* Subtle Accent Fill */}
        <pointLight position={[-2, 2.5, 1]} intensity={isLight ? 0.4 : 0.9} color={isLight ? "#e0f2fe" : "#00e5ff"} distance={7} />
        <pointLight position={[3, 2, -1.5]} intensity={isLight ? 0.3 : 1.1} color={isLight ? "#fed7aa" : "#a855f7"} distance={6} />

        {/* Interactive Camera Lerp Controller */}
        <CameraController targetView={targetView} controlsRef={controlsRef} />

        {/* Constrained Orbit Controls */}
        <OrbitControls
          ref={controlsRef}
          enablePan={false}
          minDistance={1.5}
          maxDistance={9.5}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2.05}
          dampingFactor={0.08}
        />

        {/* 3D Scene Architecture & Props */}
        <StudioRoom isLight={isLight} />
        <ServerRack onFocus={setTargetView} isLight={isLight} />
        <WorkstationDesk
          onFocus={setTargetView}
          activeView={targetView}
          auditState={auditState}
          isLight={isLight}
        >
          {children}
        </WorkstationDesk>
      </Canvas>
    </div>
  );
}
