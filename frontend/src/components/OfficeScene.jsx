import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Float, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

// Smooth Camera Controller with animated lerp
function CameraController({ targetView, controlsRef }) {
  const cameraPositions = useMemo(() => ({
    overview: { pos: [4.4, 3.2, 4.8], target: [0, 0.95, 0] },
    terminal: { pos: [0, 1.45, 1.6], target: [0, 1.35, -0.2] },
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

// Floating Sunbeam Dust Particles (Cinematic Atmosphere)
function AtmosphericDust() {
  const count = 40;
  const particles = useMemo(() => {
    return Array.from({ length: count }).map(() => ({
      pos: [
        (Math.random() - 0.5) * 6,
        0.5 + Math.random() * 3,
        (Math.random() - 0.5) * 5
      ],
      speed: 0.2 + Math.random() * 0.5,
      offset: Math.random() * Math.PI * 2
    }));
  }, []);

  const groupRef = useRef();

  useFrame(({ clock }) => {
    if (groupRef.current) {
      const t = clock.getElapsedTime();
      groupRef.current.children.forEach((child, i) => {
        const p = particles[i];
        child.position.y = p.pos[1] + Math.sin(t * p.speed + p.offset) * 0.15;
      });
    }
  });

  return (
    <group ref={groupRef}>
      {particles.map((p, i) => (
        <mesh key={i} position={p.pos}>
          <sphereGeometry args={[0.012, 8, 8]} />
          <meshBasicMaterial color="#fef08a" transparent opacity={0.65} />
        </mesh>
      ))}
    </group>
  );
}

// Luxury Acoustic Wood Slat Wall Paneling
function AcousticWoodWall({ isLight }) {
  const slatCount = 28;
  const slatWidth = 0.045;
  const slatGap = 0.045;
  const slatColor = isLight ? "#c89d71" : "#1e293b"; // Natural warm oak
  const backerColor = isLight ? "#2d3748" : "#020617"; // Felt shadow backing

  return (
    <group position={[0, 2.5, -3.18]}>
      {/* Dark Acoustic Felt Backer */}
      <mesh receiveShadow>
        <planeGeometry args={[7.2, 5.0]} />
        <meshStandardMaterial color={backerColor} roughness={0.9} />
      </mesh>

      {/* Vertical Wood Slats with Rich Shadows */}
      {Array.from({ length: slatCount }).map((_, i) => {
        const x = -3.2 + i * (slatWidth + slatGap);
        return (
          <mesh key={i} position={[x, 0, 0.02]} castShadow receiveShadow>
            <boxGeometry args={[slatWidth, 5.0, 0.035]} />
            <meshStandardMaterial
              color={slatColor}
              roughness={0.4}
              metalness={0.05}
            />
          </mesh>
        );
      })}

      {/* Ambient Architectural Slat Wash Light */}
      <pointLight position={[0, 1.8, 0.3]} color="#fef3c7" intensity={0.8} distance={4} />
    </group>
  );
}

// Overhead Architectural Linear Pendant Light
function LinearPendantFixture({ isLight }) {
  return (
    <group position={[0, 2.8, 0]}>
      {/* Ceiling Mounting Rose */}
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.02, 16]} />
        <meshStandardMaterial color="#0f172a" metalness={0.8} />
      </mesh>
      {/* Slim Hanging Suspension Cables */}
      <mesh position={[-0.8, 0.2, 0]}>
        <cylinderGeometry args={[0.002, 0.002, 0.4, 8]} />
        <meshStandardMaterial color="#475569" metalness={0.9} />
      </mesh>
      <mesh position={[0.8, 0.2, 0]}>
        <cylinderGeometry args={[0.002, 0.002, 0.4, 8]} />
        <meshStandardMaterial color="#475569" metalness={0.9} />
      </mesh>

      {/* Linear Anodized Black Aluminum Extrusion */}
      <mesh castShadow>
        <boxGeometry args={[1.9, 0.04, 0.06]} />
        <meshStandardMaterial color={isLight ? "#0f172a" : "#1e293b"} metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Frosted Acrylic LED Diffuser */}
      <mesh position={[0, -0.022, 0]}>
        <boxGeometry args={[1.86, 0.005, 0.05]} />
        <meshBasicMaterial color="#fffbeb" />
      </mesh>

      {/* Soft Downward Task Light */}
      <spotLight
        position={[0, -0.05, 0]}
        target-position={[0, 0.8, 0]}
        angle={0.65}
        penumbra={0.7}
        intensity={isLight ? 1.8 : 2.4}
        color="#fffbeb"
        castShadow
        shadow-bias={-0.0001}
      />
    </group>
  );
}

// Server Rack with precision glass and blinking LEDs
function ServerRack({ onFocus, isLight }) {
  const ledsRef = useRef();

  useFrame(({ clock }) => {
    if (ledsRef.current) {
      const t = clock.getElapsedTime();
      ledsRef.current.children.forEach((led, idx) => {
        const speed = 2.5 + (idx % 3);
        led.material.opacity = (Math.sin(t * speed + idx) > 0.15) ? 0.95 : 0.2;
      });
    }
  });

  return (
    <group position={[-2.4, 0, -0.6]} onClick={(e) => { e.stopPropagation(); onFocus('servers'); }} style={{ cursor: 'pointer' }}>
      {/* Rack Frame */}
      <mesh position={[0, 1.3, 0]} castShadow>
        <boxGeometry args={[0.9, 2.6, 0.8]} />
        <meshStandardMaterial
          color={isLight ? "#f1f5f9" : "#0f172a"}
          roughness={0.3}
          metalness={isLight ? 0.4 : 0.85}
        />
      </mesh>
      {/* Tinted Front Glass Door */}
      <mesh position={[0, 1.3, 0.41]}>
        <planeGeometry args={[0.82, 2.45]} />
        <meshPhysicalMaterial
          color={isLight ? "#0284c7" : "#06b6d4"}
          transparent
          opacity={0.35}
          roughness={0.05}
          metalness={0.2}
          transmission={0.75}
        />
      </mesh>
      {/* Internal Server Blades */}
      {[0.4, 0.75, 1.1, 1.45, 1.8, 2.15].map((y, i) => (
        <group key={i} position={[0, y, 0]}>
          <mesh>
            <boxGeometry args={[0.8, 0.24, 0.7]} />
            <meshStandardMaterial color={isLight ? "#cbd5e1" : "#1e293b"} roughness={0.3} metalness={0.6} />
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
      <pointLight position={[0, 1.3, 0.6]} color="#00e5ff" intensity={0.4} distance={2.5} />
    </group>
  );
}

// Studio Speakers (Audio Monitors)
function StudioSpeakers({ isLight }) {
  return (
    <>
      <group position={[-0.9, 0.96, -0.15]} rotation={[0, 0.28, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.17, 0.28, 0.17]} />
          <meshStandardMaterial color={isLight ? "#1e293b" : "#0f172a"} roughness={0.25} metalness={0.3} />
        </mesh>
        <mesh position={[0, 0.05, 0.086]}>
          <circleGeometry args={[0.055, 24]} />
          <meshStandardMaterial color="#f59e0b" roughness={0.4} metalness={0.2} />
        </mesh>
        <mesh position={[0, -0.06, 0.086]}>
          <circleGeometry args={[0.035, 20]} />
          <meshStandardMaterial color="#020617" roughness={0.1} />
        </mesh>
      </group>

      <group position={[0.9, 0.96, -0.15]} rotation={[0, -0.28, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.17, 0.28, 0.17]} />
          <meshStandardMaterial color={isLight ? "#1e293b" : "#0f172a"} roughness={0.25} metalness={0.3} />
        </mesh>
        <mesh position={[0, 0.05, 0.086]}>
          <circleGeometry args={[0.055, 24]} />
          <meshStandardMaterial color="#f59e0b" roughness={0.4} metalness={0.2} />
        </mesh>
        <mesh position={[0, -0.06, 0.086]}>
          <circleGeometry args={[0.035, 20]} />
          <meshStandardMaterial color="#020617" roughness={0.1} />
        </mesh>
      </group>
    </>
  );
}

// Workstation Desk with Luxury Materials & Bevels
function WorkstationDesk({ onFocus, activeView, auditState, isLight, children }) {
  const deskWoodColor = isLight ? "#cfa175" : "#1e293b"; // Rich warm Japanese white oak
  const metalLegsColor = isLight ? "#334155" : "#090d16";

  return (
    <group position={[0, 0, 0]}>
      {/* Desk Top */}
      <mesh position={[0, 0.76, 0]} receiveShadow castShadow>
        <boxGeometry args={[2.5, 0.06, 1.15]} />
        <meshStandardMaterial color={deskWoodColor} roughness={0.35} metalness={0.08} />
      </mesh>

      {/* Desk Chamfer / Under-bevel */}
      <mesh position={[0, 0.725, 0]}>
        <boxGeometry args={[2.42, 0.015, 1.08]} />
        <meshStandardMaterial color="#1e293b" roughness={0.6} />
      </mesh>

      {/* Desk Steel Legs */}
      <mesh position={[-1.15, 0.38, 0]} castShadow>
        <boxGeometry args={[0.06, 0.76, 1.05]} />
        <meshStandardMaterial color={metalLegsColor} metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[1.15, 0.38, 0]} castShadow>
        <boxGeometry args={[0.06, 0.76, 1.05]} />
        <meshStandardMaterial color={metalLegsColor} metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Desk Wool Felt Mat */}
      <mesh position={[0, 0.795, 0.08]}>
        <boxGeometry args={[1.65, 0.006, 0.65]} />
        <meshStandardMaterial color={isLight ? "#1e293b" : "#0b1120"} roughness={0.9} />
      </mesh>

      {/* Mechanical Keyboard with Keycap Backlight */}
      <mesh position={[0, 0.81, 0.22]} castShadow>
        <boxGeometry args={[0.56, 0.025, 0.18]} />
        <meshStandardMaterial color={isLight ? "#f8fafc" : "#111827"} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.825, 0.22]}>
        <boxGeometry args={[0.53, 0.005, 0.15]} />
        <meshBasicMaterial color={isLight ? "#0284c7" : "#00e5ff"} />
      </mesh>

      {/* Precision Mouse */}
      <mesh position={[0.42, 0.81, 0.22]} castShadow>
        <boxGeometry args={[0.08, 0.03, 0.12]} />
        <meshStandardMaterial color={isLight ? "#cbd5e1" : "#1e293b"} roughness={0.3} metalness={0.2} />
      </mesh>

      {/* Studio Speakers */}
      <StudioSpeakers isLight={isLight} />

      {/* Screen Stand (Apple Pro Stand style) */}
      <mesh position={[0, 1.05, -0.28]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.55, 16]} />
        <meshStandardMaterial color={isLight ? "#94a3b8" : "#334155"} metalness={0.9} roughness={0.15} />
      </mesh>
      <mesh position={[0, 0.795, -0.28]}>
        <cylinderGeometry args={[0.15, 0.15, 0.015, 24]} />
        <meshStandardMaterial color={isLight ? "#94a3b8" : "#334155"} metalness={0.9} roughness={0.15} />
      </mesh>

      {/* Main Curved Display Bezel (Apple Pro Display XDR style) */}
      <group position={[0, 1.36, -0.2]} onClick={(e) => { e.stopPropagation(); onFocus('terminal'); }}>
        <mesh castShadow>
          <boxGeometry args={[1.42, 0.7, 0.04]} />
          <meshStandardMaterial color={isLight ? "#0f172a" : "#020617"} roughness={0.25} metalness={0.7} />
        </mesh>
        
        {/* Back Ambient Glow */}
        <pointLight position={[0, 0, -0.15]} color={auditState.loading ? "#a855f7" : "#0284c7"} intensity={0.5} distance={2} />

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
          <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.7} />
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

      {/* Ceramic Coffee Mug on Saucer */}
      <group position={[-0.7, 0.81, 0.18]}>
        <mesh position={[0, 0.005, 0]}>
          <cylinderGeometry args={[0.07, 0.06, 0.01, 24]} />
          <meshStandardMaterial color={isLight ? "#f8fafc" : "#334155"} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.045, 0]} castShadow>
          <cylinderGeometry args={[0.045, 0.04, 0.08, 20]} />
          <meshStandardMaterial color={isLight ? "#ea580c" : "#f8fafc"} roughness={0.3} />
        </mesh>
      </group>

      {/* Headphone Stand with Headphones */}
      <group position={[-1.0, 0.95, -0.3]}>
        <mesh position={[0, -0.15, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.015, 20]} />
          <meshStandardMaterial color={isLight ? "#64748b" : "#334155"} metalness={0.8} />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.3, 16]} />
          <meshStandardMaterial color={isLight ? "#64748b" : "#334155"} metalness={0.8} />
        </mesh>
        <mesh position={[0, 0.15, 0]}>
          <torusGeometry args={[0.08, 0.015, 12, 24, Math.PI]} rotation={[0, 0, Math.PI]} />
          <meshStandardMaterial color="#0f172a" roughness={0.5} />
        </mesh>
        <mesh position={[-0.08, 0.08, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 0.03, 16]} rotation={[0, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#1e293b" roughness={0.4} />
        </mesh>
        <mesh position={[0.08, 0.08, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 0.03, 16]} rotation={[0, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#1e293b" roughness={0.4} />
        </mesh>
      </group>

      {/* Studio Chair */}
      <group position={[0, 0.45, 0.85]} rotation={[0, 0.1, 0]}>
        <mesh position={[0, 0.2, 0]} castShadow>
          <cylinderGeometry args={[0.28, 0.28, 0.08, 24]} />
          <meshStandardMaterial color={isLight ? "#1e293b" : "#0f172a"} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.52, 0.22]} rotation={[-0.1, 0, 0]} castShadow>
          <boxGeometry args={[0.42, 0.55, 0.05]} />
          <meshStandardMaterial color={isLight ? "#334155" : "#1e293b"} roughness={0.6} />
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

// Large Factory Loft Window with Sunbeam
function LoftWindow({ isLight }) {
  return (
    <group position={[-3.6, 2.8, 0]} rotation={[0, Math.PI / 2, 0]}>
      {/* Black Architectural Window Frame */}
      <mesh position={[0, 0, 0.02]}>
        <boxGeometry args={[3.2, 2.4, 0.08]} />
        <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.6} />
      </mesh>
      {/* Glass Pane with High Reflection */}
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[3.0, 2.2]} />
        <meshPhysicalMaterial
          color={isLight ? "#e0f2fe" : "#0f172a"}
          transmission={0.92}
          roughness={0.03}
          thickness={0.03}
        />
      </mesh>
      {/* Window Mullions */}
      <mesh position={[0, 0, 0.03]}>
        <boxGeometry args={[0.04, 2.2, 0.03]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      <mesh position={[0, 0, 0.03]}>
        <boxGeometry args={[3.0, 0.04, 0.03]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      {/* Daylight Exterior Gradient */}
      <mesh position={[0, 0, -0.2]}>
        <planeGeometry args={[4, 3]} />
        <meshBasicMaterial color={isLight ? "#bae6fd" : "#020617"} />
      </mesh>
    </group>
  );
}

// Designer Fiddle-Leaf Fig in Fluted Pot
function DesignerPlant({ isLight }) {
  return (
    <group position={[-2.3, 0, 1.8]}>
      {/* Oak Tripod Stand */}
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.04, 20]} />
        <meshStandardMaterial color="#c89d71" />
      </mesh>
      {[0, (2 * Math.PI) / 3, (4 * Math.PI) / 3].map((angle, i) => (
        <mesh
          key={i}
          position={[Math.cos(angle) * 0.18, 0.15, Math.sin(angle) * 0.18]}
          rotation={[0.1 * Math.sin(angle), 0, -0.1 * Math.cos(angle)]}
        >
          <cylinderGeometry args={[0.02, 0.015, 0.35, 12]} />
          <meshStandardMaterial color="#c89d71" />
        </mesh>
      ))}

      {/* Fluted Ceramic Planter */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.24, 0.19, 0.55, 24]} />
        <meshStandardMaterial color={isLight ? "#f8fafc" : "#1e293b"} roughness={0.25} />
      </mesh>

      {/* Foliage */}
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
            <meshStandardMaterial color={idx % 2 === 0 ? "#15803d" : "#16a34a"} roughness={0.5} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// Room Architecture (Floor, Slat Wall, Lighting)
function StudioRoom({ isLight }) {
  const floorColor = isLight ? "#dfd7ca" : "#060913"; // Polished studio floor
  const wallColor = isLight ? "#f5f0e8" : "#0a0f1d";
  const rugColor = isLight ? "#d1c7b7" : "#0f172a";

  return (
    <group position={[0, 0, 0]}>
      {/* Studio Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[16, 16]} />
        <meshStandardMaterial color={floorColor} roughness={0.3} metalness={0.15} />
      </mesh>

      {/* Scandinavian Circular Wool Rug */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0.3]} receiveShadow>
        <circleGeometry args={[2.2, 48]} />
        <meshStandardMaterial color={rugColor} roughness={0.9} />
      </mesh>

      {/* Back Wall */}
      <mesh position={[0, 3, -3.2]} receiveShadow>
        <planeGeometry args={[14, 6]} />
        <meshStandardMaterial color={wallColor} roughness={0.8} />
      </mesh>

      {/* Left Wall */}
      <mesh position={[-3.6, 3, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[14, 6]} />
        <meshStandardMaterial color={wallColor} roughness={0.8} />
      </mesh>

      {/* Acoustic Wood Slat Wall Paneling */}
      <AcousticWoodWall isLight={isLight} />

      {/* Linear Overhead Fixture */}
      <LinearPendantFixture isLight={isLight} />

      {/* Architectural Loft Window */}
      <LoftWindow isLight={isLight} />

      {/* Potted Designer Plant */}
      <DesignerPlant isLight={isLight} />

      {/* Sunbeam Dust Motes */}
      <AtmosphericDust />

      {/* Soft Contact Shadows on Floor */}
      <ContactShadows
        position={[0, 0.01, 0]}
        opacity={isLight ? 0.55 : 0.8}
        scale={9}
        blur={2.2}
        far={4}
      />
    </group>
  );
}

export default function OfficeScene({ targetView, setTargetView, auditState, theme = 'light', children }) {
  const controlsRef = useRef();
  const isLight = theme === 'light';

  const bgColor = isLight ? "#f0ebe1" : "#030712";

  return (
    <div className={`office-canvas-viewport ${isLight ? 'light-viewport' : ''}`}>
      <Canvas
        shadows
        camera={{ position: [4.4, 3.2, 4.8], fov: 42 }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: isLight ? 1.2 : 1.4
        }}
      >
        <color attach="background" args={[bgColor]} />
        <fog attach="fog" args={[bgColor, 7, 20]} />

        {/* Ambient Natural Light */}
        <ambientLight intensity={isLight ? 0.8 : 0.45} />
        
        {/* Strong Warm Directional Sunbeam through the Window */}
        <directionalLight
          position={[-5.5, 6.5, 3.5]}
          intensity={isLight ? 2.6 : 1.2}
          castShadow
          shadow-bias={-0.0001}
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          color={isLight ? "#fff7ed" : "#e0f2fe"}
        />

        {/* Subtle Cyan / Blue Fill Accent */}
        <pointLight position={[-2, 2.5, 1]} intensity={0.4} color="#38bdf8" distance={7} />
        <pointLight position={[3, 2, -1.5]} intensity={0.3} color="#f59e0b" distance={6} />

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
