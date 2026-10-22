import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Vault } from "@/models/Vault";
import { User } from "@/models/User";
import { stripe, kwdToUsdCents } from "@/lib/stripe";

export async function GET(req: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = req.headers.get("authorization");

    // Secure authentication check
    if (process.env.NODE_ENV === "production" && !cronSecret) {
      console.error("CRITICAL SECURITY ERROR: CRON_SECRET is not configured in production.");
      return NextResponse.json({ success: false, error: "Server configuration error" }, { status: 500 });
    }

    if (cronSecret) {
      if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
      }
    } else {
      console.warn("⚠️ CRON_SECRET is not configured in environment. Running in development mode.");
    }
    await connectToDatabase();
    const now = new Date();
    const force = req.nextUrl.searchParams.get("force") === "true";

    // Find vaults that are locked, belong to a valid user, and are due for pull
    const dueVaults = await Vault.find({
      status: "LOCKED",
      userId: { $exists: true, $ne: null },
      ...(force ? {} : { $or: [{ nextPullAt: { $lte: now } }, { nextPullAt: null }] }),
    });

    const results = [];
    let successCount = 0;
    let failCount = 0;

    for (const vault of dueVaults) {
      try {
        const user = await User.findById(vault.userId);
        if (!user) continue;
        const pullKwd = vault.pullAmount || 10;

      // Calculate next scheduled pull date regardless
      const nextDate = new Date();
      if (vault.cadence === "daily") nextDate.setDate(nextDate.getDate() + 1);
      else if (vault.cadence === "biweekly") nextDate.setDate(nextDate.getDate() + 14);
      else if (vault.cadence === "monthly") nextDate.setMonth(nextDate.getMonth() + 1);
      else nextDate.setDate(nextDate.getDate() + 7); // weekly default

      if (!user || !user.defaultPaymentMethodId || !user.stripeCustomerId) {
        // Vault needs attention: no card on file
        vault.needsAttention = true;
        vault.needsAttentionReason = "NO_PAYMENT_METHOD";
        vault.nextPullAt = nextDate;

        vault.transactions.unshift({
          amount: pullKwd,
          type: "SCHEDULED_PULL",
          status: "FAILED",
          note: "Scheduled pull failed: No payment card on file",
          createdAt: new Date(),
        });

        await vault.save();
        failCount++;
        results.push({
          vaultId: vault._id,
          status: "FAILED",
          reason: "No payment method on file",
        });
        continue;
      }

      // Charge card off-session
      const usdCents = kwdToUsdCents(pullKwd);

      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: usdCents,
          currency: "usd",
          customer: user.stripeCustomerId,
          payment_method: user.defaultPaymentMethodId,
          off_session: true,
          confirm: true,
          metadata: {
            vaultId: vault._id.toString(),
            userId: user._id.toString(),
            kwdAmount: pullKwd.toString(),
            type: "SCHEDULED_PULL",
          },
        });

        if (paymentIntent.status === "succeeded") {
          if (!vault.processedPaymentIntents) {
            vault.processedPaymentIntents = [];
          }

          vault.currentBalance = Number((vault.currentBalance + pullKwd).toFixed(3));
          vault.streakCount = (vault.streakCount || 0) + 1; // extends streak if paid
          vault.needsAttention = false;
          vault.needsAttentionReason = null;
          vault.nextPullAt = nextDate;
          vault.processedPaymentIntents.push(paymentIntent.id);

          vault.transactions.unshift({
            amount: pullKwd,
            type: "SCHEDULED_PULL",
            status: "SUCCESS",
            note: `Auto-saved via ${user.cardBrand || "Card"} •••• ${user.cardLast4 || "4242"} (${vault.cadence})`,
            stripePaymentIntentId: paymentIntent.id,
            createdAt: new Date(),
          });

          await vault.save();
          successCount++;
          results.push({
            vaultId: vault._id,
            status: "SUCCESS",
            amount: pullKwd,
            newBalance: vault.currentBalance,
            paymentIntentId: paymentIntent.id,
          });
        } else {
          throw new Error(`Charge did not succeed (status: ${paymentIntent.status})`);
        }
      } catch (stripeErr: any) {
        console.error(`Cron pull failed for vault ${vault._id}:`, stripeErr.message);

        vault.needsAttention = true;
        vault.needsAttentionReason = stripeErr.message || "Card charge failed";
        vault.nextPullAt = nextDate;

        vault.transactions.unshift({
          amount: pullKwd,
          type: "SCHEDULED_PULL",
          status: "FAILED",
          note: `Scheduled auto-save failed: ${stripeErr.message || "Card declined"}`,
          createdAt: new Date(),
        });

        await vault.save();
        failCount++;
        results.push({
          vaultId: vault._id,
          status: "FAILED",
          reason: stripeErr.message,
        });
      }
    } catch (vaultErr: any) {
      console.error(`Error processing vault ${vault._id}:`, vaultErr.message);
      failCount++;
      results.push({
        vaultId: vault._id,
        status: "FAILED",
        reason: vaultErr.message,
      });
    }
  }

    return NextResponse.json({
      success: true,
      processed: dueVaults.length,
      succeeded: successCount,
      failed: failCount,
      results,
    });
  } catch (error: any) {
    console.error("GET /api/cron/pull error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to execute cron pull" },
      { status: 500 }
    );
  }
}
