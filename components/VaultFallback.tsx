import React from "react";

export default function VaultFallback() {
  return (
    <div
      className="w-full h-full min-h-[380px] sm:min-h-[460px] lg:min-h-[520px] flex items-center justify-center relative select-none"
      role="img"
      aria-label="3D Vault Door"
    >
      {/* Outer Glow Halo */}
      <div className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-violet/20 blur-3xl -z-10 pointer-events-none" />
      <div className="absolute w-60 h-60 sm:w-80 sm:h-80 rounded-full bg-accent/15 blur-2xl -z-10 pointer-events-none" />

      {/* Vault Door SVG */}
      <div className="relative w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-gradient-to-br from-[#1E1B2B] via-[#12101E] to-[#0D0B16] border-4 border-line/80 shadow-2xl flex items-center justify-center p-4">
        {/* Outer Heavy Rim with Rivets */}
        <div className="absolute inset-2 rounded-full border border-violet/30" />

        {/* Concentric Rivet Markers */}
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
          <div
            key={deg}
            className="absolute w-2 h-2 rounded-full bg-[#5C5778] shadow-sm"
            style={{
              transform: `rotate(${deg}deg) translateY(-134px)`,
            }}
          />
        ))}

        {/* Lime Glow Ring */}
        <div className="absolute inset-8 sm:inset-12 rounded-full border-2 border-accent shadow-limeGlow animate-pulse" />

        {/* Recessed Inner Steel Plate */}
        <div className="w-48 h-48 sm:w-64 sm:h-64 rounded-full bg-gradient-to-tr from-[#151322] via-[#1E1B2E] to-[#252238] border border-line flex items-center justify-center shadow-inner relative">
          {/* Subtle Dial Spokes */}
          {[0, 45, 90, 135].map((deg) => (
            <div
              key={deg}
              className="absolute w-36 sm:w-48 h-2 rounded-full bg-gradient-to-r from-transparent via-[#635E85] to-transparent opacity-80"
              style={{ transform: `rotate(${deg}deg)` }}
            />
          ))}

          {/* Central Hub */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-[#403B5C] via-[#2A263D] to-[#171424] border-2 border-line/60 shadow-lg flex items-center justify-center relative z-10">
            <div className="w-6 h-6 rounded-full bg-accent shadow-limeGlow" />
          </div>
        </div>
      </div>
    </div>
  );
}
