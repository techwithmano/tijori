import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { Vault } from "@/models/Vault";
import { hashPassword, comparePassword, createSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    let user = await User.findOne({ email: cleanEmail });

    // Auto-provision demo account if judge uses demo credentials
    if (!user && cleanEmail === "demo@tijori.app" && password === "password123") {
      const hashedPassword = await hashPassword("password123");
      user = await User.create({
        name: "Abdulrahman Al-Mutawa",
        email: "demo@tijori.app",
        password: hashedPassword,
        phone: "+965 9988 7766",
        allowanceDay: 25,
      });

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 90);

      await Vault.create({
        userId: user._id,
        title: "Japan Summer Trip 🇯🇵",
        targetAmount: 600,
        currentBalance: 75,
        pullAmount: 25,
        cadence: "weekly",
        allowanceDay: 25,
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
    }

    if (!user || !user.password) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: "Logged in successfully",
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        allowanceDay: user.allowanceDay,
      },
    });

    return createSession(response, user);
  } catch (error: any) {
    console.error("POST /api/auth/login error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to log in" },
      { status: 500 }
    );
  }
}
