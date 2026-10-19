"use client";

import React, { useRef, useEffect, useState, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  RoundedBox,
  Environment,
  Lightformer,
  ContactShadows,
} from "@react-three/drei";
import * as THREE from "three";
import VaultFallback from "./VaultFallback";

interface VaultSceneProps {
  scrollProgress: number;
  isTouchDevice: boolean;
}

function VaultMesh({ scrollProgress, isTouchDevice }: VaultSceneProps) {
  const groupRef = useRef<THREE.Group>(null);
  const doorGroupRef = useRef<THREE.Group>(null);
  const dialRef = useRef<THREE.Group>(null);
  const coinsRef = useRef<THREE.Group[]>([]);

  // 5 Orbiting Gold Coins config
  const coinsConfig = useMemo(
    () => [
      { radius: 2.1, speed: 0.8, offset: 0, y: 0.6, zOffset: 0.2 },
      { radius: 2.3, speed: -0.7, offset: 1.5, y: -0.4, zOffset: -0.1 },
      { radius: 2.0, speed: 0.9, offset: 3.1, y: 0.2, zOffset: 0.3 },
      { radius: 2.4, speed: -0.6, offset: 4.2, y: 0.8, zOffset: 0.0 },
      { radius: 2.2, speed: 0.75, offset: 5.3, y: -0.7, zOffset: 0.4 },
    ],
    []
  );

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    if (groupRef.current) {
      // 1. Idle Float (sin wave)
      groupRef.current.position.y = Math.sin(t * 1.4) * 0.1;

      // 2. Tilt toward pointer (max 12 degrees = ~0.209 rad)
      if (isTouchDevice) {
        // Slow auto-sway on touch devices
        groupRef.current.rotation.y = Math.sin(t * 0.7) * 0.12;
        groupRef.current.rotation.x = Math.cos(t * 0.5) * 0.08;
      } else {
        const targetRotY = THREE.MathUtils.clamp(
          state.pointer.x * 0.209,
          -0.209,
          0.209
        );
        const targetRotX = THREE.MathUtils.clamp(
          -state.pointer.y * 0.209,
          -0.209,
          0.209
        );
        groupRef.current.rotation.y = THREE.MathUtils.lerp(
          groupRef.current.rotation.y,
          targetRotY,
          0.06
        );
        groupRef.current.rotation.x = THREE.MathUtils.lerp(
          groupRef.current.rotation.x,
          targetRotX,
          0.06
        );
      }
    }

    // 3. Center dial rotation: 360 degrees on scroll through hero
    if (dialRef.current) {
      const targetDialRotation = scrollProgress * Math.PI * 2;
      dialRef.current.rotation.z = THREE.MathUtils.lerp(
        dialRef.current.rotation.z,
        targetDialRotation,
        0.1
      );
    }

    // 4. Door "click" tiny scale pulse
    if (doorGroupRef.current) {
      const clickPulse = 1.0 + Math.sin(scrollProgress * Math.PI * 6) * 0.02;
      doorGroupRef.current.scale.set(clickPulse, clickPulse, clickPulse);
    }

    // 5. Orbiting & spinning gold coins
    coinsConfig.forEach((cfg, i) => {
      const coinMesh = coinsRef.current[i];
      if (!coinMesh) return;
      const angle = t * cfg.speed + cfg.offset;
      coinMesh.position.x = Math.cos(angle) * cfg.radius;
      coinMesh.position.z = Math.sin(angle) * (cfg.radius * 0.45) + cfg.zOffset;
      coinMesh.position.y = cfg.y + Math.sin(t * 1.8 + i) * 0.12;
      coinMesh.rotation.x += 0.025;
      coinMesh.rotation.y += 0.035;
    });
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* ── Vault Body: RoundedBox, --violet (#6B4DFF), roughness 0.35, metalness 0.15 ── */}
      <RoundedBox
        args={[2.4, 2.4, 1.2]}
        radius={0.22}
        smoothness={4}
        position={[0, 0, 0]}
      >
        <meshStandardMaterial
          color="#6B4DFF"
          roughness={0.35}
          metalness={0.15}
        />
      </RoundedBox>

      {/* ── Door Assembly (slightly smaller, lighter violet, chrome rim) ── */}
      <group ref={doorGroupRef} position={[0, 0, 0.62]}>
        {/* Door Face: lighter violet RoundedBox */}
        <RoundedBox args={[2.02, 2.02, 0.2]} radius={0.16} smoothness={4}>
          <meshStandardMaterial
            color="#886BFF"
            roughness={0.35}
            metalness={0.2}
          />
        </RoundedBox>

        {/* Thick Chrome Torus Rim (metalness 0.9, roughness 0.2) */}
        <mesh position={[0, 0, 0.11]}>
          <torusGeometry args={[0.92, 0.085, 24, 64]} />
          <meshStandardMaterial
            color="#ECEFF2"
            metalness={0.9}
            roughness={0.2}
          />
        </mesh>

        {/* 4 Corner Bolts: small cylinders, chrome */}
        {[
          [-0.82, 0.82],
          [0.82, 0.82],
          [-0.82, -0.82],
          [0.82, -0.82],
        ].map(([x, y], idx) => (
          <mesh
            key={idx}
            position={[x, y, 0.1]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry args={[0.075, 0.075, 0.06, 16]} />
            <meshStandardMaterial
              color="#FFFFFF"
              metalness={0.92}
              roughness={0.18}
            />
          </mesh>
        ))}

        {/* ── Keyhole slot on the door ── */}
        <group position={[0, -0.52, 0.11]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.02, 16]} />
            <meshBasicMaterial color="#14102B" />
          </mesh>
          <mesh position={[0, -0.05, 0]}>
            <boxGeometry args={[0.06, 0.08, 0.02]} />
            <meshBasicMaterial color="#14102B" />
          </mesh>
        </group>

        {/* ── Center Dial: Lime cylinder with 12 ink ticks & 3-spoke chrome handle ── */}
        <group ref={dialRef} position={[0, 0, 0.14]}>
          {/* Lime Cylinder Dial */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.52, 0.52, 0.1, 32]} />
            <meshStandardMaterial
              color="#CFFF3A"
              roughness={0.3}
              metalness={0.1}
            />
          </mesh>

          {/* 12 Small Ink Tick Marks around the edge */}
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i / 12) * Math.PI * 2;
            return (
              <mesh
                key={i}
                position={[
                  Math.cos(angle) * 0.44,
                  Math.sin(angle) * 0.44,
                  0.055,
                ]}
                rotation={[0, 0, angle + Math.PI / 2]}
              >
                <boxGeometry args={[0.02, 0.075, 0.02]} />
                <meshBasicMaterial color="#14102B" />
              </mesh>
            );
          })}

          {/* 3-Spoke Chrome Handle */}
          <group position={[0, 0, 0.06]}>
            {/* Center Chrome Hub */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.13, 0.13, 0.12, 16]} />
              <meshStandardMaterial
                color="#ECEFF2"
                metalness={0.9}
                roughness={0.2}
              />
            </mesh>

            {/* 3 Spokes radiating outward at 0, 120, 240 degrees */}
            {[0, (2 * Math.PI) / 3, (4 * Math.PI) / 3].map((rad, idx) => (
              <group key={idx} rotation={[0, 0, rad]}>
                <mesh position={[0.22, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.035, 0.035, 0.38, 16]} />
                  <meshStandardMaterial
                    color="#ECEFF2"
                    metalness={0.9}
                    roughness={0.2}
                  />
                </mesh>
                {/* Outer Spoke Knob */}
                <mesh position={[0.42, 0, 0]}>
                  <sphereGeometry args={[0.065, 16, 16]} />
                  <meshStandardMaterial
                    color="#FFFFFF"
                    metalness={0.92}
                    roughness={0.18}
                  />
                </mesh>
              </group>
            ))}
          </group>
        </group>
      </group>

      {/* ── 5 Gold Coins Orbiting/Floating Around Vault ── */}
      {coinsConfig.map((_, i) => (
        <group
          key={i}
          ref={(el) => {
            if (el) coinsRef.current[i] = el;
          }}
        >
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 0.04, 24]} />
            <meshStandardMaterial
              color="#FFD23F"
              metalness={0.88}
              roughness={0.22}
            />
          </mesh>
        </group>
      ))}

      {/* Soft Contact Shadow under the vault */}
      <ContactShadows
        position={[0, -1.6, 0]}
        opacity={0.32}
        scale={5.5}
        blur={2.4}
        far={3.8}
        color="#14102B"
      />
    </group>
  );
}

