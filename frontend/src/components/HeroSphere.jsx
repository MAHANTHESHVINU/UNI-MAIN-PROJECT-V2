import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sphere, MeshDistortMaterial, OrbitControls, Stars } from "@react-three/drei";

function GlowSphere() {
  const meshRef = useRef();
  const wireRef = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.18;
      meshRef.current.rotation.x = Math.sin(t * 0.12) * 0.15;
      meshRef.current.position.y = Math.sin(t * 0.6) * 0.12;
    }
    if (wireRef.current) {
      wireRef.current.rotation.y = -t * 0.1;
      wireRef.current.rotation.z = t * 0.08;
    }
  });

  return (
    <group>
      {/* Outer glow wireframe */}
      <mesh ref={wireRef}>
        <sphereGeometry args={[1.55, 28, 28]} />
        <meshBasicMaterial
          color="#00e5ff"
          wireframe
          transparent
          opacity={0.08}
        />
      </mesh>

      {/* Mid ring wireframe */}
      <mesh rotation={[Math.PI / 3, 0, Math.PI / 6]}>
        <torusGeometry args={[1.7, 0.004, 4, 90]} />
        <meshBasicMaterial color="#a855f7" transparent opacity={0.35} />
      </mesh>

      <mesh rotation={[Math.PI / 5, Math.PI / 4, 0]}>
        <torusGeometry args={[1.85, 0.003, 4, 90]} />
        <meshBasicMaterial color="#00e5ff" transparent opacity={0.2} />
      </mesh>

      {/* Main distorted sphere */}
      <Sphere ref={meshRef} args={[1.2, 128, 128]}>
        <MeshDistortMaterial
          color="#1a0a3c"
          emissive="#3b0fa8"
          emissiveIntensity={0.55}
          distort={0.28}
          speed={1.8}
          roughness={0.1}
          metalness={0.85}
        />
      </Sphere>

      {/* Point lights for glow effect */}
      <pointLight position={[2.5, 2, 2]} color="#00e5ff" intensity={3} distance={6} />
      <pointLight position={[-2.5, -1, -1]} color="#a855f7" intensity={2.5} distance={6} />
      <pointLight position={[0, 3, 0]} color="#3b82f6" intensity={1.5} distance={5} />
    </group>
  );
}

export default function HeroSphere() {
  return (
    <Canvas
      camera={{ position: [0, 0, 4], fov: 42 }}
      style={{ width: "100%", height: "100%", background: "transparent" }}
      gl={{ alpha: true, antialias: true }}
    >
      <ambientLight intensity={0.15} />
      <Stars
        radius={60}
        depth={40}
        count={600}
        factor={2}
        saturation={0.5}
        fade
        speed={0.4}
      />
      <GlowSphere />
    </Canvas>
  );
}
