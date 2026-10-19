"use client";

import React from "react";
import Logo from "./Logo";

interface BrandLogoProps {
  href?: string;
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
  className?: string;
}

export default function BrandLogo({
  href = "/",
  className = "",
}: BrandLogoProps) {
  return <Logo href={href} className={className} />;
}