export default function Vault3D() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [inView, setInView] = useState(true);
  const [hasWebGL, setHasWebGL] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Detect Reduced Motion
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motionQuery.matches) {
      setReducedMotion(true);
      return;
    }

    // 2. Detect Touch Device
    setIsTouchDevice(window.matchMedia("(pointer: coarse)").matches);

    // 3. Detect WebGL Availability
    try {
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (!gl) setHasWebGL(false);
    } catch {
      setHasWebGL(false);
    }

    // 4. Scroll tracking for center dial 360deg rotation
    const handleScroll = () => {
      const maxScroll = window.innerHeight * 0.9;
      const progress = Math.min(Math.max(window.scrollY / maxScroll, 0), 1);
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    // 5. Pause rendering when offscreen (IntersectionObserver)
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
      },
      { threshold: 0.05 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener("scroll", handleScroll);
      observer.disconnect();
    };
  }, []);

  // Show static SVG fallback for reduced motion or WebGL failure
  if (reducedMotion || !hasWebGL) {
    return <VaultFallback />;
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-[280px] sm:min-h-[440px] flex items-center justify-center relative select-none"
    >
      <Canvas
        camera={{ position: [0, 0, 4.6], fov: 45 }}
        dpr={[1, 1.75]}
        frameloop={inView ? "always" : "never"}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        className="w-full h-full"
      >
        {/* Lighting Setup: Ambient + Warm Directional + Cool Rim */}
        <ambientLight intensity={0.75} />
        <directionalLight
          position={[4, 5, 4]}
          intensity={1.5}
          color="#FFF4E3"
        />
        <directionalLight
          position={[-4, -3, -3]}
          intensity={1.1}
          color="#D6E4FF"
        />

        {/* Procedural Environment with Lightformers (NO external HDR) */}
        <Environment resolution={128}>
          <Lightformer
            form="rect"
            intensity={2}
            color="#FFFFFF"
            position={[0, 4, 2]}
            scale={[5, 2, 1]}
          />
          <Lightformer
            form="circle"
            intensity={1.5}
            color="#CFFF3A"
            position={[-3, 0, 2]}
            scale={2}
          />
          <Lightformer
            form="circle"
            intensity={1.4}
            color="#FFF4E3"
            position={[3, 2, 2]}
            scale={2}
          />
        </Environment>

        {/* The 3D Vault Mesh */}
        <VaultMesh
          scrollProgress={scrollProgress}
          isTouchDevice={isTouchDevice}
        />
      </Canvas>
    </div>
  );
}
