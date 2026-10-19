import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Vault } from "@/models/Vault";
import { stripe, usdCentsToKwd } from "@/lib/stripe";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("stripe-signature");

    let event: Stripe.Event;

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (webhookSecret) {
      if (!signature) {
        return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
      }
      try {
        event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
      } catch (err: any) {
        console.error("⚠️ Stripe Webhook signature verification failed:", err.message);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
      }
    } else {
      // In local dev without STRIPE_WEBHOOK_SECRET, parse the event directly
      console.warn("⚠️ STRIPE_WEBHOOK_SECRET not set, parsing event payload without signature verification.");
      event = JSON.parse(rawBody) as Stripe.Event;
    }

    await connectToDatabase();

    // Idempotent processing of payment_intent.succeeded
    if (event.type === "payment_intent.succeeded") {
      const pi = event.data.object as Stripe.PaymentIntent;
      const vaultId = pi.metadata?.vaultId;
      const kwdAmount = Number(pi.metadata?.kwdAmount) || usdCentsToKwd(pi.amount);
      const paymentType = pi.metadata?.type || "STRIPE_DEPOSIT";

      if (vaultId) {
        const vault = await Vault.findById(vaultId);
        if (vault) {
          if (!vault.processedPaymentIntents) {
            vault.processedPaymentIntents = [];
          }

          // Idempotency check: do not double-credit on retries
          if (vault.processedPaymentIntents.includes(pi.id)) {
            console.log(`PaymentIntent ${pi.id} already processed for vault ${vaultId}. Skipping.`);
            return NextResponse.json({ received: true, alreadyProcessed: true });
          }

          // Credit balance
          vault.currentBalance = Number((vault.currentBalance + kwdAmount).toFixed(3));
          vault.processedPaymentIntents.push(pi.id);

          // If scheduled pull, advance cadence & increment streak
          if (paymentType === "SCHEDULED_PULL") {
            vault.streakCount = (vault.streakCount || 0) + 1;
            vault.needsAttention = false;
            vault.needsAttentionReason = null;

            const next = new Date();
            if (vault.cadence === "daily") next.setDate(next.getDate() + 1);
            else if (vault.cadence === "biweekly") next.setDate(next.getDate() + 14);
            else if (vault.cadence === "monthly") next.setMonth(next.getMonth() + 1);
            else next.setDate(next.getDate() + 7); // weekly default
            vault.nextPullAt = next;
          }

          vault.transactions.unshift({
            amount: kwdAmount,
            type: paymentType === "TOP_UP" ? "TOP_UP" : "SCHEDULED_PULL",
            status: "SUCCESS",
            note: paymentType === "TOP_UP" ? "Instant top-up confirmed via Stripe" : `Scheduled auto-pull (${vault.cadence})`,
            stripePaymentIntentId: pi.id,
            createdAt: new Date(),
          });

          await vault.save();
          console.log(`Successfully credited ${kwdAmount} KWD to vault ${vaultId} for PI ${pi.id}`);
        }
      }
    }

    // Processing of payment_intent.payment_failed
    if (event.type === "payment_intent.payment_failed") {
      const pi = event.data.object as Stripe.PaymentIntent;
      const vaultId = pi.metadata?.vaultId;
      const kwdAmount = Number(pi.metadata?.kwdAmount) || usdCentsToKwd(pi.amount);
      const paymentType = pi.metadata?.type || "SCHEDULED_PULL";
      const failureMessage = pi.last_payment_error?.message || "Charge declined by issuing bank";

      if (vaultId) {
        const vault = await Vault.findById(vaultId);
        if (vault) {
          vault.needsAttention = true;
          vault.needsAttentionReason = failureMessage;

          vault.transactions.unshift({
            amount: kwdAmount,
            type: paymentType === "TOP_UP" ? "TOP_UP" : "SCHEDULED_PULL",
            status: "FAILED",
            note: `Payment failed: ${failureMessage}`,
            stripePaymentIntentId: pi.id,
            createdAt: new Date(),
          });

          await vault.save();
          console.log(`Recorded payment failure for vault ${vaultId}: ${failureMessage}`);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("POST /api/stripe/webhook error:", error);
    return NextResponse.json(
      { error: error.message || "Webhook handler error" },
      { status: 500 }
    );
  }
}
