"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import VaultFallback from "./VaultFallback";

const CAMERA_Z = 5.2;
const CAMERA_FOV = 42;
const MAX_POINTER_TILT = THREE.MathUtils.degToRad(8);

interface Vault3DProps {
  isRTL?: boolean;
  onVaultClick?: () => void;
  spinTrigger?: number;
}

interface VaultSceneProps {
  scrollProgress: number;
  spinRequest: number;
  isTouchDevice: boolean;
  isRTL: boolean;
  onRequestSpin: () => void;
}

interface CoinConfig {
  radiusX: number;
  radiusY: number;
  radiusXPhone: number;
  radiusYPhone: number;
  speed: number;
  offset: number;
  zAmp: number;
  rotSpeedX: number;
  rotSpeedY: number;
  rotSpeedZ: number;
  flutterFreq: number;
  flutterAmp: number;
}

const NOOP = () => {};

// 6 coin trajectories tuned with safe vault clearance, sweep, and independent organic tumbles
const COINS: CoinConfig[] = [
  {
    radiusX: 2.7,
    radiusY: 0.55,
    radiusXPhone: 0.85,
    radiusYPhone: 0.28,
    speed: 0.58,
    offset: 0,
    zAmp: 1.2,
    rotSpeedX: 1.15,
    rotSpeedY: 1.48,
    rotSpeedZ: 0.32,
    flutterFreq: 1.9,
    flutterAmp: 0.18,
  },
  {
    radiusX: 3.2,
    radiusY: 0.68,
    radiusXPhone: 0.95,
    radiusYPhone: 0.32,
    speed: -0.52,
    offset: 1.05,
    zAmp: 1.35,
    rotSpeedX: -1.25,
    rotSpeedY: 0.92,
    rotSpeedZ: -0.42,
    flutterFreq: 2.3,
    flutterAmp: 0.22,
  },
  {
    radiusX: 2.5,
    radiusY: 0.48,
    radiusXPhone: 0.80,
    radiusYPhone: 0.25,
    speed: 0.68,
    offset: 2.1,
    zAmp: 1.15,
    rotSpeedX: 0.72,
    rotSpeedY: -1.65,
    rotSpeedZ: 0.55,
    flutterFreq: 1.7,
    flutterAmp: 0.16,
  },
  {
    radiusX: 3.0,
    radiusY: 0.62,
    radiusXPhone: 0.90,
    radiusYPhone: 0.30,
    speed: -0.64,
    offset: 3.15,
    zAmp: 1.25,
    rotSpeedX: 1.40,
    rotSpeedY: -0.85,
    rotSpeedZ: -0.36,
    flutterFreq: 2.1,
    flutterAmp: 0.20,
  },
  {
    radiusX: 3.4,
    radiusY: 0.52,
    radiusXPhone: 1.02,
    radiusYPhone: 0.34,
    speed: 0.48,
    offset: 4.2,
    zAmp: 1.3,
    rotSpeedX: -0.88,
    rotSpeedY: 1.75,
    rotSpeedZ: 0.45,
    flutterFreq: 1.5,
    flutterAmp: 0.24,
  },
  {
    radiusX: 2.8,
    radiusY: 0.58,
    radiusXPhone: 0.88,
    radiusYPhone: 0.29,
    speed: -0.60,
    offset: 5.25,
    zAmp: 1.2,
    rotSpeedX: 1.10,
    rotSpeedY: 1.20,
    rotSpeedZ: -0.65,
    flutterFreq: 2.5,
    flutterAmp: 0.19,
  },
];

// Four-point star crest geometry for minted coin faces
const FOUR_POINT_STAR = new THREE.Shape();
FOUR_POINT_STAR.moveTo(0, 0.12);
FOUR_POINT_STAR.lineTo(0.026, 0.026);
FOUR_POINT_STAR.lineTo(0.12, 0);
FOUR_POINT_STAR.lineTo(0.026, -0.026);
FOUR_POINT_STAR.lineTo(0, -0.12);
FOUR_POINT_STAR.lineTo(-0.026, -0.026);
FOUR_POINT_STAR.lineTo(-0.12, 0);
FOUR_POINT_STAR.lineTo(-0.026, 0.026);
FOUR_POINT_STAR.closePath();

