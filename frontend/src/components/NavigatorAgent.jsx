import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function NavigatorAgent({ auditState, theme = 'light' }) {
  const isLight = theme === 'light';
  const groupRef = useRef();
  const spineRef = useRef();
  const neckRef = useRef();
  const headRef = useRef();
  const rightArmRef = useRef();
  const leftArmRef = useRef();
  const tabletRef = useRef();
  const scanLaserRef = useRef();

  // Temporary vectors for smooth lerping
  const targetHeadRot = useRef(new THREE.Euler());
  const targetArmRot = useRef(new THREE.Euler());

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const { x, y } = state.pointer; // Mouse coords [-1 to 1]

    // 1. Natural Breathing & subtle idle sway
    if (groupRef.current) {
      groupRef.current.position.y = -1.35 + Math.sin(t * 1.8) * 0.015;
    }

    // 2. Head and Spine Mouse Tracking (Inspired by Moves You Portfolio)
    if (headRef.current && neckRef.current && spineRef.current) {
      // Clamp rotation angles for natural human head limits
      const targetHeadY = THREE.MathUtils.clamp(-x * 0.8, -0.75, 0.75);
      const targetHeadX = THREE.MathUtils.clamp(-y * 0.5, -0.4, 0.4);

      neckRef.current.rotation.y = THREE.MathUtils.lerp(neckRef.current.rotation.y, targetHeadY * 0.4, 0.08);
      neckRef.current.rotation.x = THREE.MathUtils.lerp(neckRef.current.rotation.x, targetHeadX * 0.3, 0.08);

      headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, targetHeadY * 0.6, 0.1);
      headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, targetHeadX * 0.7, 0.1);

      spineRef.current.rotation.y = THREE.MathUtils.lerp(spineRef.current.rotation.y, targetHeadY * 0.25, 0.05);
      spineRef.current.rotation.z = Math.sin(t * 1.5) * 0.01;
    }

    // 3. Dynamic Arm Postures based on Audit Lifecycle
    if (rightArmRef.current && leftArmRef.current) {
      if (auditState.loading) {
        // SCANNING POSE: Both hands holding & interacting with holographic tablet
        rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, -1.2 + Math.sin(t * 4) * 0.05, 0.1);
        rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, -0.35, 0.1);
        rightArmRef.current.rotation.y = THREE.MathUtils.lerp(rightArmRef.current.rotation.y, 0.4, 0.1);

        leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, -1.1, 0.1);
        leftArmRef.current.rotation.z = THREE.MathUtils.lerp(leftArmRef.current.rotation.z, 0.4, 0.1);

        if (scanLaserRef.current) {
          scanLaserRef.current.rotation.z = t * 3;
          scanLaserRef.current.scale.setScalar(1 + Math.sin(t * 8) * 0.15);
        }
      } else if (auditState.result) {
        const hasViolations = auditState.violationsCount > 0;
        if (hasViolations) {
          // ALERT POSE: Right hand pointing urgently toward the violations banner
          rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, -1.45, 0.1);
          rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, -0.65, 0.1);
          rightArmRef.current.rotation.y = THREE.MathUtils.lerp(rightArmRef.current.rotation.y, -0.2, 0.1);

          leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, -0.3, 0.1);
          leftArmRef.current.rotation.z = THREE.MathUtils.lerp(leftArmRef.current.rotation.z, 0.25, 0.1);
        } else {
          // SUCCESS POSE: Confident thumbs-up / relaxed posture
          rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, -0.8, 0.1);
          rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, -0.4, 0.1);
          rightArmRef.current.rotation.y = THREE.MathUtils.lerp(rightArmRef.current.rotation.y, 0.2, 0.1);

          leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, -0.15, 0.1);
          leftArmRef.current.rotation.z = THREE.MathUtils.lerp(leftArmRef.current.rotation.z, 0.2, 0.1);
        }
      } else {
        // IDLE / WELCOME POSE: Right arm gently beckoning towards the input console
        rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, -0.6 + Math.sin(t * 2) * 0.08, 0.08);
        rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, -0.35, 0.08);
        rightArmRef.current.rotation.y = THREE.MathUtils.lerp(rightArmRef.current.rotation.y, 0.1, 0.08);

        leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, 0.1 + Math.sin(t * 1.5) * 0.04, 0.08);
        leftArmRef.current.rotation.z = THREE.MathUtils.lerp(leftArmRef.current.rotation.z, 0.18, 0.08);
      }
    }
  });

  // Palette definition
  const jacketColor = isLight ? "#24363f" : "#0f172a";
  const innerShirt = isLight ? "#ffffff" : "#334155";
  const skinTone = "#f5cbaf";
  const pantsColor = isLight ? "#1e293b" : "#030712";
  const shoesColor = isLight ? "#ffffff" : "#475569";
  const visorColor = auditState.loading ? "#a855f7" : (auditState.violationsCount > 0 ? "#ef4444" : "#00e5ff");

  return (
    <group ref={groupRef} position={[0, -1.35, 0]}>
      {/* Dynamic Floor Spotlight Ring under the character */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[0.7, 0.82, 32]} />
        <meshBasicMaterial color={visorColor} transparent opacity={0.35} />
      </mesh>

      {/* LOWER BODY (PANTS & SHOES) */}
      <group position={[0, 0, 0]}>
        {/* Left Leg */}
        <group position={[-0.18, 0.65, 0]}>
          <mesh castShadow position={[0, -0.3, 0]}>
            <cylinderGeometry args={[0.08, 0.065, 0.65, 16]} />
            <meshStandardMaterial color={pantsColor} roughness={0.6} />
          </mesh>
          {/* Left Shoe */}
          <mesh castShadow position={[0, -0.62, 0.06]}>
            <boxGeometry args={[0.12, 0.08, 0.24]} />
            <meshStandardMaterial color={shoesColor} roughness={0.3} />
          </mesh>
        </group>

        {/* Right Leg */}
        <group position={[0.18, 0.65, 0]}>
          <mesh castShadow position={[0, -0.3, 0]}>
            <cylinderGeometry args={[0.08, 0.065, 0.65, 16]} />
            <meshStandardMaterial color={pantsColor} roughness={0.6} />
          </mesh>
          {/* Right Shoe */}
          <mesh castShadow position={[0, -0.62, 0.06]}>
            <boxGeometry args={[0.12, 0.08, 0.24]} />
            <meshStandardMaterial color={shoesColor} roughness={0.3} />
          </mesh>
        </group>

        {/* Belt & Utility Pack */}
        <mesh position={[0, 0.98, 0]}>
          <cylinderGeometry args={[0.22, 0.22, 0.08, 20]} />
          <meshStandardMaterial color="#0b0f19" roughness={0.4} />
        </mesh>
        {/* Digital Keycard Badge */}
        <mesh position={[0.14, 0.95, 0.2]}>
          <boxGeometry args={[0.06, 0.08, 0.015]} />
          <meshBasicMaterial color={visorColor} />
        </mesh>
      </group>

      {/* UPPER BODY & SPINE (Rotates with mouse) */}
      <group ref={spineRef} position={[0, 1.02, 0]}>
        {/* Torso Jacket */}
        <mesh castShadow position={[0, 0.35, 0]}>
          <boxGeometry args={[0.46, 0.58, 0.26]} />
          <meshStandardMaterial color={jacketColor} roughness={0.4} />
        </mesh>

        {/* Inner Shirt Collar */}
        <mesh position={[0, 0.58, 0.12]}>
          <boxGeometry args={[0.18, 0.12, 0.04]} />
          <meshStandardMaterial color={innerShirt} roughness={0.7} />
        </mesh>

        {/* NECK JOINT */}
        <group ref={neckRef} position={[0, 0.68, 0]}>
          <mesh position={[0, 0.06, 0]}>
            <cylinderGeometry args={[0.075, 0.085, 0.12, 16]} />
            <meshStandardMaterial color={skinTone} roughness={0.6} />
          </mesh>

          {/* HEAD GROUP (Inverse Kinematics Mouse Look) */}
          <group ref={headRef} position={[0, 0.18, 0]}>
            {/* Face / Head Base */}
            <mesh castShadow position={[0, 0.08, 0]}>
              <boxGeometry args={[0.26, 0.3, 0.25]} />
              <meshStandardMaterial color={skinTone} roughness={0.5} />
            </mesh>

            {/* Stylized Modern Hair (Matte Dark) */}
            <mesh position={[0, 0.24, -0.02]} castShadow>
              <boxGeometry args={[0.29, 0.14, 0.28]} />
              <meshStandardMaterial color="#1a1c23" roughness={0.8} />
            </mesh>
            <mesh position={[0, 0.28, 0.06]} castShadow>
              <boxGeometry args={[0.27, 0.08, 0.14]} />
              <meshStandardMaterial color="#1a1c23" roughness={0.8} />
            </mesh>

            {/* Futuristic AR Compliance Visor */}
            <mesh position={[0, 0.1, 0.13]}>
              <boxGeometry args={[0.24, 0.075, 0.04]} />
              <meshPhysicalMaterial
                color={visorColor}
                transmission={0.4}
                roughness={0.1}
                metalness={0.2}
                emissive={visorColor}
                emissiveIntensity={auditState.loading ? 0.8 : 0.4}
              />
            </mesh>

            {/* Audio Headset / Comms Boom Mic */}
            <mesh position={[-0.14, 0.09, 0]}>
              <cylinderGeometry args={[0.04, 0.04, 0.03, 16]} rotation={[0, 0, Math.PI / 2]} />
              <meshStandardMaterial color="#0f172a" metalness={0.8} />
            </mesh>
            <mesh position={[-0.14, 0.02, 0.08]} rotation={[0.4, 0, 0]}>
              <cylinderGeometry args={[0.008, 0.008, 0.14, 8]} />
              <meshStandardMaterial color="#64748b" metalness={0.8} />
            </mesh>
          </group>
        </group>

        {/* LEFT ARM */}
        <group ref={leftArmRef} position={[-0.28, 0.54, 0]}>
          {/* Shoulder & Bicep */}
          <mesh castShadow position={[0, -0.16, 0]}>
            <cylinderGeometry args={[0.065, 0.055, 0.32, 16]} />
            <meshStandardMaterial color={jacketColor} roughness={0.4} />
          </mesh>
          {/* Forearm & Hand */}
          <group position={[0, -0.32, 0]}>
            <mesh castShadow position={[0, -0.14, 0]}>
              <cylinderGeometry args={[0.055, 0.045, 0.28, 16]} />
              <meshStandardMaterial color={innerShirt} roughness={0.6} />
            </mesh>
            <mesh position={[0, -0.3, 0]}>
              <sphereGeometry args={[0.045, 12, 12]} />
              <meshStandardMaterial color={skinTone} />
            </mesh>
          </group>
        </group>

        {/* RIGHT ARM (Pointing / Gesturing / Typing) */}
        <group ref={rightArmRef} position={[0.28, 0.54, 0]}>
          {/* Shoulder & Bicep */}
          <mesh castShadow position={[0, -0.16, 0]}>
            <cylinderGeometry args={[0.065, 0.055, 0.32, 16]} />
            <meshStandardMaterial color={jacketColor} roughness={0.4} />
          </mesh>
          {/* Forearm & Hand */}
          <group position={[0, -0.32, 0]}>
            <mesh castShadow position={[0, -0.14, 0]}>
              <cylinderGeometry args={[0.055, 0.045, 0.28, 16]} />
              <meshStandardMaterial color={innerShirt} roughness={0.6} />
            </mesh>
            {/* Hand */}
            <mesh position={[0, -0.3, 0]}>
              <sphereGeometry args={[0.045, 12, 12]} />
              <meshStandardMaterial color={skinTone} />
            </mesh>

            {/* Holographic Datapad Tablet (Visible when scanning or interacting) */}
            <group ref={tabletRef} position={[0.1, -0.28, 0.2]} rotation={[0.4, -0.3, 0]}>
              <mesh>
                <boxGeometry args={[0.22, 0.015, 0.32]} />
                <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
              </mesh>
              {/* Glowing Holographic Screen Surface */}
              <mesh position={[0, 0.01, 0]}>
                <planeGeometry args={[0.19, 0.28]} rotation={[-Math.PI / 2, 0, 0]} />
                <meshBasicMaterial color={visorColor} />
              </mesh>

              {/* Laser Projection Plane when Scanning */}
              {auditState.loading && (
                <group ref={scanLaserRef} position={[0, 0.2, 0]}>
                  <mesh rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[0.05, 0.45, 32]} />
                    <meshBasicMaterial color="#a855f7" transparent opacity={0.35} side={THREE.DoubleSide} />
                  </mesh>
                </group>
              )}
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

