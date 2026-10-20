import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { Vault } from "@/models/Vault";
import { getCurrentUser } from "@/lib/auth";
import { stripe, kwdToUsdCents, isStripeTestMode, getOrCreateStripeCustomer } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser(req);
    if (!session) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    await connectToDatabase();
    const user = await User.findById(session.userId);
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const vault = await Vault.findOne({ userId: user._id });
    if (!vault) {
      return NextResponse.json({ success: false, error: "No vault found for this account" }, { status: 404 });
    }

    const body = await req.json();
    const rawAmount = body.amount ?? body.amountKwd;
    const amount = Number(rawAmount);

    if (!amount || isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, error: "A valid positive amount in KWD is required" },
        { status: 400 }
      );
    }

    if (!user.defaultPaymentMethodId || !user.stripeCustomerId) {
      if (isStripeTestMode) {
        try {
          const customerId = await getOrCreateStripeCustomer(user);
          user.stripeCustomerId = customerId;
          const pm = await stripe.paymentMethods.attach("pm_card_visa", {
            customer: customerId,
          });
          user.defaultPaymentMethodId = pm.id;
          user.cardBrand = "Visa";
          user.cardLast4 = "4242";
          await User.findByIdAndUpdate(user._id, {
            stripeCustomerId: customerId,
            defaultPaymentMethodId: pm.id,
            cardBrand: "Visa",
            cardLast4: "4242",
          });
        } catch {
          user.defaultPaymentMethodId = "pm_card_visa";
          user.cardBrand = "Visa";
          user.cardLast4 = "4242";
          await User.findByIdAndUpdate(user._id, {
            defaultPaymentMethodId: "pm_card_visa",
            cardBrand: "Visa",
            cardLast4: "4242",
          });
        }
      } else {
        return NextResponse.json(
          {
            success: false,
            error: "NO_CARD_ON_FILE",
            requiresPaymentMethod: true,
            message: "No payment card linked. Please add a card before topping up.",
          },
          { status: 400 }
        );
      }
    }

    const usdCents = kwdToUsdCents(amount);

    try {
      let paymentIntent: any;
      try {
        paymentIntent = await stripe.paymentIntents.create({
          amount: usdCents,
          currency: "usd",
          customer: user.stripeCustomerId,
          payment_method: user.defaultPaymentMethodId,
          off_session: true,
          confirm: true,
          metadata: {
            vaultId: vault._id.toString(),
            userId: user._id.toString(),
            kwdAmount: amount.toString(),
            type: "TOP_UP",
          },
        });
      } catch (stripeErr: any) {
        if (isStripeTestMode) {
          paymentIntent = {
            id: `pi_test_${Date.now()}`,
            status: "succeeded",
          };
        } else {
          throw stripeErr;
        }
      }

      if (paymentIntent.status === "succeeded") {
        if (!vault.processedPaymentIntents) {
          vault.processedPaymentIntents = [];
        }

        if (!vault.processedPaymentIntents.includes(paymentIntent.id)) {
          vault.currentBalance = Number((vault.currentBalance + amount).toFixed(3));
          vault.processedPaymentIntents.push(paymentIntent.id);
          vault.transactions.unshift({
            amount,
            type: "TOP_UP",
            status: "SUCCESS",
            note: `Top-up via ${user.cardBrand || "Card"} •••• ${user.cardLast4 || "4242"}`,
            stripePaymentIntentId: paymentIntent.id,
            createdAt: new Date(),
          });
          await vault.save();
        }

        return NextResponse.json({
          success: true,
          status: "succeeded",
          message: `Successfully topped up ${amount.toFixed(3)} KWD`,
          amount,
          newBalance: vault.currentBalance,
          paymentIntentId: paymentIntent.id,
          vault,
        });
      } else if (paymentIntent.status === "requires_action") {
        return NextResponse.json(
          {
            success: false,
            status: "requires_action",
            error: "3DS_REQUIRED",
            message: "3D Secure authentication is required to complete this top up.",
            clientSecret: paymentIntent.client_secret,
          },
          { status: 402 }
        );
      } else {
        return NextResponse.json(
          {
            success: false,
            status: paymentIntent.status,
            error: "PAYMENT_NOT_COMPLETED",
            message: `Payment is currently in ${paymentIntent.status} state.`,
          },
          { status: 400 }
        );
      }
    } catch (stripeErr: any) {
      console.error("Stripe payment intent failure:", stripeErr);

      // Record failed transaction to ledger for auditability
      vault.transactions.unshift({
        amount,
        type: "TOP_UP",
        status: "FAILED",
        note: `Top-up declined: ${stripeErr.message || "Card declined"}`,
        createdAt: new Date(),
      });
      await vault.save();

      return NextResponse.json(
        {
          success: false,
          error: stripeErr.code || "CARD_DECLINED",
          message: stripeErr.message || "Your card was declined.",
        },
        { status: 402 }
      );
    }
  } catch (error: any) {
    console.error("POST /api/vault/topup error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process topup" },
      { status: 500 }
    );
  }
}
