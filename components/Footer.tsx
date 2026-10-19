"use client";

import React from "react";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();

  // Landing page has its own dedicated 3-link footer per Task 4 specs
  if (pathname === "/") {
    return null;
  }

  return (
    <footer className="border-t border-line py-6 text-center text-xs text-muted bg-surface/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-bold text-text">Tijori (تِجوري)</span>
          <span className="text-muted/40">&bull;</span>
          <span className="text-muted">Anti-Impulse Micro-Savings</span>
        </div>
        <div className="text-[13px] text-muted tabular-nums">
          KWD (د.ك) &bull; Kuwait &amp; GCC
        </div>
      </div>
    </footer>
  );
}
