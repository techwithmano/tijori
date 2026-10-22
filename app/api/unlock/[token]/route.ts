import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Vault } from "@/models/Vault";
import { User } from "@/models/User";
import { stripe, kwdToUsdCents } from "@/lib/stripe";
import { calculateFriendRelease, FRIEND_FEE_PCT, FRIEND_RETURN_PCT } from "@/lib/config";

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

    // Support demo mode break requests (e.g. demo_unlock_token_123)
    if (token.startsWith("demo_")) {
      return NextResponse.json({
        success: true,
        vault: {
          _id: "demo_vault_london_2026",
          title: "London Summer Trip 🇬🇧",
          targetAmount: 500,
          currentBalance: 185,
          pullAmount: 25,
          cadence: "monthly",
          streakCount: 18,
          denialsCount: 2,
          status: "UNLOCK_PENDING",
          keyholder: {
            name: "Ahmed (Brother)",
            phone: "+965 9988 7766",
            relationship: "Brother",
          },
          applicantName: "Abdulrahman",
          unlockReason: "Travis Scott sneaker drop at 360 Mall — limited release this weekend!",
          breakExcuse: "Travis Scott sneaker drop at 360 Mall — limited release this weekend!",
          realityCheck: "This sneaker urge is an impulse buy. Breaking your vault will reset your 18-day streak and deduct 5% penalty.",
          unlockToken: token,
          keyholderPin: "123456",
        },
      });
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

    let applicantName = "";
    if (vault.userId) {
      const owner = await User.findById(vault.userId).select("name");
      if (owner?.name) applicantName = owner.name;
    }

    const vaultObj = vault.toObject();
    (vaultObj as any).applicantName = applicantName;

    return NextResponse.json({ success: true, vault: vaultObj });
  } catch (error: any) {
    console.error("GET /api/unlock/[token] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve break request" },
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

    // Support demo mode break requests (e.g. demo_unlock_token_123)
    if (token.startsWith("demo_")) {
      const body = await req.json();
      const { action, pin } = body;
      if (!["APPROVE", "DENY"].includes(action)) {
        return NextResponse.json(
          { success: false, error: "Action must be either APPROVE or DENY" },
          { status: 400 }
        );
      }
      if (action === "APPROVE") {
        const enteredPin = String(pin || "").trim();
        if (enteredPin !== "123456") {
          return NextResponse.json(
            {
              success: false,
              error: "Invalid 6-digit authorization PIN. For demo, use 123456.",
              invalidPin: true,
            },
            { status: 400 }
          );
        }
        return NextResponse.json({
          success: true,
          action: "APPROVE",
          message: "Demo vault break authorized successfully with PIN 123456.",
        });
      }
      return NextResponse.json({
        success: true,
        action: "DENY",
        message: "Demo vault kept locked! Discipline preserved.",
      });
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
        note: `Break approved by ${guardianFullName} (${FRIEND_RETURN_PCT}% returned)`,
      });

      vault.transactions.unshift({
        amount: fee,
        type: "DISCIPLINE_FEE",
        status: "SUCCESS",
        createdAt: new Date(),
        note: `Early release fee (${FRIEND_FEE_PCT}%)`,
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
