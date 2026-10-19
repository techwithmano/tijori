"use client";

import React, { useRef, useEffect, useState, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { RoundedBox, Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import VaultFallback from "./VaultFallback";

interface VaultSceneProps {
  scrollProgress: number;
  isTouchDevice: boolean;
  isRTL: boolean;
  onVaultClick: () => void;
}

function VaultMesh({ scrollProgress, isTouchDevice, isRTL, onVaultClick }: VaultSceneProps) {
  const groupRef = useRef<THREE.Group>(null);
  const wheelGroupRef = useRef<THREE.Group>(null);
  const coinsRef = useRef<THREE.Group[]>([]);
  const clickBonusRotRef = useRef<number>(0);
  const targetClickBonusRotRef = useRef<number>(0);
  const pointerPosRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      pointerPosRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointerPosRef.current.y = -(e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, []);

  // 6 Orbiting Gold Coins config (radius 0.35, loop in FRONT and BEHIND the vault)
  const coinsConfig = useMemo(
    () => [
      { radiusX: 2.7, speed: 0.65, offset: 0.0, y: 0.75, zAmplitude: 1.75 },
      { radiusX: 3.1, speed: -0.6, offset: 1.05, y: -0.45, zAmplitude: 1.85 },
      { radiusX: 2.5, speed: 0.75, offset: 2.1, y: 0.2, zAmplitude: 1.65 },
      { radiusX: 2.9, speed: -0.7, offset: 3.15, y: 0.95, zAmplitude: 1.8 },
      { radiusX: 3.2, speed: 0.55, offset: 4.2, y: -0.85, zAmplitude: 1.9 },
      { radiusX: 2.6, speed: -0.65, offset: 5.25, y: -0.15, zAmplitude: 1.7 },
    ],
    []
  );

  const handleClick = (e: any) => {
    e.stopPropagation();
    targetClickBonusRotRef.current += Math.PI * 2;
    onVaultClick();
  };

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    if (groupRef.current) {
      // 1. Idle Float (gentle sin wave)
      groupRef.current.position.y = Math.sin(t * 1.3) * 0.08;

      // 2. Tilt: default rest rotation y = -0.25 rad, x = 0.08 rad
      // Max pointer tilt 8 degrees (~0.1396 rad)
      if (isTouchDevice) {
        // Slow auto-sway of +/- 4 degrees (~0.07 rad) on touch devices
        groupRef.current.rotation.y = -0.25 + Math.sin(t * 0.8) * 0.07;
        groupRef.current.rotation.x = 0.08 + Math.cos(t * 0.6) * 0.04;
      } else {
        const px = pointerPosRef.current.x !== 0 ? pointerPosRef.current.x : state.pointer.x;
        const py = pointerPosRef.current.y !== 0 ? pointerPosRef.current.y : state.pointer.y;
        const targetRotY = -0.25 + THREE.MathUtils.clamp(px * 0.1396, -0.1396, 0.1396);
        const targetRotX = 0.08 - THREE.MathUtils.clamp(py * 0.1396, -0.1396, 0.1396);
        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotY, 0.07);
        groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotX, 0.07);
      }
    }

    // 3. Wheel rotation: scroll 360deg + click 360deg spin
    clickBonusRotRef.current = THREE.MathUtils.lerp(
      clickBonusRotRef.current,
      targetClickBonusRotRef.current,
      0.08
    );

    if (wheelGroupRef.current) {
      const scrollRot = scrollProgress * Math.PI * 2;
      wheelGroupRef.current.rotation.z = scrollRot + clickBonusRotRef.current;
    }

    // 4. 6 Orbiting & spinning gold coins
    // On desktop, shift center of orbit slightly towards the text side so coins swoop deeper behind text
    const isDesktop = state.size.width >= 768;
    const shiftX = isDesktop ? (isRTL ? 0.5 : -0.5) : 0;

    coinsConfig.forEach((cfg, i) => {
      const coinMesh = coinsRef.current[i];
      if (!coinMesh) return;
      const angle = t * cfg.speed + cfg.offset;
      coinMesh.position.x = Math.cos(angle) * cfg.radiusX + shiftX;
      // z moves in front of (z > 0.8) and behind (z < -0.65) the vault
      coinMesh.position.z = Math.sin(angle) * cfg.zAmplitude;
      coinMesh.position.y = cfg.y + Math.sin(t * 1.6 + i) * 0.09;
      coinMesh.rotation.x += 0.02;
      coinMesh.rotation.y += 0.035;
    });
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]} onClick={handleClick} onPointerDown={handleClick}>
      {/* ── Vault Main Body: RoundedBox, #6B4DFF, roughness 0.35, metalness 0.15 ── */}
      <RoundedBox args={[2.5, 2.5, 1.3]} radius={0.24} smoothness={4} position={[0, 0, 0]}>
        <meshStandardMaterial color="#6B4DFF" roughness={0.35} metalness={0.15} />
      </RoundedBox>

      {/* ── 2 Chrome Hinges on the Start Side (x = -1.24) ── */}
      {[-0.65, 0.65].map((yPos, idx) => (
        <group key={`hinge-${idx}`} position={[-1.24, yPos, 0.45]}>
          <mesh>
            <cylinderGeometry args={[0.085, 0.085, 0.36, 16]} />
            <meshStandardMaterial color="#FFFFFF" metalness={0.92} roughness={0.18} />
          </mesh>
          <mesh position={[0.08, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <boxGeometry args={[0.06, 0.16, 0.08]} />
            <meshStandardMaterial color="#FFFFFF" metalness={0.92} roughness={0.18} />
          </mesh>
        </group>
      ))}

      {/* ── 1 Horizontal Locking Bar on Opposite End Side (x = 1.24) ── */}
      <group position={[1.22, 0, 0.45]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.085, 0.085, 0.3, 16]} />
          <meshStandardMaterial color="#FFFFFF" metalness={0.92} roughness={0.18} />
        </mesh>
      </group>

      {/* ── 4 Corner Bolts: small chrome cylinders ── */}
      {[
        [-0.95, 0.95],
        [0.95, 0.95],
        [-0.95, -0.95],
        [0.95, -0.95],
      ].map(([x, y], idx) => (
        <mesh key={`bolt-${idx}`} position={[x, y, 0.66]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.075, 0.075, 0.06, 16]} />
          <meshStandardMaterial color="#FFFFFF" metalness={0.92} roughness={0.18} />
        </mesh>
      ))}

      {/* ── Dark Inset Seam Gap Behind Door: #14102B ── */}
      <RoundedBox args={[2.14, 2.14, 0.46]} radius={0.18} smoothness={4} position={[0, 0, 0.48]}>
        <meshBasicMaterial color="#14102B" />
      </RoundedBox>

      {/* ── Chunky Vault Door (depth ~0.5 units): #886BFF ── */}
      <RoundedBox args={[2.0, 2.0, 0.5]} radius={0.16} smoothness={4} position={[0, 0, 0.52]}>
        <meshStandardMaterial color="#886BFF" roughness={0.35} metalness={0.2} />
      </RoundedBox>

      {/* ── 4-Spoke Wheel Handle Assembly (Center position: y = 0.14, z = 0.78) ── */}
      <group position={[0, 0.14, 0.78]}>
        {/* Smaller Lime Disc underneath handle (meshBasicMaterial toneMapped={false} for brand accuracy) */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.01]}>
          <cylinderGeometry args={[0.38, 0.38, 0.06, 32]} />
          <meshBasicMaterial color="#CFFF3A" toneMapped={false} />
        </mesh>

        {/* Rotatable 4-Spoke Wheel */}
        <group ref={wheelGroupRef} position={[0, 0, 0.06]}>
          {/* Chrome Torus Ring */}
          <mesh>
            <torusGeometry args={[0.42, 0.055, 16, 48]} />
            <meshStandardMaterial color="#FFFFFF" metalness={0.92} roughness={0.18} />
          </mesh>

          {/* Center Chrome Hub */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.13, 0.13, 0.12, 16]} />
            <meshStandardMaterial color="#FFFFFF" metalness={0.92} roughness={0.18} />
          </mesh>

          {/* 4 Cylinder Spokes at 0, 90, 180, 270 degrees with rounded knobs */}
          {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((rad, idx) => (
            <group key={`spoke-${idx}`} rotation={[0, 0, rad]}>
              {/* Spoke cylinder */}
              <mesh position={[0.22, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.034, 0.034, 0.38, 16]} />
                <meshStandardMaterial color="#FFFFFF" metalness={0.92} roughness={0.18} />
              </mesh>
              {/* Outer Knob */}
              <mesh position={[0.42, 0, 0]}>
                <sphereGeometry args={[0.065, 16, 16]} />
                <meshStandardMaterial color="#FFFFFF" metalness={0.92} roughness={0.18} />
              </mesh>
            </group>
          ))}
        </group>
      </group>

      {/* ── Keyhole on a Small Lime Plate BELOW the Wheel (y = -0.58) ── */}
      <group position={[0, -0.58, 0.78]}>
        {/* Lime Plate: toneMapped={false} */}
        <mesh position={[0, 0, 0.01]}>
          <boxGeometry args={[0.34, 0.42, 0.04]} />
          <meshBasicMaterial color="#CFFF3A" toneMapped={false} />
        </mesh>
        {/* Keyhole slot in ink (#14102B) */}
        <mesh position={[0, 0.04, 0.04]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.045, 0.045, 0.03, 16]} />
          <meshBasicMaterial color="#14102B" />
        </mesh>
        <mesh position={[0, -0.04, 0.04]}>
          <boxGeometry args={[0.055, 0.08, 0.03]} />
          <meshBasicMaterial color="#14102B" />
        </mesh>
      </group>

      {/* ── 6 Larger Gold Coins Orbiting in Front and Behind Vault ── */}
      {coinsConfig.map((_, i) => (
        <group
          key={`coin-${i}`}
          ref={(el) => {
            if (el) coinsRef.current[i] = el;
          }}
        >
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.35, 0.35, 0.06, 24]} />
            <meshStandardMaterial
              color="#FFD23F"
              emissive="#FFD23F"
              emissiveIntensity={0.35}
              metalness={0.88}
              roughness={0.22}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export default function Vault3D({
  isRTL = false,
  onVaultClick = () => {},
}: {
  isRTL?: boolean;
  onVaultClick?: () => void;
}) {
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

    // 4. Scroll tracking for center wheel 360deg rotation
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
    return <VaultFallback onVaultClick={onVaultClick} />;
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-[300px] sm:min-h-[460px] flex items-center justify-center relative select-none overflow-visible cursor-pointer"
    >
      {/* Soft blurred CSS Ellipse Shadow under the vault (Zero rectangular edge) */}
      <div
        className="absolute -bottom-6 sm:-bottom-8 left-1/2 -translate-x-1/2 w-[280px] sm:w-[380px] h-[50px] sm:h-[65px] rounded-[100%] blur-md pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(20,16,43,0.28) 0%, rgba(20,16,43,0.12) 45%, transparent 70%)",
        }}
      />

      {/* 3D Canvas: extended behind text on desktop so coin movement is unconstrained */}
      <div className="w-[360px] sm:w-[520px] lg:w-[960px] xl:w-[1040px] h-[340px] sm:h-[480px] lg:h-[500px] absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-0 overflow-visible flex items-center justify-center pointer-events-auto">
        <Canvas
          camera={{ position: [0, 0, 5.2], fov: 42 }}
          dpr={[1, 1.75]}
          frameloop={inView ? "always" : "never"}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
          }}
          className="w-full h-full overflow-visible"
        >
          {/* Lighting Setup: Ambient + Warm Directional + Cool Rim */}
          <ambientLight intensity={0.8} />
          <directionalLight position={[4, 5, 4]} intensity={1.5} color="#FFF4E3" />
          <directionalLight position={[-4, -3, -3]} intensity={1.1} color="#D6E4FF" />

          {/* Procedural Environment with Lightformers (NO external HDR presets) */}
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
            isRTL={isRTL}
            onVaultClick={onVaultClick}
          />
        </Canvas>
      </div>
    </div>
  );
}
