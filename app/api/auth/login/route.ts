import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { comparePassword, createSession } from "@/lib/auth";

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
    const user = await User.findOne({ email: cleanEmail });

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
