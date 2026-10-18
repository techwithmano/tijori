import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { connectToDatabase } from "@/lib/db";
import { Vault } from "@/models/Vault";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { vaultId, amount = 20 } = body;

    if (!vaultId) {
      return NextResponse.json(
        { success: false, error: "vaultId is required" },
        { status: 400 }
      );
    }

    const vault = await Vault.findById(vaultId);
    if (!vault) {
      return NextResponse.json(
        { success: false, error: "Vault not found" },
        { status: 404 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const depositAmount = Number(amount) || 20;

    // Create Stripe Checkout Session in payment mode
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd", // Universally supported across all Stripe test configurations
            product_data: {
              name: `Tijori Micro-Deposit: ${vault.title}`,
              description: `Automated recurring micro-pull (+${depositAmount} KWD) into time-locked vault`,
            },
            unit_amount: Math.round(depositAmount * 100), // Amount in cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${appUrl}/?deposit=success&vaultId=${vault._id}&amount=${depositAmount}`,
      cancel_url: `${appUrl}/?deposit=cancel`,
      metadata: {
        vaultId: String(vault._id),
        amount: String(depositAmount),
      },
    });

    return NextResponse.json({
      success: true,
      url: session.url,
      sessionId: session.id,
    });
  } catch (error: any) {
    console.error("POST /app/api/stripe/checkout error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
