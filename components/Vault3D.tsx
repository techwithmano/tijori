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

// ─── Realistic Minted Gold Coin Component ───
function MintedCoin({
  innerRef,
}: {
  innerRef: (el: THREE.Group | null) => void;
}) {
  return (
    <group ref={innerRef}>
      {/* 1. Main Gold Flange / Body */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.34, 0.34, 0.05, 32]} />
        <meshStandardMaterial
          color="#FFD23F"
          emissive="#D4A017"
          emissiveIntensity={0.25}
          metalness={0.92}
          roughness={0.18}
        />
      </mesh>

      {/* 2. Raised Rounded Outer Rim (Torus on periphery) */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.33, 0.018, 16, 32]} />
        <meshStandardMaterial
          color="#FFE57F"
          emissive="#FFD23F"
          emissiveIntensity={0.3}
          metalness={0.95}
          roughness={0.12}
        />
      </mesh>

      {/* 3. Inset Concentric Beaded Ring (Front Face, z = +0.027) */}
      <mesh position={[0, 0, 0.027]}>
        <torusGeometry args={[0.22, 0.009, 12, 32]} />
        <meshStandardMaterial
          color="#FFE57F"
          emissive="#FFD23F"
          emissiveIntensity={0.25}
          metalness={0.95}
          roughness={0.14}
        />
      </mesh>

      {/* 4. Inset Concentric Beaded Ring (Back Face, z = -0.027) */}
      <mesh position={[0, 0, -0.027]}>
        <torusGeometry args={[0.22, 0.009, 12, 32]} />
        <meshStandardMaterial
          color="#FFE57F"
          emissive="#FFD23F"
          emissiveIntensity={0.25}
          metalness={0.95}
          roughness={0.14}
        />
      </mesh>

      {/* 5. Minted Star Emblem Relief (Front Face, z = +0.028) */}
      <group position={[0, 0, 0.028]}>
        <mesh rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[0.16, 0.055, 0.012]} />
          <meshStandardMaterial
            color="#FFF2A3"
            emissive="#FFD23F"
            emissiveIntensity={0.35}
            metalness={0.96}
            roughness={0.1}
          />
        </mesh>
        <mesh rotation={[0, 0, -Math.PI / 4]}>
          <boxGeometry args={[0.16, 0.055, 0.012]} />
          <meshStandardMaterial
            color="#FFF2A3"
            emissive="#FFD23F"
            emissiveIntensity={0.35}
            metalness={0.96}
            roughness={0.1}
          />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.032, 0.032, 0.014, 16]} />
          <meshStandardMaterial
            color="#FFFFFF"
            emissive="#FFD23F"
            emissiveIntensity={0.45}
            metalness={0.98}
            roughness={0.08}
          />
        </mesh>
      </group>

      {/* 6. Minted Star Emblem Relief (Back Face, z = -0.028) */}
      <group position={[0, 0, -0.028]}>
        <mesh rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[0.16, 0.055, 0.012]} />
          <meshStandardMaterial
            color="#FFF2A3"
            emissive="#FFD23F"
            emissiveIntensity={0.35}
            metalness={0.96}
            roughness={0.1}
          />
        </mesh>
        <mesh rotation={[0, 0, -Math.PI / 4]}>
          <boxGeometry args={[0.16, 0.055, 0.012]} />
          <meshStandardMaterial
            color="#FFF2A3"
            emissive="#FFD23F"
            emissiveIntensity={0.35}
            metalness={0.96}
            roughness={0.1}
          />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.032, 0.032, 0.014, 16]} />
          <meshStandardMaterial
            color="#FFFFFF"
            emissive="#FFD23F"
            emissiveIntensity={0.45}
            metalness={0.98}
            roughness={0.08}
          />
        </mesh>
      </group>

      {/* 7. Reeded Milled Edge (16 distinct teeth catching gleams) */}
      {Array.from({ length: 16 }).map((_, rIdx) => {
        const reedingAngle = (rIdx / 16) * Math.PI * 2;
        return (
          <mesh
            key={`reed-${rIdx}`}
            position={[Math.cos(reedingAngle) * 0.344, Math.sin(reedingAngle) * 0.344, 0]}
            rotation={[0, 0, reedingAngle]}
          >
            <boxGeometry args={[0.012, 0.026, 0.052]} />
            <meshStandardMaterial
              color="#FFE57F"
              emissive="#D4A017"
              emissiveIntensity={0.25}
              metalness={0.92}
              roughness={0.16}
            />
          </mesh>
        );
      })}
    </group>
  );
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

  // 6 Orbiting Gold Coins config (realistic minted currency coins)
  const coinsConfig = useMemo(
    () => [
      // Coin 0: loops high above vault, behind subtitle on phone
      { radiusX: 2.7, radiusXPhone: 0.85, radiusYPhone: 0.8, yPhone: 1.35, speed: 0.65, offset: 0.0, yDesktop: 0.8, zAmp: 1.75 },
      // Coin 1: swoops deep into headline text on phone, deep into text on desktop
      { radiusX: 3.2, radiusXPhone: 0.95, radiusYPhone: 1.0, yPhone: 2.4, speed: -0.6, offset: 1.05, yDesktop: -0.45, zAmp: 1.85 },
      // Coin 2: mid-height float around vault
      { radiusX: 2.5, radiusXPhone: 0.75, radiusYPhone: 0.5, yPhone: 0.4, speed: 0.75, offset: 2.1, yDesktop: 0.2, zAmp: 1.65 },
      // Coin 3: swoops behind CTA buttons on phone, wide on desktop
      { radiusX: 3.0, radiusXPhone: 0.9, radiusYPhone: 0.9, yPhone: 1.8, speed: -0.7, offset: 3.15, yDesktop: 0.95, zAmp: 1.8 },
      // Coin 4: wide orbit sweeping screen edges
      { radiusX: 3.4, radiusXPhone: 0.98, radiusYPhone: 0.6, yPhone: 0.1, speed: 0.55, offset: 4.2, yDesktop: -0.85, zAmp: 1.9 },
      // Coin 5: counter-loop around vault base
      { radiusX: 2.8, radiusXPhone: 0.8, radiusYPhone: 0.5, yPhone: -0.2, speed: -0.65, offset: 5.25, yDesktop: -0.15, zAmp: 1.7 },
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
    const isMobile = state.size.width < 1024;
    const vaultPosX = 0;
    const vaultPosY = isMobile ? -0.92 : 0;
    const vaultScale = isMobile ? 0.72 : 1.0;

    if (groupRef.current) {
      // 1. Vault Position & Scale: In End Column, scaled on mobile to preserve sticker margins
      groupRef.current.position.x = vaultPosX;
      groupRef.current.position.y = vaultPosY + Math.sin(t * 1.3) * 0.08;
      groupRef.current.scale.setScalar(vaultScale);

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

    // 4. 6 Orbiting & spinning minted gold coins
    const shiftXDesktop = isRTL ? 1.2 : -1.2;

    coinsConfig.forEach((cfg, i) => {
      const coinMesh = coinsRef.current[i];
      if (!coinMesh) return;
      const angle = t * cfg.speed + cfg.offset;

      if (isMobile) {
        // On phone: sweep across 100% width and swoop up behind text (headline, subhead, CTAs)
        coinMesh.position.x = Math.cos(angle) * cfg.radiusXPhone;
        coinMesh.position.y = vaultPosY + cfg.yPhone + Math.sin(angle) * cfg.radiusYPhone;
      } else {
        // On desktop: orbit around vault and swoop deep into text column on the left (or right in RTL)
        coinMesh.position.x = vaultPosX + Math.cos(angle) * cfg.radiusX + shiftXDesktop;
        coinMesh.position.y = cfg.yDesktop + Math.sin(t * 1.6 + i) * 0.09;
      }

      coinMesh.position.z = Math.sin(angle) * cfg.zAmp;
      coinMesh.rotation.x += 0.025;
      coinMesh.rotation.y += 0.038;
      coinMesh.rotation.z += 0.012;
    });
  });

  return (
    <>
      {/* ── Vault Group (Positioned at targetX / targetY) ── */}
      <group ref={groupRef} position={[0, 0, 0]} onClick={handleClick} onPointerDown={handleClick}>
        {/* Vault Main Body: RoundedBox, #6B4DFF, roughness 0.35, metalness 0.15 */}
        <RoundedBox args={[2.5, 2.5, 1.3]} radius={0.24} smoothness={4} position={[0, 0, 0]}>
          <meshStandardMaterial color="#6B4DFF" roughness={0.35} metalness={0.15} />
        </RoundedBox>

        {/* 2 Chrome Hinges on the Start Side (x = -1.24) */}
        {[-0.65, 0.65].map((yPos, idx) => (
          <group key={`hinge-${idx}`} position={[-1.24, yPos, 0.45]}>
            <mesh>
              <cylinderGeometry args={[0.085, 0.085, 0.36, 16]} />
              <meshStandardMaterial color="#FFFFFF" metalness={0.92} roughness={0.18} />
            </mesh>
            <mesh position={[0.06, 0, 0]}>
              <boxGeometry args={[0.08, 0.22, 0.1]} />
              <meshStandardMaterial color="#FFFFFF" metalness={0.92} roughness={0.18} />
            </mesh>
          </group>
        ))}

        {/* 1 Horizontal Locking Bar on the Opposite Side (x = 1.25, y = 0) */}
        <mesh position={[1.25, 0, 0.45]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.09, 0.09, 0.48, 16]} />
          <meshStandardMaterial color="#FFFFFF" metalness={0.92} roughness={0.18} />
        </mesh>

        {/* 4 Chrome Corner Bolts */}
        {[
          [-0.95, 0.95],
          [0.95, 0.95],
          [-0.95, -0.95],
          [0.95, -0.95],
        ].map(([bx, by], idx) => (
          <mesh key={`bolt-${idx}`} position={[bx, by, 0.67]}>
            <cylinderGeometry args={[0.075, 0.075, 0.06, 16]} />
            <meshStandardMaterial color="#FFFFFF" metalness={0.92} roughness={0.18} />
          </mesh>
        ))}

        {/* Dark Inset Seam Gap behind the door (slightly larger dark box) */}
        <RoundedBox args={[2.18, 2.18, 0.52]} radius={0.18} smoothness={4} position={[0, 0, 0.4]}>
          <meshBasicMaterial color="#14102B" />
        </RoundedBox>

        {/* Thick Door: depth ~0.5 units, color lighter violet #7A5CFF */}
        <RoundedBox args={[2.08, 2.08, 0.5]} radius={0.16} smoothness={4} position={[0, 0, 0.44]}>
          <meshStandardMaterial color="#7A5CFF" roughness={0.3} metalness={0.18} />
        </RoundedBox>

        {/* Chunky 4-Spoke Wheel Handle sitting on a smaller lime disc */}
        <group position={[0, 0.08, 0.72]}>
          {/* Lime disc mounting plate */}
          <mesh position={[0, 0, -0.02]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.55, 0.55, 0.04, 32]} />
            <meshBasicMaterial color="#CFFF3A" toneMapped={false} />
          </mesh>

          {/* Wheel rotating group */}
          <group ref={wheelGroupRef}>
            {/* Chrome Torus Outer Ring */}
            <mesh>
              <torusGeometry args={[0.42, 0.055, 16, 32]} />
              <meshStandardMaterial color="#FFFFFF" metalness={0.94} roughness={0.14} />
            </mesh>

            {/* Center Chrome Hub */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.13, 0.13, 0.12, 24]} />
              <meshStandardMaterial color="#FFFFFF" metalness={0.94} roughness={0.14} />
            </mesh>

            {/* 4 Chunky Cylinder Spokes with Rounded Knobs */}
            {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((angle, idx) => (
              <group key={`spoke-${idx}`} rotation={[0, 0, angle]}>
                <mesh position={[0, 0.22, 0]}>
                  <cylinderGeometry args={[0.038, 0.038, 0.4, 16]} />
                  <meshStandardMaterial color="#FFFFFF" metalness={0.94} roughness={0.14} />
                </mesh>
                <mesh position={[0, 0.45, 0]}>
                  <sphereGeometry args={[0.065, 16, 16]} />
                  <meshStandardMaterial color="#FFFFFF" metalness={0.94} roughness={0.14} />
                </mesh>
              </group>
            ))}
          </group>
        </group>

        {/* Keyhole: Placed BELOW the wheel on a small lime plate */}
        <group position={[0, -0.62, 0.72]}>
          <mesh position={[0, 0, 0.01]}>
            <boxGeometry args={[0.34, 0.42, 0.04]} />
            <meshBasicMaterial color="#CFFF3A" toneMapped={false} />
          </mesh>
          <mesh position={[0, 0.04, 0.04]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.045, 0.045, 0.03, 16]} />
            <meshBasicMaterial color="#14102B" />
          </mesh>
          <mesh position={[0, -0.04, 0.04]}>
            <boxGeometry args={[0.055, 0.08, 0.03]} />
            <meshBasicMaterial color="#14102B" />
          </mesh>
        </group>
      </group>

      {/* ── 6 Realistic Minted Gold Coins Orbiting in Front and Behind Vault ── */}
      {coinsConfig.map((_, i) => (
        <MintedCoin
          key={`minted-coin-${i}`}
          innerRef={(el) => {
            if (el) coinsRef.current[i] = el;
          }}
        />
      ))}
    </>
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
      className="w-full h-full relative select-none overflow-visible flex items-center justify-center pointer-events-none"
    >
      {/* Soft blurred CSS Ellipse Shadow under the vault (Zero rectangular edge) */}
      <div
        className="absolute -bottom-6 sm:-bottom-8 left-1/2 -translate-x-1/2 w-[280px] sm:w-[380px] h-[50px] sm:h-[65px] rounded-[100%] blur-md pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(20,16,43,0.28) 0%, rgba(20,16,43,0.12) 45%, transparent 70%)",
        }}
      />

      {/* 3D Canvas: Full-width from website start to end (100vw), extended behind text on phone & desktop */}
      <div className="w-[100vw] h-[800px] lg:h-[540px] absolute left-1/2 bottom-[-40px] lg:top-1/2 -translate-x-1/2 lg:-translate-y-1/2 z-0 overflow-visible flex items-center justify-center pointer-events-none">
        <Canvas
          camera={{ position: [0, 0, 5.2], fov: 42 }}
          dpr={[1, 1.75]}
          frameloop={inView ? "always" : "never"}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
          }}
          className="w-full h-full overflow-visible pointer-events-auto"
        >
          {/* Lighting Setup: Ambient + Warm Directional + Cool Rim */}
          <ambientLight intensity={0.85} />
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
