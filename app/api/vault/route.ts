import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Vault } from "@/models/Vault";
import { User } from "@/models/User";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getCurrentUser(req);

    if (!session?.userId) {
      return NextResponse.json({
        success: true,
        vault: null,
        user: null,
      });
    }

    const user = await User.findById(session.userId).select("-password");
    const vault = await Vault.findOne({ userId: session.userId }).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      vault: vault || null,
      user: user || {
        id: session.userId,
        name: session.name,
        email: session.email,
        allowanceDay: 25,
      },
    });
  } catch (error: any) {
    console.error("GET /api/vault error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch vault" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getCurrentUser(req);

    if (!session?.userId) {
      return NextResponse.json(
        { success: false, error: "Authentication required to create a vault" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      title,
      targetAmount,
      pullAmount,
      cadence = "weekly",
      allowanceDay = 25,
      targetDate,
      keyholder,
    } = body;

    if (!title || !targetAmount || !pullAmount || !keyholder?.name || !keyholder?.phone) {
      return NextResponse.json(
        { success: false, error: "Missing required vault parameters" },
        { status: 400 }
      );
    }

    // Default target date to 6 months from now if omitted
    const calculatedTargetDate = targetDate
      ? new Date(targetDate)
      : new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);

    // Calculate initial next pull date
    const initialNextPull = new Date();
    if (cadence === "daily") initialNextPull.setDate(initialNextPull.getDate() + 1);
    else if (cadence === "biweekly") initialNextPull.setDate(initialNextPull.getDate() + 14);
    else if (cadence === "monthly") initialNextPull.setMonth(initialNextPull.getMonth() + 1);
    else initialNextPull.setDate(initialNextPull.getDate() + 7);

    const newVault = await Vault.create({
      userId: session.userId,
      title: title.trim(),
      targetAmount: Number(targetAmount),
      currentBalance: 0,
      pullAmount: Number(pullAmount),
      cadence,
      allowanceDay: Number(allowanceDay) || 25,
      status: "LOCKED",
      targetDate: calculatedTargetDate,
      nextPullAt: initialNextPull,
      needsAttention: false,
      processedPaymentIntents: [],
      totalProtected: 0,
      streakCount: 0,
      keyholder: {
        name: keyholder.name.trim(),
        phone: keyholder.phone.trim(),
        relationship: keyholder.relationship?.trim() || "Friend",
      },
      transactions: [],
    });

    return NextResponse.json({ success: true, vault: newVault }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/vault error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create vault" },
      { status: 500 }
    );
  }
}