/** Procedural soft radial shadow texture under the vault */
function useShadowTexture() {
  return useMemo(() => {
    if (typeof document === "undefined") return null;
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 62);
    gradient.addColorStop(0, "rgba(20, 16, 43, 0.35)");
    gradient.addColorStop(0.35, "rgba(20, 16, 43, 0.20)");
    gradient.addColorStop(0.7, "rgba(20, 16, 43, 0.04)");
    gradient.addColorStop(1, "rgba(20, 16, 43, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, []);
}

/** Sleek, pure minted gold coin without chunky cylindrical extrusions */
function MintedCoin({
  innerRef,
}: {
  innerRef: (element: THREE.Group | null) => void;
}) {
  return (
    <group ref={innerRef}>
      {/* Sleek, flat coin planchet (thin genuine coin disc: radius 0.32, height 0.022) */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.32, 0.32, 0.022, 64]} />
        <meshStandardMaterial
          color="#FFD23F"
          emissive="#524000"
          emissiveIntensity={0.22}
          metalness={0.82}
          roughness={0.14}
        />
      </mesh>

      {/* Clean raised border rim on obverse & reverse */}
      {[0.011, -0.011].map((z, index) => (
        <mesh key={`rim-${index}`} position={[0, 0, z]}>
          <torusGeometry args={[0.302, 0.012, 16, 64]} />
          <meshStandardMaterial
            color="#FFE57F"
            emissive="#5C4800"
            emissiveIntensity={0.2}
            metalness={0.85}
            roughness={0.12}
          />
        </mesh>
      ))}

      {/* Flat minted star crest emblem on obverse & reverse */}
      {[1, -1].map((side) => (
        <group
          key={`crest-${side}`}
          position={[0, 0, side * 0.0115]}
          rotation={side < 0 ? [0, Math.PI, 0] : [0, 0, 0]}
        >
          <mesh>
            <extrudeGeometry args={[FOUR_POINT_STAR, { depth: 0.004, bevelEnabled: false }]} />
            <meshStandardMaterial
              color="#FFF3A8"
              emissive="#5C4800"
              emissiveIntensity={0.22}
              metalness={0.82}
              roughness={0.12}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function VaultMesh({
  scrollProgress,
  spinRequest,
  isTouchDevice,
  isRTL,
  onRequestSpin,
}: VaultSceneProps) {
  const { size, viewport } = useThree();
  const shadowTexture = useShadowTexture();

  const vaultRef = useRef<THREE.Group>(null);
  const wheelRef = useRef<THREE.Group>(null);
  const shadowRef = useRef<THREE.Mesh>(null);
  const coinRefs = useRef<THREE.Group[]>([]);
  const lastSpinRequestRef = useRef(spinRequest);
  const spinTargetRef = useRef(0);
  const spinCurrentRef = useRef(0);
  const pointerRef = useRef({ x: 0, y: 0, hasPointer: false });
  const recoilRef = useRef({ rotX: 0, rotY: 0, rotZ: 0, scale: 1 });
  const glowRingMatRef = useRef<THREE.MeshStandardMaterial>(null);

  const coinRefCallbacks = useMemo(
    () =>
      COINS.map((_, index) => (element: THREE.Group | null) => {
        if (element) coinRefs.current[index] = element;
        else delete coinRefs.current[index];
      }),
    []
  );

  const handleVaultClick = useCallback(
    (event?: { stopPropagation: () => void }) => {
      event?.stopPropagation();
      // Energetic physical recoil tilt, twist, and spring pop
      recoilRef.current.rotX = -0.28;
      recoilRef.current.rotY = (isRTL ? -1 : 1) * 0.42;
      recoilRef.current.rotZ = (isRTL ? 1 : -1) * 0.12;
      recoilRef.current.scale = 1.08;
      spinTargetRef.current += Math.PI * 4;
      onRequestSpin();
    },
    [isRTL, onRequestSpin]
  );

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      pointerRef.current.x = (event.clientX / Math.max(window.innerWidth, 1)) * 2 - 1;
      pointerRef.current.y = 1 - (event.clientY / Math.max(window.innerHeight, 1)) * 2;
      pointerRef.current.hasPointer = true;
    };

    const handleCustomSpin = () => {
      handleVaultClick();
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("tijori:vault-spin", handleCustomSpin);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("tijori:vault-spin", handleCustomSpin);
    };
  }, [handleVaultClick]);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    const isDesktop = state.size.width >= 1024;

    // Check if the DOM anchor exists to position the vault precisely in its intended container
    const anchor = typeof document !== "undefined" ? document.getElementById("vault-3d-anchor") : null;
    let vaultX = 0;
    let vaultY = 0;
    let vaultScale = 0.92;

    if (anchor && state.gl.domElement) {
      const canvasRect = state.gl.domElement.getBoundingClientRect();
      const anchorRect = anchor.getBoundingClientRect();

      // Convert anchor center to canvas coordinate space
      const anchorCenterX = anchorRect.left + anchorRect.width / 2 - canvasRect.left;
      const anchorCenterY = anchorRect.top + anchorRect.height / 2 - canvasRect.top;

      // Normalized Device Coordinates (-1 to 1)
      const ndcX = (anchorCenterX / canvasRect.width) * 2 - 1;
      const ndcY = -((anchorCenterY / canvasRect.height) * 2 - 1);

      // World units at z = 0
      vaultX = ndcX * (viewport.width / 2);
      vaultY = ndcY * (viewport.height / 2);

      const pixelsPerUnit = canvasRect.height / viewport.height;
      if (isDesktop) {
        // Desktop: sized nicely inside the end column (approx 290px safe body)
        const targetPx = Math.min(anchorRect.width * 0.72, 300);
        vaultScale = targetPx / (2.5 * pixelsPerUnit);
      } else {
        // Mobile phone / tablet: compact, elegant safe body (approx 135px - 145px)
        const targetPx = Math.min(anchorRect.width * 0.38, 140);
        vaultScale = targetPx / (2.5 * pixelsPerUnit);
      }
    } else {
      if (isDesktop) {
        const containerWidth = Math.min(state.size.width, 1100);
        const columnOffsetPx = containerWidth / 4;
        const pixelsPerUnit = state.size.height / viewport.height;
        vaultX = (columnOffsetPx / Math.max(pixelsPerUnit, 1)) * (isRTL ? -1 : 1);
        vaultY = 0;
        vaultScale = Math.min(0.92, viewport.height * 0.25);
      } else {
        vaultX = 0;
        vaultY = -viewport.height * 0.22;
        vaultScale = 0.24;
      }
    }

    // Wheel spin handling
    if (spinRequest !== lastSpinRequestRef.current) {
      const extraTurns = Math.max(1, spinRequest - lastSpinRequestRef.current);
      spinTargetRef.current += Math.PI * 4 * extraTurns;
      lastSpinRequestRef.current = spinRequest;
      // Trigger dynamic 3D punch recoil tilt & twist
      recoilRef.current.rotX = -0.28;
      recoilRef.current.rotY = (isRTL ? -1 : 1) * 0.42;
      recoilRef.current.rotZ = (isRTL ? 1 : -1) * 0.12;
      recoilRef.current.scale = 1.08;
    }
    spinCurrentRef.current = THREE.MathUtils.damp(
      spinCurrentRef.current,
      spinTargetRef.current,
      5,
      delta
    );

    if (wheelRef.current) {
      wheelRef.current.rotation.z =
        scrollProgress * Math.PI * 2 + spinCurrentRef.current;
    }

    // Dial plate neon lime pulsing glow
    if (glowRingMatRef.current) {
      glowRingMatRef.current.emissiveIntensity = 1.1 + Math.sin(time * 2.8) * 0.35;
    }

    if (vaultRef.current) {
      vaultRef.current.position.set(vaultX, vaultY, 0);

      // Dampen click recoil spring smoothly back to rest
      recoilRef.current.rotX = THREE.MathUtils.damp(recoilRef.current.rotX, 0, 5.5, delta);
      recoilRef.current.rotY = THREE.MathUtils.damp(recoilRef.current.rotY, 0, 5.0, delta);
      recoilRef.current.rotZ = THREE.MathUtils.damp(recoilRef.current.rotZ, 0, 6.5, delta);
      recoilRef.current.scale = THREE.MathUtils.damp(recoilRef.current.scale, 1, 7.5, delta);

      const baseRotationY = isRTL ? 0.11 : -0.11;
      const baseRotationX = 0.025;

      if (isTouchDevice) {
        // Gentle rhythmic sway for touch devices with recoil
        const swayY = baseRotationY + Math.sin(time * 0.75) * 0.055 + recoilRef.current.rotY;
        const swayX = baseRotationX + Math.cos(time * 0.62) * 0.035 + recoilRef.current.rotX;
        vaultRef.current.rotation.y = THREE.MathUtils.damp(
          vaultRef.current.rotation.y,
          swayY,
          4.5,
          delta
        );
        vaultRef.current.rotation.x = THREE.MathUtils.damp(
          vaultRef.current.rotation.x,
          swayX,
          4.5,
          delta
        );
        vaultRef.current.rotation.z = THREE.MathUtils.damp(
          vaultRef.current.rotation.z,
          recoilRef.current.rotZ,
          6,
          delta
        );
      } else {
        // Dynamic, responsive pointer tilt across full screen (up to 20 deg Y, 13 deg X)
        const MAX_POINTER_TILT_Y = 0.35;
        const MAX_POINTER_TILT_X = 0.22;

        const pointerX = pointerRef.current.hasPointer
          ? pointerRef.current.x
          : state.pointer.x;
        const pointerY = pointerRef.current.hasPointer
          ? pointerRef.current.y
          : state.pointer.y;

        const targetRotationY =
          baseRotationY +
          THREE.MathUtils.clamp(
            pointerX * MAX_POINTER_TILT_Y,
            -MAX_POINTER_TILT_Y,
            MAX_POINTER_TILT_Y
          ) +
          recoilRef.current.rotY;

        const targetRotationX =
          baseRotationX +
          THREE.MathUtils.clamp(
            -pointerY * MAX_POINTER_TILT_X,
            -MAX_POINTER_TILT_X,
            MAX_POINTER_TILT_X
          ) +
          recoilRef.current.rotX;

        vaultRef.current.rotation.y = THREE.MathUtils.damp(
          vaultRef.current.rotation.y,
          targetRotationY,
          7,
          delta
        );
        vaultRef.current.rotation.x = THREE.MathUtils.damp(
          vaultRef.current.rotation.x,
          targetRotationX,
          7,
          delta
        );
        vaultRef.current.rotation.z = THREE.MathUtils.damp(
          vaultRef.current.rotation.z,
          recoilRef.current.rotZ,
          7,
          delta
        );
      }

      vaultRef.current.scale.setScalar(vaultScale * recoilRef.current.scale);
    }

    // Shadow moves and scales locked with the vault
    if (shadowRef.current) {
      shadowRef.current.position.set(vaultX, vaultY - 1.28 * vaultScale, -0.05);
      shadowRef.current.scale.set(vaultScale * recoilRef.current.scale, vaultScale, 1);
    }

    // Orbiting Minted Coins
    const sweepDirection = isRTL ? 1 : -1;
    const coinScale = isDesktop ? 0.95 : vaultScale * 1.05;

    COINS.forEach((config, index) => {
      const coin = coinRefs.current[index];
      if (!coin) return;

      coin.scale.setScalar(coinScale);

      const angle = time * config.speed + config.offset;
      const sinA = Math.sin(angle);
      const cosA = Math.cos(angle);

      if (isDesktop) {
        // Desktop: Wide orbit that sweeps from vault across to the headline column
        // When sinA > 0, the coin sweeps towards the headline (sweepDirection: -1 for LTR, +1 for RTL)
        const sweepDist = sweepDirection * (1.25 + Math.abs(cosA) * 0.45);
        const sweep = sinA > 0 ? sweepDist : 0;

        const rawX = vaultX + cosA * config.radiusX + sweep;
        const rawY = vaultY + sinA * config.radiusY + Math.sin(time * 1.5 + index) * 0.06;

        // Ensure safe clearance from vault body (vault width ~2.5, depth ~1.3)
        // Vault bounding box: [vaultX - 1.45 * vaultScale, vaultX + 1.45 * vaultScale]
        const distFromVaultX = Math.abs(rawX - vaultX);
        const nearVault = distFromVaultX < 1.45 * vaultScale;

        let zPos = sinA * config.zAmp;
        if (nearVault) {
          // If in front, stay cleanly in front of door (z > 1.25 * vaultScale)
          // If behind, stay cleanly behind safe body (z < -1.10 * vaultScale)
          if (zPos >= 0) {
            zPos = Math.max(zPos, 1.25 * vaultScale + 0.25 * Math.max(0, sinA));
          } else {
            zPos = Math.min(zPos, -1.10 * vaultScale + 0.25 * Math.min(0, sinA));
          }
        }

        coin.position.x = rawX;
        coin.position.y = rawY;
        coin.position.z = zPos;
      } else {
        // Mobile: Coins orbit tightly around the vault, never clipping screen borders or vault
        const orbitRadiusX = vaultScale * (1.60 + (index % 3) * 0.15);
        const orbitRadiusY = vaultScale * (0.55 + (index % 2) * 0.10);
        coin.position.x = vaultX + cosA * orbitRadiusX;
        coin.position.y = vaultY + sinA * orbitRadiusY;
        coin.position.z = sinA > 0 ? 1.05 * vaultScale : -0.95 * vaultScale;
      }

      // Three-axis coin tumble with independent velocities and organic sinusoidal flutter
      coin.rotation.x += delta * config.rotSpeedX + Math.cos(time * config.flutterFreq) * (delta * config.flutterAmp);
      coin.rotation.y += delta * config.rotSpeedY + Math.sin(time * config.flutterFreq * 1.2) * (delta * config.flutterAmp * 1.2);
      coin.rotation.z += delta * config.rotSpeedZ;
    });

    // Project coin positions to screen to dynamically invert headline text when coins pass behind it
    if (typeof document !== "undefined") {
      const headlineEl = document.getElementById("hero-headline-inverted");
      if (headlineEl) {
        const rect = headlineEl.getBoundingClientRect();
        const projVector = new THREE.Vector3();
        const masks: string[] = [];
        const coinRadius = isDesktop ? 65 : 42;

        COINS.forEach((_, index) => {
          const coin = coinRefs.current[index];
          if (!coin) return;

          coin.getWorldPosition(projVector);
          projVector.project(state.camera);

          // Only coins facing the camera
          if (projVector.z >= 1) return;

          const screenX = (projVector.x * 0.5 + 0.5) * window.innerWidth;
          const screenY = (-projVector.y * 0.5 + 0.5) * window.innerHeight;

          const relX = screenX - rect.left;
          const relY = screenY - rect.top;

          if (
            relX >= -coinRadius &&
            relX <= rect.width + coinRadius &&
            relY >= -coinRadius &&
            relY <= rect.height + coinRadius
          ) {
            masks.push(
              `radial-gradient(circle at ${Math.round(relX)}px ${Math.round(relY)}px, black ${coinRadius - 10}px, transparent ${coinRadius + 12}px)`
            );
          }
        });

        if (masks.length > 0) {
          headlineEl.style.opacity = "1";
          const maskValue = masks.join(", ");
          headlineEl.style.webkitMaskImage = maskValue;
          headlineEl.style.maskImage = maskValue;
        } else {
          headlineEl.style.opacity = "0";
          headlineEl.style.webkitMaskImage = "linear-gradient(transparent, transparent)";
          headlineEl.style.maskImage = "linear-gradient(transparent, transparent)";
        }
      }
    }
  });

  return (
    <>
      {/* Smooth 3D Drop Shadow directly beneath vault */}
      {shadowTexture && (
        <mesh ref={shadowRef} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[3.2, 1.5]} />
          <meshBasicMaterial
            map={shadowTexture}
            transparent
            opacity={0.85}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* The 3D Neobrutalist Vault Mesh */}
      <group ref={vaultRef} onClick={handleVaultClick}>
        {/* Chunky purple safe body */}
        <RoundedBox
          args={[2.5, 2.5, 1.3]}
          radius={0.24}
          smoothness={4}
          position={[0, 0, 0]}
        >
          <meshStandardMaterial
            color="#6B4DFF"
            roughness={0.34}
            metalness={0.18}
          />
        </RoundedBox>

        {/* Chrome hinges on side */}
        {[-0.65, 0.65].map((y, index) => (
          <group key={`hinge-${index}`} position={[-1.24, y, 0.45]}>
            <mesh>
              <cylinderGeometry args={[0.085, 0.085, 0.36, 24]} />
              <meshStandardMaterial
                color="#F4F7FF"
                metalness={0.96}
                roughness={0.14}
              />
            </mesh>
            <mesh position={[0.06, 0, 0]}>
              <boxGeometry args={[0.08, 0.22, 0.1]} />
              <meshStandardMaterial
                color="#F4F7FF"
                metalness={0.96}
                roughness={0.14}
              />
            </mesh>
          </group>
        ))}

        {/* Chrome locking bar */}
        <mesh position={[1.235, 0, 0.46]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.09, 0.09, 0.48, 24]} />
          <meshStandardMaterial
            color="#F4F7FF"
            metalness={0.96}
            roughness={0.14}
          />
        </mesh>

        {/* Four front corner bolts */}
        {[
          [-0.94, 0.94],
          [0.94, 0.94],
          [-0.94, -0.94],
          [0.94, -0.94],
        ].map(([x, y], index) => (
          <mesh
            key={`bolt-${index}`}
            position={[x, y, 0.675]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry args={[0.073, 0.073, 0.055, 24]} />
            <meshStandardMaterial
              color="#F4F7FF"
              metalness={0.96}
              roughness={0.12}
            />
          </mesh>
        ))}

        {/* Dark recessed seam & lighter purple door */}
        <RoundedBox
          args={[2.18, 2.18, 0.52]}
          radius={0.18}
          smoothness={4}
          position={[0, 0, 0.4]}
        >
          <meshBasicMaterial color="#14102B" />
        </RoundedBox>
        <RoundedBox
          args={[2.08, 2.08, 0.5]}
          radius={0.16}
          smoothness={4}
          position={[0, 0, 0.44]}
        >
          <meshStandardMaterial
            color="#7A5CFF"
            roughness={0.3}
            metalness={0.2}
          />
        </RoundedBox>

        {/* Neon Lime Dial Plate with Chrome Rotating Wheel and Pulsing Glow Ring */}
        <group position={[0, 0.08, 0.72]}>
          <mesh position={[0, 0, -0.02]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.55, 0.55, 0.04, 48]} />
            <meshStandardMaterial
              color="#CFFF3A"
              emissive="#CFFF3A"
              emissiveIntensity={0.35}
              roughness={0.28}
              metalness={0.08}
            />
          </mesh>

          {/* Emissive Neon Lime Rim Ring (Pulsing high-energy glow like the classic vault) */}
          <mesh position={[0, 0, 0.01]}>
            <torusGeometry args={[0.54, 0.022, 16, 64]} />
            <meshStandardMaterial
              ref={glowRingMatRef}
              color="#CFFF3A"
              emissive="#CFFF3A"
              emissiveIntensity={1.25}
              roughness={0.12}
              metalness={0.1}
            />
          </mesh>

          <group ref={wheelRef}>
            <mesh>
              <torusGeometry args={[0.42, 0.055, 16, 48]} />
              <meshStandardMaterial
                color="#FFFFFF"
                metalness={0.96}
                roughness={0.12}
              />
            </mesh>

            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.13, 0.13, 0.12, 32]} />
              <meshStandardMaterial
                color="#FFFFFF"
                metalness={0.96}
                roughness={0.12}
              />
            </mesh>

            {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map(
              (angle, index) => (
                <group key={`spoke-${index}`} rotation={[0, 0, angle]}>
                  <mesh position={[0, 0.22, 0]}>
                    <cylinderGeometry args={[0.038, 0.038, 0.4, 20]} />
                    <meshStandardMaterial
                      color="#F6F8FF"
                      metalness={0.96}
                      roughness={0.12}
                    />
                  </mesh>
                  <mesh position={[0, 0.45, 0]}>
                    <sphereGeometry args={[0.065, 20, 16]} />
                    <meshStandardMaterial
                      color="#FFFFFF"
                      metalness={0.96}
                      roughness={0.1}
                    />
                  </mesh>
                </group>
              )
            )}
          </group>
        </group>

        {/* Lime Keyhole Plate beneath wheel */}
        <group position={[0, -0.62, 0.72]}>
          <RoundedBox
            args={[0.34, 0.42, 0.04]}
            radius={0.07}
            smoothness={4}
            position={[0, 0, 0.01]}
          >
            <meshStandardMaterial
              color="#CFFF3A"
              roughness={0.32}
              metalness={0.05}
            />
          </RoundedBox>
          <mesh position={[0, 0.055, 0.04]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.045, 0.045, 0.03, 20]} />
            <meshBasicMaterial color="#14102B" />
          </mesh>
          <mesh position={[0, -0.045, 0.04]}>
            <boxGeometry args={[0.055, 0.105, 0.03]} />
            <meshBasicMaterial color="#14102B" />
          </mesh>
        </group>
      </group>

      {/* Six high-relief minted gold coins */}
      {COINS.map((_, index) => (
        <MintedCoin
          key={`minted-coin-${index}`}
          innerRef={coinRefCallbacks[index]}
        />
      ))}
    </>
  );
}

