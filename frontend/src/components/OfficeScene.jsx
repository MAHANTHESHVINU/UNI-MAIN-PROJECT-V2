import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Float, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

// Smooth Camera Controller with animated lerp
function CameraController({ targetView, controlsRef }) {
  const cameraPositions = useMemo(() => ({
    overview: { pos: [5.2, 3.8, 5.5], target: [0, 0.9, 0] },
    terminal: { pos: [0, 1.45, 1.7], target: [0, 1.35, -0.2] },
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

// Blinking server LEDs
function ServerRack({ onFocus }) {
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
        <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.8} />
      </mesh>
      {/* Front Glass Door */}
      <mesh position={[0, 1.3, 0.41]}>
        <planeGeometry args={[0.82, 2.45]} />
        <meshPhysicalMaterial
          color="#06b6d4"
          transparent
          opacity={0.25}
          roughness={0.1}
          metalness={0.2}
          transmission={0.6}
        />
      </mesh>
      {/* Internal Server Blades */}
      {[0.4, 0.75, 1.1, 1.45, 1.8, 2.15].map((y, i) => (
        <group key={i} position={[0, y, 0]}>
          <mesh>
            <boxGeometry args={[0.8, 0.24, 0.7]} />
            <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0, 0.36]}>
            <boxGeometry args={[0.76, 0.2, 0.02]} />
            <meshStandardMaterial color="#020617" roughness={0.8} />
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
      {/* Glow aura */}
      <pointLight position={[0, 1.3, 0.6]} color="#00e5ff" intensity={0.5} distance={2.5} />
    </group>
  );
}

// Workstation Desk with Dual Monitors and Accessories
function WorkstationDesk({ onFocus, activeView, auditState, children }) {
  return (
    <group position={[0, 0, 0]}>
      {/* Desk Top */}
      <mesh position={[0, 0.76, 0]} receiveShadow castShadow>
        <boxGeometry args={[2.4, 0.06, 1.1]} />
        <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.2} />
      </mesh>

      {/* Desk Legs */}
      <mesh position={[-1.1, 0.38, 0]} castShadow>
        <boxGeometry args={[0.06, 0.76, 1.0]} />
        <meshStandardMaterial color="#090d16" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[1.1, 0.38, 0]} castShadow>
        <boxGeometry args={[0.06, 0.76, 1.0]} />
        <meshStandardMaterial color="#090d16" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Desk Cable Mat */}
      <mesh position={[0, 0.795, 0.08]}>
        <boxGeometry args={[1.5, 0.005, 0.6]} />
        <meshStandardMaterial color="#0b1120" roughness={0.8} />
      </mesh>

      {/* Mechanical Keyboard */}
      <mesh position={[0, 0.81, 0.22]} castShadow>
        <boxGeometry args={[0.55, 0.025, 0.18]} />
        <meshStandardMaterial color="#111827" roughness={0.4} />
      </mesh>
      {/* Keycaps RGB glow bar */}
      <mesh position={[0, 0.825, 0.22]}>
        <boxGeometry args={[0.52, 0.005, 0.15]} />
        <meshBasicMaterial color="#00e5ff" />
      </mesh>

      {/* Ergonomic Mouse */}
      <mesh position={[0.42, 0.81, 0.22]} castShadow>
        <boxGeometry args={[0.08, 0.03, 0.12]} />
        <meshStandardMaterial color="#1e293b" roughness={0.3} />
      </mesh>

      {/* Main Curved Screen Stand */}
      <mesh position={[0, 1.05, -0.28]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.55, 16]} />
        <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.795, -0.28]}>
        <cylinderGeometry args={[0.15, 0.15, 0.015, 24]} />
        <meshStandardMaterial color="#334155" metalness={0.8} />
      </mesh>

      {/* Main Curved Display Bezel */}
      <group position={[0, 1.36, -0.2]} onClick={(e) => { e.stopPropagation(); onFocus('terminal'); }}>
        <mesh castShadow>
          <boxGeometry args={[1.4, 0.68, 0.04]} />
          <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.6} />
        </mesh>
        
        {/* Back Ambient Glow on Screen */}
        <pointLight position={[0, 0, -0.15]} color={auditState.loading ? "#a855f7" : "#00e5ff"} intensity={0.6} distance={2} />

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
          <div className="virtual-screen-container">
            {children}
          </div>
        </Html>
      </group>

      {/* Secondary Vertical Monitor on the Right */}
      <group position={[0.95, 1.35, -0.12]} rotation={[0, -0.38, 0]} onClick={(e) => { e.stopPropagation(); onFocus('results'); }}>
        <mesh castShadow>
          <boxGeometry args={[0.48, 0.72, 0.03]} />
          <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.7} />
        </mesh>
        <mesh position={[0, 0, 0.02]}>
          <planeGeometry args={[0.44, 0.68]} />
          <meshBasicMaterial color="#030712" />
        </mesh>
        <Html
          transform
          distanceFactor={1.1}
          position={[0, 0, 0.025]}
          style={{ width: '300px', height: '460px', pointerEvents: 'none' }}
        >
          <div className="secondary-telemetry-screen">
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
      <group position={[0.95, 0.38, 0.15]}>
        <mesh castShadow>
          <boxGeometry args={[0.26, 0.58, 0.52]} />
          <meshStandardMaterial color="#0b0f19" roughness={0.3} metalness={0.6} />
        </mesh>
        <mesh position={[-0.135, 0, 0]}>
          <planeGeometry args={[0.5, 0.54]} />
          <meshPhysicalMaterial color="#00e5ff" transparent opacity={0.3} roughness={0.1} />
        </mesh>
        <pointLight position={[-0.05, 0.1, 0]} color="#a855f7" intensity={0.4} distance={0.8} />
      </group>

      {/* Coffee Mug */}
      <group position={[-0.7, 0.84, 0.18]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.045, 0.04, 0.09, 16]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.2} />
        </mesh>
      </group>

      {/* Desk Plant */}
      <group position={[-0.95, 0.88, -0.2]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.07, 0.05, 0.12, 16]} />
          <meshStandardMaterial color="#334155" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.1, 0]} castShadow>
          <sphereGeometry args={[0.09, 12, 12]} />
          <meshStandardMaterial color="#10b981" roughness={0.6} />
        </mesh>
      </group>

      {/* Modern Studio Chair */}
      <group position={[0, 0.45, 0.8]} rotation={[0, 0.1, 0]}>
        <mesh position={[0, 0.2, 0]} castShadow>
          <cylinderGeometry args={[0.28, 0.28, 0.08, 24]} />
          <meshStandardMaterial color="#0f172a" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.52, 0.22]} rotation={[-0.1, 0, 0]} castShadow>
          <boxGeometry args={[0.42, 0.55, 0.05]} />
          <meshStandardMaterial color="#1e293b" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.06, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.35, 16]} />
          <meshStandardMaterial color="#475569" metalness={0.9} />
        </mesh>
        <mesh position={[0, -0.1, 0]}>
          <cylinderGeometry args={[0.26, 0.26, 0.02, 5]} />
          <meshStandardMaterial color="#334155" metalness={0.8} />
        </mesh>
      </group>
    </group>
  );
}

