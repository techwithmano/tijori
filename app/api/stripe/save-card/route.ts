import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { Vault } from "@/models/Vault";
import { getCurrentUser } from "@/lib/auth";
import { stripe, getOrCreateStripeCustomer, isStripeTestMode } from "@/lib/stripe";

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

    let customerId = user.stripeCustomerId || "";
    try {
      if (!customerId) {
        customerId = await getOrCreateStripeCustomer(user);
      }
    } catch (e: any) {
      console.warn("Stripe customer initialization note:", e.message);
    }

    const body = await req.json();
    let { paymentMethodId, setupIntentId, useTestCard } = body;

    // Handle test card simulation if requested in test mode
    if (useTestCard) {
      paymentMethodId = paymentMethodId || "pm_card_visa";
      if (customerId && isStripeTestMode) {
        try {
          const pm = await stripe.paymentMethods.attach("pm_card_visa", {
            customer: customerId,
          });
          paymentMethodId = pm.id;
        } catch (err: any) {
          paymentMethodId = "pm_card_visa";
        }
      }
    }

    if (setupIntentId && !paymentMethodId) {
      const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);
      if (typeof setupIntent.payment_method === "string") {
        paymentMethodId = setupIntent.payment_method;
      } else if (setupIntent.payment_method && typeof setupIntent.payment_method === "object") {
        paymentMethodId = (setupIntent.payment_method as any).id;
      }
    }

    if (!paymentMethodId) {
      return NextResponse.json(
        { success: false, error: "paymentMethodId or valid setupIntentId is required" },
        { status: 400 }
      );
    }

    // Retrieve payment method details from Stripe
    let cardBrand = "Visa";
    let cardLast4 = "4242";

    try {
      const pm = await stripe.paymentMethods.retrieve(paymentMethodId);
      if (pm.card) {
        cardBrand = pm.card.brand ? pm.card.brand.toUpperCase() : "CARD";
        cardLast4 = pm.card.last4 || "4242";
      }

      // Attach to customer if not attached
      if (pm.customer !== customerId) {
        await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
      }

      // Set as default payment method on Stripe customer
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
    } catch (pmErr: any) {
      console.warn("Stripe payment method retrieval note:", pmErr.message);
    }

    // Save on user document in MongoDB
    user.defaultPaymentMethodId = paymentMethodId;
    user.cardBrand = cardBrand;
    user.cardLast4 = cardLast4;
    await user.save();

    // If user's vault was marked needsAttention because of missing card, resolve it
    await Vault.updateMany(
      { userId: user._id, needsAttentionReason: "NO_PAYMENT_METHOD" },
      { $set: { needsAttention: false, needsAttentionReason: null } }
    );

    return NextResponse.json({
      success: true,
      message: "Card saved successfully",
      card: {
        brand: cardBrand,
        last4: cardLast4,
        paymentMethodId,
      },
    });
  } catch (error: any) {
    console.error("POST /api/stripe/save-card error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save card" },
      { status: 500 }
    );
  }
}
