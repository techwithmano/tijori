"use client";

import React from "react";

export default function VaultFallback() {
  return (
    <div
      className="w-full h-full min-h-[280px] sm:min-h-[420px] flex items-center justify-center select-none"
      aria-label="Tijori 3D Vault Illustration"
    >
      <svg
        viewBox="0 0 400 400"
        className="w-full max-w-[360px] sm:max-w-[420px] h-auto drop-shadow-[6px_6px_0_var(--ink)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Floating Gold Coins */}
        <circle cx="65" cy="110" r="16" fill="#FFD23F" stroke="#14102B" strokeWidth="2.5" />
        <circle cx="65" cy="110" r="10" stroke="#14102B" strokeWidth="1.5" strokeDasharray="3 3" />

        <circle cx="335" cy="85" r="18" fill="#FFD23F" stroke="#14102B" strokeWidth="2.5" />
        <circle cx="335" cy="85" r="11" stroke="#14102B" strokeWidth="1.5" strokeDasharray="3 3" />

        <circle cx="340" cy="290" r="15" fill="#FFD23F" stroke="#14102B" strokeWidth="2.5" />
        <circle cx="50" cy="275" r="17" fill="#FFD23F" stroke="#14102B" strokeWidth="2.5" />
        <circle cx="200" cy="40" r="14" fill="#FFD23F" stroke="#14102B" strokeWidth="2.5" />

        {/* Vault Main Body: Violet Rounded Box with Ink Outline */}
        <rect
          x="70"
          y="70"
          width="260"
          height="260"
          rx="32"
          fill="#6B4DFF"
          stroke="#14102B"
          strokeWidth="3.5"
        />

        {/* Inner Door: Lighter Violet */}
        <rect
          x="95"
          y="95"
          width="210"
          height="210"
          rx="24"
          fill="#886BFF"
          stroke="#14102B"
          strokeWidth="2.5"
        />

        {/* 4 Corner Bolts */}
        <circle cx="115" cy="115" r="7" fill="#ECEFF2" stroke="#14102B" strokeWidth="2" />
        <circle cx="285" cy="115" r="7" fill="#ECEFF2" stroke="#14102B" strokeWidth="2" />
        <circle cx="115" cy="285" r="7" fill="#ECEFF2" stroke="#14102B" strokeWidth="2" />
        <circle cx="285" cy="285" r="7" fill="#ECEFF2" stroke="#14102B" strokeWidth="2" />

        {/* Thick Chrome Torus Rim */}
        <circle
          cx="200"
          cy="200"
          r="72"
          fill="none"
          stroke="#ECEFF2"
          strokeWidth="12"
        />
        <circle
          cx="200"
          cy="200"
          r="78"
          fill="none"
          stroke="#14102B"
          strokeWidth="2"
        />
        <circle
          cx="200"
          cy="200"
          r="66"
          fill="none"
          stroke="#14102B"
          strokeWidth="2"
        />

        {/* Lime Center Dial */}
        <circle cx="200" cy="200" r="44" fill="#CFFF3A" stroke="#14102B" strokeWidth="2.5" />

        {/* 12 Dial Ticks */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i / 12) * Math.PI * 2;
          const x1 = 200 + Math.cos(angle) * 34;
          const y1 = 200 + Math.sin(angle) * 34;
          const x2 = 200 + Math.cos(angle) * 41;
          const y2 = 200 + Math.sin(angle) * 41;
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#14102B"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          );
        })}

        {/* 3-Spoke Handle */}
        <line x1="200" y1="200" x2="200" y2="168" stroke="#ECEFF2" strokeWidth="7" strokeLinecap="round" />
        <line x1="200" y1="200" x2="172" y2="216" stroke="#ECEFF2" strokeWidth="7" strokeLinecap="round" />
        <line x1="200" y1="200" x2="228" y2="216" stroke="#ECEFF2" strokeWidth="7" strokeLinecap="round" />

        <line x1="200" y1="200" x2="200" y2="168" stroke="#14102B" strokeWidth="2" strokeLinecap="round" />
        <line x1="200" y1="200" x2="172" y2="216" stroke="#14102B" strokeWidth="2" strokeLinecap="round" />
        <line x1="200" y1="200" x2="228" y2="216" stroke="#14102B" strokeWidth="2" strokeLinecap="round" />

        <circle cx="200" cy="168" r="5" fill="#FFFFFF" stroke="#14102B" strokeWidth="2" />
        <circle cx="172" cy="216" r="5" fill="#FFFFFF" stroke="#14102B" strokeWidth="2" />
        <circle cx="228" cy="216" r="5" fill="#FFFFFF" stroke="#14102B" strokeWidth="2" />
        <circle cx="200" cy="200" r="11" fill="#FFFFFF" stroke="#14102B" strokeWidth="2.5" />

        {/* Keyhole Slot on Door */}
        <circle cx="200" cy="254" r="3.5" fill="#14102B" />
        <path d="M198 255.5L202 255.5L203 264H197L198 255.5Z" fill="#14102B" />
      </svg>
    </div>
  );
}
