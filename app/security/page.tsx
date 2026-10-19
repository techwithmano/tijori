import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function SecurityPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm font-bold text-ink hover:text-violet transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
        <span>Back to Home</span>
      </Link>
      <div className="card-hard bg-surface p-8 sm:p-12 space-y-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-ink font-heading">
          Security at Tijori
        </h1>
        <p className="text-muted leading-relaxed">
          Tijori enforces social commitment through trusted keyholder authorization. Funds are securely handled in partnership with certified payment processors.
        </p>
        <div className="border-t-2 border-ink pt-6 space-y-4 text-sm text-ink font-medium">
          <p>• Zero storage of raw card numbers on our servers.</p>
          <p>• Single-use cryptographically signed authorization tokens.</p>
          <p>• Direct bank-grade encryption through Stripe.</p>
        </div>
      </div>
    </div>
  );
}
