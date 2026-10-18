import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { Vault } from "@/models/Vault";
import { hashPassword, createSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { name, email, password, phone, allowanceDay } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: "Name, email, and password are required" },
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
    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      phone: phone ? phone.trim() : "",
      allowanceDay: Number(allowanceDay) || 25,
    });

    // Seed an initial starter vault for immediate testability
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 90);

    await Vault.create({
      userId: user._id,
      title: "Japan Summer Trip 🇯🇵",
      targetAmount: 600,
      currentBalance: 75,
      pullAmount: 25,
      cadence: "weekly",
      allowanceDay: user.allowanceDay || 25,
      targetDate: futureDate,
      status: "LOCKED",
      totalProtected: 50,
      keyholder: {
        name: "Fahad Al-Mutawa",
        phone: "+965 9988 7766",
        relationship: "Best Friend / Diwaniya Bro",
      },
      transactions: [
        {
          amount: 25,
          type: "SCHEDULED_PULL",
          status: "SUCCESS",
          createdAt: new Date(),
          note: "Weekly micro-pull deposit #3",
        },
        {
          amount: 25,
          type: "SCHEDULED_PULL",
          status: "SUCCESS",
          createdAt: new Date(Date.now() - 7 * 86400000),
          note: "Weekly micro-pull deposit #2",
        },
        {
          amount: 25,
          type: "SCHEDULED_PULL",
          status: "SUCCESS",
          createdAt: new Date(Date.now() - 14 * 86400000),
          note: "Initial Tuck - Welcome to Tijori",
        },
      ],
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
