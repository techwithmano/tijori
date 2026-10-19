import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Vault } from "@/models/Vault";
import { stripe, kwdToUsdCents } from "@/lib/stripe";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    await connectToDatabase();
    const { token } = await context.params;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Token is required" },
        { status: 400 }
      );
    }

    // Find the active vault that matches this single-use unlock token
    const vault = await Vault.findOne({ unlockToken: token });

    if (!vault) {
      return NextResponse.json(
        {
          success: false,
          error: "This link was already used or has expired.",
          alreadyUsed: true,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, vault });
  } catch (error: any) {
    console.error("GET /api/unlock/[token] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve clearance request" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    await connectToDatabase();
    const { token } = await context.params;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Token is required" },
        { status: 400 }
      );
    }

    const vault = await Vault.findOne({ unlockToken: token });

    if (!vault) {
      return NextResponse.json(
        {
          success: false,
          error: "This link was already used or has expired.",
          alreadyUsed: true,
        },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { action, pin } = body;

    if (!["APPROVE", "DENY"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "Action must be either APPROVE or DENY" },
        { status: 400 }
      );
    }

    if (action === "APPROVE") {
      const expectedPin = String(vault.keyholderPin || "123456").trim();
      const enteredPin = String(pin || "").trim();

      if (!enteredPin || enteredPin !== expectedPin) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid 6-digit authorization PIN.",
            invalidPin: true,
          },
          { status: 400 }
        );
      }

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
          console.warn("Stripe refund in token route:", stripeErr.message);
        }
      }

      vault.currentBalance = 0;
      vault.status = "UNLOCKED";
      vault.unlockMethod = "friend_approved";
      vault.unlockToken = null; // Burn token permanently

      const guardianFullName = vault.keyholder?.name || vault.keyholderName || "Ahmed Al-Mutawa";

      vault.transactions.unshift({
        amount: payout,
        type: "BREAK_REFUND",
        status: "SUCCESS",
        createdAt: new Date(),
        note: `Keyholder ${guardianFullName} authorized break with PIN (95% payout via Stripe refund)`,
      });

      vault.transactions.unshift({
        amount: fee,
        type: "DISCIPLINE_FEE",
        status: "SUCCESS",
        createdAt: new Date(),
        note: `5% Discipline penalty fee retained in reserve`,
      });
    } else if (action === "DENY") {
      vault.status = "LOCKED";
      vault.unlockToken = null; // Burn token permanently
      vault.denialsCount = (vault.denialsCount || 0) + 1;
      vault.totalProtected = (vault.totalProtected || 0) + vault.currentBalance;
      // Streak stays alive!

      const guardianFullName = vault.keyholder?.name || vault.keyholderName || "Ahmed Al-Mutawa";
      vault.transactions.unshift({
        amount: 0,
        type: "BREAK_DENIED",
        status: "SUCCESS",
        createdAt: new Date(),
        note: `Keyholder ${guardianFullName} kept the vault locked! Streak alive & funds protected.`,
      });
    }

    await vault.save();

    return NextResponse.json({
      success: true,
      message:
        action === "DENY"
          ? "Decision recorded: Kept locked! Funds remain protected and streak is alive."
          : "Decision recorded: Approved. Payout released (minus 5% fee).",
      vault,
    });
  } catch (error: any) {
    console.error("POST /api/unlock/[token] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process Keyholder decision" },
      { status: 500 }
    );
  }
}
