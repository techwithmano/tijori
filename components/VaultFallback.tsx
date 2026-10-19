"use client";

import React from "react";

interface VaultFallbackProps {
  onVaultClick?: () => void;
}

export default function VaultFallback({ onVaultClick = () => {} }: VaultFallbackProps) {
  return (
    <div
      onClick={onVaultClick}
      className="w-full h-full min-h-[300px] sm:min-h-[460px] flex items-center justify-center select-none relative cursor-pointer"
      aria-label="Tijori Vault Illustration"
    >
      {/* Soft blurred CSS Ellipse Shadow under the vault */}
      <div
        className="absolute -bottom-4 sm:-bottom-6 left-1/2 -translate-x-1/2 w-[280px] sm:w-[360px] h-[45px] sm:h-[60px] rounded-[100%] blur-md pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(20,16,43,0.28) 0%, rgba(20,16,43,0.12) 45%, transparent 70%)",
        }}
      />

      <svg
        viewBox="0 0 440 440"
        className="w-full max-w-[360px] sm:max-w-[440px] h-auto relative z-10"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* 6 Floating Gold Coins (front and back) */}
        <g id="coins">
          {/* Coin 1: Top Right */}
          <circle cx="360" cy="80" r="22" fill="#FFD23F" stroke="#14102B" strokeWidth="2.5" />
          <circle cx="360" cy="80" r="14" stroke="#14102B" strokeWidth="1.5" strokeDasharray="3 3" />

          {/* Coin 2: Top Left */}
          <circle cx="75" cy="95" r="24" fill="#FFD23F" stroke="#14102B" strokeWidth="2.5" />
          <circle cx="75" cy="95" r="15" stroke="#14102B" strokeWidth="1.5" strokeDasharray="3 3" />

          {/* Coin 3: Mid Left */}
          <circle cx="50" cy="240" r="20" fill="#FFD23F" stroke="#14102B" strokeWidth="2.5" />
          <circle cx="50" cy="240" r="12" stroke="#14102B" strokeWidth="1.5" strokeDasharray="3 3" />

          {/* Coin 4: Mid Right */}
          <circle cx="390" cy="230" r="23" fill="#FFD23F" stroke="#14102B" strokeWidth="2.5" />
          <circle cx="390" cy="230" r="14" stroke="#14102B" strokeWidth="1.5" strokeDasharray="3 3" />

          {/* Coin 5: Bottom Left */}
          <circle cx="90" cy="350" r="21" fill="#FFD23F" stroke="#14102B" strokeWidth="2.5" />
          <circle cx="90" cy="350" r="13" stroke="#14102B" strokeWidth="1.5" strokeDasharray="3 3" />

          {/* Coin 6: Bottom Right */}
          <circle cx="350" cy="360" r="22" fill="#FFD23F" stroke="#14102B" strokeWidth="2.5" />
          <circle cx="350" cy="360" r="14" stroke="#14102B" strokeWidth="1.5" strokeDasharray="3 3" />
        </g>

        {/* ── 2 Chrome Hinges on the Start Side (x = 76) ── */}
        <rect x="76" y="130" width="16" height="42" rx="4" fill="#ECEFF2" stroke="#14102B" strokeWidth="2.5" />
        <rect x="76" y="268" width="16" height="42" rx="4" fill="#ECEFF2" stroke="#14102B" strokeWidth="2.5" />

        {/* ── 1 Locking Bar on End Side (x = 348) ── */}
        <rect x="348" y="200" width="20" height="40" rx="4" fill="#ECEFF2" stroke="#14102B" strokeWidth="2.5" />

        {/* ── Vault Main Body: Violet Rounded Box (#6B4DFF) with 2px Ink Outline ── */}
        <rect
          x="88"
          y="88"
          width="264"
          height="264"
          rx="32"
          fill="#6B4DFF"
          stroke="#14102B"
          strokeWidth="3.5"
        />

        {/* 4 Corner Bolts on Body */}
        <circle cx="112" cy="112" r="7.5" fill="#ECEFF2" stroke="#14102B" strokeWidth="2" />
        <circle cx="328" cy="112" r="7.5" fill="#ECEFF2" stroke="#14102B" strokeWidth="2" />
        <circle cx="112" cy="328" r="7.5" fill="#ECEFF2" stroke="#14102B" strokeWidth="2" />
        <circle cx="328" cy="328" r="7.5" fill="#ECEFF2" stroke="#14102B" strokeWidth="2" />

        {/* ── Dark Inset Seam Gap: #14102B ── */}
        <rect
          x="108"
          y="108"
          width="224"
          height="224"
          rx="24"
          fill="#14102B"
        />

        {/* ── Thick Vault Door: #886BFF ── */}
        <rect
          x="114"
          y="114"
          width="212"
          height="212"
          rx="20"
          fill="#886BFF"
          stroke="#14102B"
          strokeWidth="2.5"
        />

        {/* ── Smaller Lime Disc under Wheel ── */}
        <circle cx="220" cy="204" r="42" fill="#CFFF3A" stroke="#14102B" strokeWidth="2.5" />

        {/* ── Chunky 4-Spoke Wheel Handle ── */}
        {/* Torus Rim */}
        <circle cx="220" cy="204" r="46" fill="none" stroke="#ECEFF2" strokeWidth="10" />
        <circle cx="220" cy="204" r="51" fill="none" stroke="#14102B" strokeWidth="2" />
        <circle cx="220" cy="204" r="41" fill="none" stroke="#14102B" strokeWidth="2" />

        {/* 4 Spokes with Knobs */}
        {/* Vertical Spoke */}
        <line x1="220" y1="160" x2="220" y2="248" stroke="#ECEFF2" strokeWidth="7" strokeLinecap="round" />
        <line x1="220" y1="160" x2="220" y2="248" stroke="#14102B" strokeWidth="2" strokeLinecap="round" />
        <circle cx="220" cy="158" r="6" fill="#FFFFFF" stroke="#14102B" strokeWidth="2" />
        <circle cx="220" cy="250" r="6" fill="#FFFFFF" stroke="#14102B" strokeWidth="2" />

        {/* Horizontal Spoke */}
        <line x1="176" y1="204" x2="264" y2="204" stroke="#ECEFF2" strokeWidth="7" strokeLinecap="round" />
        <line x1="176" y1="204" x2="264" y2="204" stroke="#14102B" strokeWidth="2" strokeLinecap="round" />
        <circle cx="174" cy="204" r="6" fill="#FFFFFF" stroke="#14102B" strokeWidth="2" />
        <circle cx="266" cy="204" r="6" fill="#FFFFFF" stroke="#14102B" strokeWidth="2" />

        {/* Center Chrome Hub */}
        <circle cx="220" cy="204" r="14" fill="#FFFFFF" stroke="#14102B" strokeWidth="2.5" />

        {/* ── Keyhole on a Small Lime Plate BELOW the Wheel ── */}
        <rect
          x="202"
          y="278"
          width="36"
          height="42"
          rx="8"
          fill="#CFFF3A"
          stroke="#14102B"
          strokeWidth="2.5"
        />
        <circle cx="220" cy="292" r="4" fill="#14102B" />
        <path d="M217.5 294L222.5 294L223.5 306H216.5L217.5 294Z" fill="#14102B" />
      </svg>
    </div>
  );
}
