import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Float } from '@react-three/drei';
import * as THREE from 'three';

// 3D LiDAR Point Cloud Particle Field
function LidarPointCloud({ isScanning }) {
  const pointsRef = useRef();

  const [positions, colors] = useMemo(() => {
    const count = 1800;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    const baseColor1 = new THREE.Color("#0284c7");
    const baseColor2 = new THREE.Color("#00e5ff");
    const highlightColor = new THREE.Color("#ef4444");

    for (let i = 0; i < count; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 1.3 + Math.cbrt(Math.random()) * 1.5;

      const sinPhi = Math.sin(phi);
      pos[i * 3] = r * sinPhi * Math.cos(theta);
      pos[i * 3 + 1] = r * sinPhi * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);

      const mixed = (i % 25 === 0) ? highlightColor : (Math.random() > 0.5 ? baseColor1 : baseColor2);
      col[i * 3] = mixed.r;
      col[i * 3 + 1] = mixed.g;
      col[i * 3 + 2] = mixed.b;
    }

    return [pos, col];
  }, []);

  useFrame(({ clock }) => {
    if (pointsRef.current) {
      const t = clock.getElapsedTime();
      pointsRef.current.rotation.y = t * 0.15;
      pointsRef.current.rotation.x = Math.sin(t * 0.1) * 0.08;

      if (isScanning) {
        const scale = 1 + Math.sin(t * 4) * 0.04;
        pointsRef.current.scale.set(scale, scale, scale);
      }
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.032}
        vertexColors
        transparent
        opacity={0.7}
        sizeAttenuation
      />
    </points>
  );
}

// Precision Multi-Axis Gimbal & Optical Lens
function GimbalCore({ isScanning }) {
  const outerRingRef = useRef();
  const innerRingRef = useRef();
  const lensRef = useRef();
  const laserRef = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (outerRingRef.current) {
      outerRingRef.current.rotation.y = t * 0.25;
      outerRingRef.current.rotation.x = Math.sin(t * 0.2) * 0.15;
    }
    if (innerRingRef.current) {
      innerRingRef.current.rotation.x = -t * 0.35;
      innerRingRef.current.rotation.z = Math.cos(t * 0.25) * 0.2;
    }
    if (laserRef.current) {
      laserRef.current.rotation.y = -t * 1.5;
      laserRef.current.position.y = Math.sin(t * 2) * 0.4;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Outer Titanium Gimbal Ring */}
      <group ref={outerRingRef}>
        <mesh castShadow>
          <torusGeometry args={[1.5, 0.035, 24, 64]} />
          <meshStandardMaterial
            color="#24363F"
            metalness={0.9}
            roughness={0.2}
          />
        </mesh>
        {/* Ring Markers */}
        {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((angle, i) => (
          <mesh key={i} position={[Math.cos(angle) * 1.5, Math.sin(angle) * 1.5, 0]}>
            <boxGeometry args={[0.06, 0.06, 0.08]} />
            <meshStandardMaterial color="#0284c7" metalness={0.8} />
          </mesh>
        ))}
      </group>

      {/* Inner Precision Ring */}
      <group ref={innerRingRef}>
        <mesh castShadow>
          <torusGeometry args={[1.2, 0.028, 24, 64]} />
          <meshStandardMaterial
            color="#475569"
            metalness={0.85}
            roughness={0.25}
          />
        </mesh>
      </group>

      {/* Central Optical Housing */}
      <group ref={lensRef}>
        {/* Main Spherical Core */}
        <mesh castShadow>
          <sphereGeometry args={[0.72, 32, 32]} />
          <meshStandardMaterial
            color="#1e293b"
            roughness={0.3}
            metalness={0.7}
          />
        </mesh>

        {/* Optical Glass Lens Element */}
        <mesh position={[0, 0, 0.52]}>
          <cylinderGeometry args={[0.42, 0.42, 0.12, 32]} rotation={[Math.PI / 2, 0, 0]} />
          <meshPhysicalMaterial
            color="#0284c7"
            transmission={0.85}
            roughness={0.05}
            metalness={0.1}
            ior={1.52}
            reflectivity={0.9}
          />
        </mesh>

        {/* Internal Optical Aperture Iris */}
        <mesh position={[0, 0, 0.56]}>
          <ringGeometry args={[0.12, 0.38, 32]} />
          <meshStandardMaterial color="#090d16" roughness={0.4} />
        </mesh>

        {/* Laser Emitter Bevel */}
        <mesh position={[0, 0, 0.58]}>
          <sphereGeometry args={[0.06, 20, 20]} />
          <meshBasicMaterial color={isScanning ? "#ef4444" : "#00e5ff"} />
        </mesh>

        {/* Internal Core Light */}
        <pointLight
          position={[0, 0, 0.6]}
          color={isScanning ? "#ef4444" : "#00e5ff"}
          intensity={1.2}
          distance={3}
        />
      </group>

      {/* Sweeping LiDAR Laser Plane */}
      <group ref={laserRef}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.6, 2.2, 48]} />
          <meshBasicMaterial
            color="#0284c7"
            transparent
            opacity={0.18}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
    </group>
  );
}

export default function ScannerCore({ isScanning = false }) {
  return (
    <div className="scanner-canvas-wrap">
      <Canvas
        camera={{ position: [0, 0.5, 4.6], fov: 45 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <ambientLight intensity={0.8} />
        
        {/* Studio Precision Key Light */}
        <directionalLight
          position={[5, 8, 5]}
          intensity={1.8}
          color="#ffffff"
        />

        {/* Cool Cyan Rim Light */}
        <pointLight position={[-4, 3, 2]} intensity={1.2} color="#00e5ff" distance={10} />

        {/* Warm Slate Fill Light */}
        <pointLight position={[3, -2, -2]} intensity={0.6} color="#94a3b8" distance={8} />

        {/* Floating Animated Core */}
        <Float speed={1.8} rotationIntensity={0.2} floatIntensity={0.3}>
          <GimbalCore isScanning={isScanning} />
          <LidarPointCloud isScanning={isScanning} />
        </Float>

        {/* Ground Floor Shadow */}
        <ContactShadows
          position={[0, -2.1, 0]}
          opacity={0.35}
          scale={7}
          blur={2.5}
          far={4}
        />

        {/* Interactive Mouse Orbit */}
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          maxPolarAngle={Math.PI / 1.7}
          minPolarAngle={Math.PI / 2.8}
          dampingFactor={0.06}
        />
      </Canvas>
    </div>
  );
}

