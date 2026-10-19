import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>
        <p className="text-muted leading-relaxed">
          We value your personal privacy. We only collect the minimal information necessary to safeguard your micro-savings and coordinate clearance requests with your chosen keyholder.
        </p>
        <div className="border-t-2 border-ink pt-6 space-y-4 text-sm text-ink font-medium">
          <p>• Your savings goals and amounts are kept strictly between you and your appointed friend.</p>
          <p>• We never sell, monetize, or share your financial records with third parties.</p>
        </div>
      </div>
    </div>
  );
}