// Room Architecture (Floor, Walls, Grid, Lighting)
function StudioRoom() {
  return (
    <group position={[0, 0, 0]}>
      {/* Studio Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[16, 16]} />
        <meshStandardMaterial color="#060913" roughness={0.5} metalness={0.4} />
      </mesh>

      {/* Studio Grid Lines */}
      <gridHelper args={[16, 32, "#00e5ff", "#1e293b"]} position={[0, 0.005, 0]} />

      {/* Back Wall */}
      <mesh position={[0, 3, -3.2]} receiveShadow>
        <planeGeometry args={[14, 6]} />
        <meshStandardMaterial color="#0a0f1d" roughness={0.8} />
      </mesh>

      {/* Left Wall */}
      <mesh position={[-3.6, 3, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[14, 6]} />
        <meshStandardMaterial color="#080c18" roughness={0.8} />
      </mesh>

      {/* Floating Sign */}
      <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.2} position={[0, 3.4, -3.15]}>
        <mesh>
          <planeGeometry args={[2.8, 0.6]} />
          <meshBasicMaterial color="#00e5ff" transparent opacity={0.08} />
        </mesh>
      </Float>

      {/* Soft Contact Shadows on Floor */}
      <ContactShadows
        position={[0, 0.01, 0]}
        opacity={0.7}
        scale={8}
        blur={2}
        far={4}
      />
    </group>
  );
}

export default function OfficeScene({ targetView, setTargetView, auditState, children }) {
  const controlsRef = useRef();

  return (
    <div className="office-canvas-viewport">
      <Canvas
        shadows
        camera={{ position: [5.2, 3.8, 5.5], fov: 42 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={["#030712"]} />
        <fog attach="fog" args={["#030712", 8, 22]} />

        {/* Studio Lighting Setup */}
        <ambientLight intensity={0.5} />
        
        {/* Key Desk Spotlight */}
        <spotLight
          position={[2.5, 5, 3]}
          angle={0.5}
          penumbra={0.8}
          intensity={1.8}
          castShadow
          shadow-bias={-0.0001}
          color="#e0f2fe"
        />

        {/* Ambient Cyan Fill Light */}
        <pointLight position={[-3, 3, 2]} intensity={0.9} color="#00e5ff" distance={8} />

        {/* Ambient Purple Rim Light */}
        <pointLight position={[3.5, 2.5, -2]} intensity={1.1} color="#a855f7" distance={7} />

        {/* Interactive Camera Lerp Controller */}
        <CameraController targetView={targetView} controlsRef={controlsRef} />

        {/* Orbit Controls */}
        <OrbitControls
          ref={controlsRef}
          enablePan={false}
          minDistance={1.6}
          maxDistance={9.5}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2.05}
          dampingFactor={0.08}
        />

        {/* 3D Scene Objects */}
        <StudioRoom />
        <ServerRack onFocus={setTargetView} />
        <WorkstationDesk onFocus={setTargetView} activeView={targetView} auditState={auditState}>
          {children}
        </WorkstationDesk>
      </Canvas>
    </div>
  );
}