/** Error boundary for WebGL rendering fallback */
class VaultCanvasErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("Vault3D renderer failed; using fallback.", error);
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

export default function Vault3D({
  isRTL = false,
  onVaultClick = NOOP,
  spinTrigger = 0,
}: Vault3DProps) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [spinRequest, setSpinRequest] = useState(0);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [webGLAvailable, setWebGLAvailable] = useState<boolean | null>(null);
  const [reducedMotion, setReducedMotion] = useState<boolean | null>(null);

  const canRenderScene = webGLAvailable === true && reducedMotion === false;
  const shouldUseFallback = webGLAvailable === false || reducedMotion === true;

  const requestSpin = useCallback(() => {
    setSpinRequest((current) => current + 1);
    onVaultClick();
  }, [onVaultClick]);

  useEffect(() => {
    if (spinTrigger > 0) {
      setSpinRequest((current) => current + 1);
    }
  }, [spinTrigger]);

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(motionQuery.matches);

    const updateMotionPreference = (e: MediaQueryListEvent) =>
      setReducedMotion(e.matches);
    motionQuery.addEventListener("change", updateMotionPreference);

    setIsTouchDevice(window.matchMedia("(pointer: coarse)").matches);

    let available = false;
    try {
      const testCanvas = document.createElement("canvas");
      const context = testCanvas.getContext("webgl2");
      available = Boolean(context);
      context?.getExtension("WEBGL_lose_context")?.loseContext();
    } catch {
      available = false;
    }
    setWebGLAvailable(available);

    const handleScroll = () => {
      const maxScroll = Math.max(window.innerHeight * 0.9, 1);
      setScrollProgress(THREE.MathUtils.clamp(window.scrollY / maxScroll, 0, 1));
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      motionQuery.removeEventListener("change", updateMotionPreference);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  if (shouldUseFallback) {
    return <VaultFallback onVaultClick={onVaultClick} />;
  }

  if (!canRenderScene) {
    return null;
  }

  return (
    <VaultCanvasErrorBoundary
      fallback={<VaultFallback onVaultClick={onVaultClick} />}
    >
      <div className="w-full h-full relative pointer-events-none">
        <Canvas
          aria-hidden="true"
          className="w-full h-full"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
          }}
          camera={{ position: [0, 0, CAMERA_Z], fov: CAMERA_FOV }}
          dpr={[1, 1.75]}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
            stencil: false,
          }}
        >
          {/* Balanced rich lighting for gleaming gold and vibrant safe colors */}
          <ambientLight intensity={0.7} color="#FFF8F0" />
          <directionalLight
            position={[4, 5, 5]}
            intensity={2.2}
            color="#FFF5E0"
          />
          <directionalLight
            position={[-4, -2, 4]}
            intensity={1.2}
            color="#E8EEFF"
          />
          <directionalLight
            position={[0, 1, 6]}
            intensity={1.4}
            color="#FFEAA7"
          />

          <VaultMesh
            scrollProgress={scrollProgress}
            spinRequest={spinRequest}
            isTouchDevice={isTouchDevice}
            isRTL={isRTL}
            onRequestSpin={requestSpin}
          />
        </Canvas>
      </div>
    </VaultCanvasErrorBoundary>
  );
}
