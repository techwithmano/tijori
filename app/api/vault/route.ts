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
        vaults: [],
        vault: null,
        user: null,
      });
    }

    const user = await User.findById(session.userId).select("-password");
    let vaults = await Vault.find({ userId: session.userId }).sort({ createdAt: -1 });

    if (!vaults || vaults.length === 0) {
      const starterVault = await Vault.create({
        userId: session.userId,
        title: "Japan Summer Trip",
        titleAr: "سفرة الصيف - اليابان",
        targetAmount: 500,
        currentBalance: 125,
        pullAmount: 25,
        targetDate: new Date(Date.now() + 90 * 86400000),
        cadence: "weekly",
        currency: "KWD",
        keyholder: {
          name: "Ahmed Al-Mutawa",
          phone: "+965 9988 7766",
          relationship: "Best Friend",
          avatar: "A",
        },
        keyholderName: "Ahmed Al-Mutawa",
        keyholderNameAr: "أحمد المطوع",
        keyholderPhone: "+965 9988 7766",
        keyholderPin: "123456",
        status: "LOCKED",
        unlockMethod: "FRIEND_APPROVAL",
        streakCount: 18,
        streakDays: 18,
        totalProtected: 0,
        denialsCount: 0,
        penaltyFeeRate: 0.15,
        friendFeeRate: 0.05,
        transactions: [
          {
            type: "SCHEDULED_PULL",
            amount: 75,
            status: "SUCCESS",
            createdAt: new Date(Date.now() - 7 * 86400000),
            note: "Salary day automated pull",
          },
          {
            type: "SIMULATED_PULL",
            amount: 25,
            status: "SUCCESS",
            createdAt: new Date(Date.now() - 3 * 86400000),
            note: "Impulse resistance deposit (+25 KWD)",
          },
          {
            type: "STRIPE_DEPOSIT",
            amount: 25,
            status: "SUCCESS",
            createdAt: new Date(Date.now() - 1 * 86400000),
            note: "Weekend saver micro-pull",
          },
        ],
      });
      vaults = [starterVault];
    }

    return NextResponse.json({
      success: true,
      vaults: vaults || [],
      vault: vaults[0] || null,
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

    // Enforce maximum 5 active vaults per user
    const activeVaultsCount = await Vault.countDocuments({
      userId: session.userId,
      status: { $ne: "UNLOCKED" },
    });

    if (activeVaultsCount >= 5) {
      return NextResponse.json(
        {
          success: false,
          error: "Maximum limit of 5 active vaults reached. Please complete or unlock an existing vault before creating a new one.",
        },
        { status: 400 }
      );
    }

    const body = await req.json();
    const {
      title,
      targetAmount,
      pullAmount,
      cadence = "weekly",
      customCadenceDays = 7,
      incrementalSavingsType = "none",
      incrementalSavingsValue = 0,
      allowanceDay = 25,
      targetDate,
      keyholder,
      keyholderPin = "123456",
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

    // Calculate initial next pull date based on flexible cadence
    const initialNextPull = new Date();
    if (cadence === "daily") {
      initialNextPull.setDate(initialNextPull.getDate() + 1);
    } else if (cadence === "biweekly") {
      initialNextPull.setDate(initialNextPull.getDate() + 14);
    } else if (cadence === "monthly") {
      initialNextPull.setMonth(initialNextPull.getMonth() + 1);
    } else if (cadence === "custom") {
      const days = Math.max(1, Math.min(30, Number(customCadenceDays) || 7));
      initialNextPull.setDate(initialNextPull.getDate() + days);
    } else {
      initialNextPull.setDate(initialNextPull.getDate() + 7);
    }

    const cleanPin = String(keyholderPin || "123456").replace(/\D/g, "").slice(0, 6).padStart(6, "0");

    const newVault = await Vault.create({
      userId: session.userId,
      title: title.trim(),
      targetAmount: Number(targetAmount),
      currentBalance: 0,
      pullAmount: Number(pullAmount),
      cadence,
      customCadenceDays: Number(customCadenceDays) || 7,
      incrementalSavingsType: ["fixed", "percent", "none"].includes(incrementalSavingsType)
        ? incrementalSavingsType
        : "none",
      incrementalSavingsValue: Number(incrementalSavingsValue) || 0,
      allowanceDay: Math.max(1, Math.min(31, Number(allowanceDay) || 25)),
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
        relationship: keyholder.relationship?.trim() || "Best Friend",
      },
      keyholderPin: cleanPin,
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
