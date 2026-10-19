"use client";

import React, { useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function VaultDoorMesh({ scrollProgress }: { scrollProgress: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const dialRef = useRef<THREE.Group>(null);
  const ringMatRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((state) => {
    if (!groupRef.current) return;

    // Gentle floating
    const t = state.clock.getElapsedTime();
    groupRef.current.position.y = Math.sin(t * 1.5) * 0.08;

    // Pointer mouse tilt (lerp)
    const targetRotY = state.pointer.x * 0.35;
    const targetRotX = -state.pointer.y * 0.25;
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotY, 0.05);
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotX, 0.05);

    // Dial rotation tied to scroll + subtle idle twist
    if (dialRef.current) {
      const scrollRotation = scrollProgress * Math.PI * 4;
      const idleTwist = Math.sin(t * 0.8) * 0.05;
      dialRef.current.rotation.z = THREE.MathUtils.lerp(
        dialRef.current.rotation.z,
        scrollRotation + idleTwist,
        0.08
      );
    }

    // Lime glow intensity pulses subtly and strengthens as dial turns
    if (ringMatRef.current) {
      const baseGlow = 1.0 + Math.sin(t * 2.5) * 0.2;
      const scrollBoost = Math.min(scrollProgress * 2.0, 1.5);
      ringMatRef.current.emissiveIntensity = baseGlow + scrollBoost;
    }
  });

  // 12 Rivet bolts positions around perimeter
  const boltPositions = React.useMemo(() => {
    const list: [number, number, number][] = [];
    const radius = 1.35;
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      list.push([Math.cos(angle) * radius, Math.sin(angle) * radius, 0.18]);
    }
    return list;
  }, []);

  return (
    <group ref={groupRef}>
      {/* Heavy Outer Titanium Frame */}
      <mesh position={[0, 0, 0]}>
        <torusGeometry args={[1.65, 0.14, 24, 64]} />
        <meshStandardMaterial
          color="#181624"
          roughness={0.25}
          metalness={0.88}
        />
      </mesh>

      {/* Main Solid Vault Door Disc */}
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.56, 1.56, 0.3, 64]} />
        <meshStandardMaterial
          color="#12101E"
          roughness={0.35}
          metalness={0.82}
        />
      </mesh>

      {/* Recessed Concentric Plate */}
      <mesh position={[0, 0, 0.12]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.28, 1.28, 0.08, 64]} />
        <meshStandardMaterial
          color="#1D1A2E"
          roughness={0.2}
          metalness={0.92}
        />
      </mesh>

      {/* Lime Neon Glow Ring (Clicks shut lock effect) */}
      <mesh position={[0, 0, 0.16]}>
        <torusGeometry args={[1.26, 0.025, 16, 64]} />
        <meshStandardMaterial
          ref={ringMatRef}
          color="#C6FF3D"
          emissive="#C6FF3D"
          emissiveIntensity={1.2}
          roughness={0.1}
          metalness={0.1}
        />
      </mesh>

      {/* Violet Subtle Inner Glow Ring */}
      <mesh position={[0, 0, 0.16]}>
        <torusGeometry args={[0.78, 0.018, 16, 48]} />
        <meshStandardMaterial
          color="#7C5CFF"
          emissive="#7C5CFF"
          emissiveIntensity={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Perimeter Rivet Bolts */}
      {boltPositions.map((pos, idx) => (
        <mesh key={idx} position={pos} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.045, 0.045, 0.06, 16]} />
          <meshStandardMaterial
            color="#5C5778"
            roughness={0.15}
            metalness={0.95}
          />
        </mesh>
      ))}

      {/* Central Spoked Dial Wheel (Rotates on scroll) */}
      <group ref={dialRef} position={[0, 0, 0.2]}>
        {/* Hub Center */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.38, 0.42, 0.16, 32]} />
          <meshStandardMaterial
            color="#322E4A"
            roughness={0.2}
            metalness={0.9}
          />
        </mesh>

        {/* Center Chrome Cap */}
        <mesh position={[0, 0, 0.1]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.22, 0.22, 0.06, 32]} />
          <meshStandardMaterial
            color="#8F8BAA"
            roughness={0.1}
            metalness={0.98}
          />
        </mesh>

        {/* Center Lime Core Pip */}
        <mesh position={[0, 0, 0.14]}>
          <sphereGeometry args={[0.07, 16, 16]} />
          <meshStandardMaterial
            color="#C6FF3D"
            emissive="#C6FF3D"
            emissiveIntensity={1.5}
          />
        </mesh>

        {/* 4 Heavy Spoke Handles */}
        {[0, 1, 2, 3].map((i) => {
          const angle = (i * Math.PI) / 2;
          const spokeLength = 0.55;
          const midDist = 0.42 + spokeLength / 2;
          const endDist = 0.42 + spokeLength;
          return (
            <group key={i} rotation={[0, 0, angle]}>
              {/* Spoke Rod */}
              <mesh position={[0, midDist, 0.04]}>
                <cylinderGeometry args={[0.035, 0.035, spokeLength, 16]} />
                <meshStandardMaterial
                  color="#635E85"
                  roughness={0.15}
                  metalness={0.95}
                />
              </mesh>
              {/* Spoke Handle Grip */}
              <mesh position={[0, endDist, 0.04]}>
                <sphereGeometry args={[0.075, 16, 16]} />
                <meshStandardMaterial
                  color="#151322"
                  roughness={0.4}
                  metalness={0.8}
                />
              </mesh>
              {/* Handle Lime Trim */}
              <mesh position={[0, endDist, 0.04]}>
                <torusGeometry args={[0.08, 0.012, 12, 24]} />
                <meshStandardMaterial
                  color="#C6FF3D"
                  emissive="#C6FF3D"
                  emissiveIntensity={1.2}
                />
              </mesh>
            </group>
          );
        })}
      </group>
    </group>
  );
}

export default function Vault3D() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const maxScroll = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight
      );
      const progress = Math.min(1, Math.max(0, window.scrollY / (maxScroll * 0.4)));
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="w-full h-full min-h-[420px] sm:min-h-[500px] lg:min-h-[560px] relative select-none flex items-center justify-center">
      {/* Dynamic Background Atmosphere Glow */}
      <div className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-violet/25 blur-3xl -z-10 pointer-events-none" />
      <div className="absolute w-60 h-60 sm:w-80 sm:h-80 rounded-full bg-accent/20 blur-2xl -z-10 pointer-events-none" />

      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0, 3.4], fov: 45 }}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        className="w-full h-full"
      >
        <ambientLight intensity={0.8} />
        {/* Main Key Light */}
        <directionalLight position={[4, 6, 4]} intensity={2.2} color="#FFFFFF" />
        {/* Soft Metallic Fill Light */}
        <directionalLight position={[-4, -3, 3]} intensity={0.9} color="#B5B0D0" />
        {/* Violet Rim Accent */}
        <pointLight position={[-3, 2, 2]} intensity={4.5} color="#7C5CFF" distance={8} />
        {/* Lime Core Kick Light */}
        <pointLight position={[3, -3, 2.5]} intensity={5.0} color="#C6FF3D" distance={8} />

        <VaultDoorMesh scrollProgress={scrollProgress} />
      </Canvas>
    </div>
  );
}
