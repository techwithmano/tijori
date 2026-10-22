import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Vault } from "@/models/Vault";
import { User } from "@/models/User";
import { stripe, kwdToUsdCents } from "@/lib/stripe";
import { sendKeyholderUnlockEmail } from "@/lib/resend";
import { getRequestOrigin } from "@/lib/utils";
import crypto from "crypto";
import {
  calculateFriendRelease,
  calculateSoloBreak,
  FRIEND_FEE_PCT,
  SOLO_FEE_PCT,
  FRIEND_RETURN_PCT,
  SOLO_RETURN_PCT,
} from "@/lib/config";

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

    if (!["REQUEST", "APPROVE", "DENY", "LOCK", "EMERGENCY_BREAK"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "Invalid action. Must be REQUEST, APPROVE, DENY, LOCK, or EMERGENCY_BREAK" },
        { status: 400 }
      );
    }

    let realityCheck = incomingRoast || "";
    let emailResult: any = null;
    const targetKeyholderEmail = vault.keyholderEmail || vault.keyholder?.email;

    if (action === "REQUEST") {
      vault.status = "UNLOCK_PENDING";
      const token = crypto.randomUUID();
      vault.unlockToken = token;
      vault.unlockReason = finalReason;
      vault.breakExcuse = finalReason;
      vault.realityCheck = realityCheck;

      const origin = getRequestOrigin(req);
      const unlockUrl = `${origin}/unlock/${token}`;

      const guardianFirstName = vault.keyholder?.name ? vault.keyholder.name.split(" ")[0] : "Ahmed";
      const guardianFullName = vault.keyholder?.name || vault.keyholderName || guardianFirstName;

      // Fetch owner name
      let ownerName = "Your Friend";
      if (vault.userId) {
        const owner = await User.findById(vault.userId).select("name");
        if (owner?.name) ownerName = owner.name;
      }

      // Dispatch unlock approval email confidentially to Keyholder
      if (targetKeyholderEmail) {
        try {
          emailResult = await sendKeyholderUnlockEmail({
            to: targetKeyholderEmail.trim(),
            keyholderName: guardianFullName,
            applicantName: ownerName,
            goalTitle: vault.title,
            currentBalance: vault.currentBalance,
            excuse: finalReason,
            realityCheck,
            unlockUrl,
            isArabic: lang === "ar",
          });
        } catch (err: any) {
          console.error("sendKeyholderUnlockEmail error:", err);
          emailResult = { success: false, error: err.message };
        }
      } else {
        console.warn("No keyholder email found on vault for unlock request:", vault._id);
        emailResult = { success: false, error: "No keyholder email found on vault." };
      }

      vault.transactions.unshift({
        amount: 0,
        type: "BREAK_REQUEST",
        status: "PENDING",
        createdAt: new Date(),
        note: `Break Requested (Waiting on ${guardianFirstName})`,
      });
    } else if (action === "APPROVE") {
      // Validate Ahmed's 6-digit numeric PIN
      const { pin } = body;
      const expectedPin = String(vault.keyholderPin || "123456").trim();
      const enteredPin = String(pin || "").trim();

      if (!enteredPin || enteredPin !== expectedPin) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid 6-digit Keyholder authorization PIN. Please verify with Ahmed.",
            invalidPin: true,
          },
          { status: 400 }
        );
      }

      const totalAmount = vault.currentBalance;
      const { fee, returnAmount: payout } = calculateFriendRelease(totalAmount);

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
      vault.unlockMethod = "friend_approved";
      vault.unlockToken = null; // Burn single-use token

      vault.transactions.unshift({
        amount: payout,
        type: "BREAK_REFUND",
        status: "SUCCESS",
        createdAt: new Date(),
        note: `Break approved by ${vault.keyholder?.name || "Ahmed"} (${FRIEND_RETURN_PCT}% returned)`,
      });

      vault.transactions.unshift({
        amount: fee,
        type: "DISCIPLINE_FEE",
        status: "SUCCESS",
        createdAt: new Date(),
        note: `Early release fee (${FRIEND_FEE_PCT}%)`,
      });
    } else if (action === "EMERGENCY_BREAK") {
      // Emergency Break Alone (15% emergency fee, 85% refund)
      const totalAmount = vault.currentBalance;
      const { fee, returnAmount: payout } = calculateSoloBreak(totalAmount);

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
      vault.unlockMethod = "emergency_self_break";
      vault.unlockToken = null;

      vault.transactions.unshift({
        amount: payout,
        type: "BREAK_REFUND",
        status: "SUCCESS",
        createdAt: new Date(),
        note: `You broke the vault (${SOLO_RETURN_PCT}% returned)`,
      });

      vault.transactions.unshift({
        amount: fee,
        type: "DISCIPLINE_FEE",
        status: "SUCCESS",
        createdAt: new Date(),
        note: `Emergency fee (${SOLO_FEE_PCT}%)`,
      });
    } else if (action === "DENY") {
      vault.status = "LOCKED";
      vault.unlockToken = null; // Burn single-use token
      vault.denialsCount = (vault.denialsCount || 0) + 1;
      vault.totalProtected = (vault.totalProtected || 0) + vault.currentBalance;
      // Streak stays alive!

      const guardianFullName = vault.keyholder?.name || vault.keyholderName || "Ahmed Al-Mutawa";
      vault.transactions.unshift({
        amount: 0,
        type: "BREAK_DENIED",
        status: "SUCCESS",
        createdAt: new Date(),
        note: `Keyholder ${guardianFullName} rejected break request! Streak preserved & funds locked.`,
      });
    } else if (action === "LOCK") {
      vault.status = "LOCKED";
      vault.unlockToken = null;
    }

    await vault.save();

    const safeVault: any = vault.toObject ? vault.toObject() : { ...vault };
    delete safeVault.inviteToken;
    delete safeVault.unlockToken; // Confidential: creator must never receive or see unlockToken

    return NextResponse.json({
      success: true,
      message: `Vault status updated to ${vault.status}`,
      realityCheck: realityCheck || null,
      emailResult,
      keyholderEmail: targetKeyholderEmail || null,
      vault: safeVault,
    });
  } catch (error: any) {
    console.error("POST /api/vault/[id]/unlock error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update vault unlock status" },
      { status: 500 }
    );
  }
}
