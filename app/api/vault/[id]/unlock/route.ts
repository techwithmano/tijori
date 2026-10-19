import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Vault } from "@/models/Vault";
import { stripe, kwdToUsdCents } from "@/lib/stripe";
import crypto from "crypto";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await context.params;

    const vault = await Vault.findById(id);
    if (!vault) {
      return NextResponse.json(
        { success: false, error: "Vault not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { action = "REQUEST", reason, excuse, realityCheck: incomingRoast, lang = "en" } = body;
    const finalReason = excuse || reason || "Impulse spending urge";

    if (!["REQUEST", "APPROVE", "DENY", "LOCK"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "Invalid action. Must be REQUEST, APPROVE, DENY, or LOCK" },
        { status: 400 }
      );
    }

    let unlockUrl = "";
    let token = "";
    let realityCheck = incomingRoast || "";
    let whatsappUrl = "";

    if (action === "REQUEST") {
      vault.status = "UNLOCK_PENDING";
      token = crypto.randomUUID();
      vault.unlockToken = token;
      vault.unlockReason = finalReason;
      vault.breakExcuse = finalReason;
      vault.realityCheck = realityCheck;

      const origin = req.nextUrl.origin || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      unlockUrl = `${origin}/unlock/${token}`;

      const guardianFirstName = vault.keyholder?.name ? vault.keyholder.name.split(" ")[0] : "Fahad";

      if (lang === "ar") {
        const arMsg = `سلام ${guardianFirstName}! طلبت فك تِجوري لهدف (${vault.title}). عذري: "${finalReason}". الرابط بيدك تقرر: ${unlockUrl}`;
        whatsappUrl = `https://wa.me/?text=${encodeURIComponent(arMsg)}`;
      } else {
        const enMsg = `Salam ${guardianFirstName}! I requested to break my Tijori savings vault for "${vault.title}". My reason: "${finalReason}". Decide here: ${unlockUrl}`;
        whatsappUrl = `https://wa.me/?text=${encodeURIComponent(enMsg)}`;
      }

      vault.transactions.unshift({
        amount: 0,
        type: "BREAK_REQUEST",
        status: "PENDING",
        createdAt: new Date(),
        note: `Break Requested (Waiting on ${guardianFirstName})`,
      });
    } else if (action === "APPROVE") {
      const totalAmount = vault.currentBalance;
      const fee = Math.round(totalAmount * 0.05 * 1000) / 1000;
      const payout = Math.round((totalAmount - fee) * 1000) / 1000;

      // Issue Stripe test-mode refund against most recent charges
      if (vault.processedPaymentIntents && vault.processedPaymentIntents.length > 0) {
        const latestPi = vault.processedPaymentIntents[vault.processedPaymentIntents.length - 1];
        try {
          const refundCents = kwdToUsdCents(payout);
          await stripe.refunds.create({
            payment_intent: latestPi,
            amount: refundCents,
            reason: "requested_by_customer",
          });
        } catch (stripeErr: any) {
          console.warn("Stripe test mode refund note:", stripeErr.message);
        }
      }

      vault.currentBalance = 0;
      vault.status = "UNLOCKED";
      vault.unlockToken = null; // Burn single-use token

      vault.transactions.unshift({
        amount: payout,
        type: "BREAK_REFUND",
        status: "SUCCESS",
        createdAt: new Date(),
        note: `Break approved (95% payout released via Stripe refund)`,
      });

      vault.transactions.unshift({
        amount: fee,
        type: "DISCIPLINE_FEE",
        status: "SUCCESS",
        createdAt: new Date(),
        note: `5% Discipline fee retained in reserve`,
      });
    } else if (action === "DENY") {
      vault.status = "LOCKED";
      vault.unlockToken = null; // Burn single-use token
      vault.denialsCount = (vault.denialsCount || 0) + 1;
      vault.totalProtected = (vault.totalProtected || 0) + vault.currentBalance;
      // Streak stays alive!

      vault.transactions.unshift({
        amount: 0,
        type: "BREAK_DENIED",
        status: "SUCCESS",
        createdAt: new Date(),
        note: `Keyholder ${vault.keyholder.name} rejected break request! Streak preserved & funds locked.`,
      });
    } else if (action === "LOCK") {
      vault.status = "LOCKED";
      vault.unlockToken = null;
    }

    await vault.save();

    return NextResponse.json({
      success: true,
      message: `Vault status updated to ${vault.status}`,
      token: token || null,
      unlockUrl: unlockUrl || null,
      realityCheck: realityCheck || null,
      whatsappUrl: whatsappUrl || null,
      vault,
    });
  } catch (error: any) {
    console.error("POST /api/vault/[id]/unlock error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update vault unlock status" },
      { status: 500 }
    );
  }
}
