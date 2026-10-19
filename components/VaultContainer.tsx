"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import VaultFallback from "./VaultFallback";

const Vault3D = dynamic(() => import("./Vault3D"), {
  ssr: false,
  loading: () => <VaultFallback />,
});

export default function VaultContainer({ onVaultClick }: { onVaultClick?: () => void }) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  if (!mounted || prefersReducedMotion) {
    return <VaultFallback onVaultClick={onVaultClick} />;
  }

  return <Vault3D onVaultClick={onVaultClick} />;
}
