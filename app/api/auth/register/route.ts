import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { hashPassword, createSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: "First name, email, and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);

    // Create Stripe Customer
    let stripeCustomerId: string | null = null;
    try {
      if (process.env.STRIPE_SECRET_KEY) {
        const { stripe } = await import("@/lib/stripe");
        const customer = await stripe.customers.create({
          name: name.trim(),
          email: cleanEmail,
          metadata: { app: "tijori" },
        });
        stripeCustomerId = customer.id;
      }
    } catch (stripeErr) {
      console.error("Failed to create Stripe customer during signup:", stripeErr);
    }

    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      allowanceDay: 25,
      stripeCustomerId,
    });

    const response = NextResponse.json({
      success: true,
      message: "Account created successfully",
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        allowanceDay: user.allowanceDay,
      },
    });

    return createSession(response, user);
  } catch (error: any) {
    console.error("POST /api/auth/register error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create account" },
      { status: 500 }
    );
  }
}
