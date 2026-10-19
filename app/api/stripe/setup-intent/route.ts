import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { getCurrentUser } from "@/lib/auth";
import { stripe, getOrCreateStripeCustomer, isStripeTestMode } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser(req);
    if (!session) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { success: false, error: "STRIPE_SECRET_KEY is not configured in environment" },
        { status: 500 }
      );
    }

    await connectToDatabase();
    const user = await User.findById(session.userId);
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const customerId = await getOrCreateStripeCustomer(user);

    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      usage: "off_session",
      payment_method_types: ["card"],
    });

    return NextResponse.json({
      success: true,
      clientSecret: setupIntent.client_secret,
      setupIntentId: setupIntent.id,
      isTestMode: isStripeTestMode,
      publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
    });
  } catch (error: any) {
    console.error("POST /api/stripe/setup-intent error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create setup intent" },
      { status: 500 }
    );
  }
}
