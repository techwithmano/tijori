import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  FRIEND_FEE_PCT,
  FRIEND_RETURN_PCT,
  SOLO_FEE_PCT,
  SOLO_RETURN_PCT,
} from "@/lib/config";

export default function TermsPage() {
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
          Terms of Service
        </h1>
        <p className="text-muted leading-relaxed">
          By activating a Tijori vault, you agree that your designated keyholder holds discretionary authority over early break requests until your savings goal date or target is satisfied.
        </p>
        <div className="border-t-2 border-ink pt-6 space-y-4 text-sm text-ink font-medium">
          <p>• A {FRIEND_FEE_PCT}% fee applies to early vault breaks approved by your keyholder ({FRIEND_RETURN_PCT}% returned).</p>
          <p>• A {SOLO_FEE_PCT}% emergency fee applies to solo emergency breaks without keyholder approval ({SOLO_RETURN_PCT}% returned, kept as a fee).</p>
          <p>• Denied break requests keep 100% of your funds locked and preserve your streak.</p>
        </div>
      </div>
    </div>
  );
}
