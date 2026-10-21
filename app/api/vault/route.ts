import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Vault } from "@/models/Vault";
import { User } from "@/models/User";
import { getCurrentUser } from "@/lib/auth";
import { sendKeyholderInviteEmail } from "@/lib/resend";
import { getRequestOrigin } from "@/lib/utils";

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
    const rawVaults = await Vault.find({ userId: session.userId }).sort({ createdAt: -1 });

    // Derive streak server-side from real ledger transactions: consecutive succeeded scheduled saves since last break
    const vaults = (rawVaults || []).map((v) => {
      const vObj = v.toObject ? v.toObject() : v;
      let streak = 0;
      const sortedTxs = [...(vObj.transactions || [])].sort(
        (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      for (const tx of sortedTxs) {
        if (tx.type === "BREAK_REFUND" || tx.type === "DISCIPLINE_FEE") {
          break; // break resets streak
        }
        if (tx.type === "SCHEDULED_PULL" && (tx.status === "SUCCESS" || tx.status === "COMPLETED")) {
          streak++;
        }
      }
      vObj.streakCount = streak;
      return vObj;
    });

    return NextResponse.json({
      success: true,
      vaults: vaults,
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
      keyholderPin,
      inviteToken: incomingInviteToken,
    } = body;

    if (!title || !targetAmount || !pullAmount) {
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

    const inviteToken = incomingInviteToken || crypto.randomUUID();
    const cleanPin = keyholderPin
      ? String(keyholderPin).replace(/\D/g, "").slice(0, 6).padStart(6, "0")
      : "123456";

    const khName = keyholder?.name?.trim() || "Ahmed";
    const khEmail = keyholder?.email?.trim() || "";
    const khPhone = keyholder?.phone?.trim() || "";
    const khRel = keyholder?.relationship?.trim() || "Best Friend";

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
        name: khName,
        phone: khPhone,
        email: khEmail,
        relationship: khRel,
      },
      keyholderName: khName,
      keyholderEmail: khEmail || null,
      keyholderPhone: khPhone || null,
      keyholderPin: cleanPin,
      inviteToken,
      keyholderInviteAccepted: false,
      transactions: [],
    });

    // Auto-dispatch Resend email invite if email is provided
    if (khEmail) {
      const owner = await User.findById(session.userId).select("name");
      const ownerName = owner?.name || session.name || "Your Friend";
      const origin = getRequestOrigin(req);
      const inviteUrl = `${origin}/keyholder/invite/${inviteToken}`;
      const isArabic = body.lang === "ar";

      try {
        await sendKeyholderInviteEmail({
          to: khEmail,
          keyholderName: khName,
          applicantName: ownerName,
          goalTitle: title.trim(),
          targetAmount: Number(targetAmount),
          inviteUrl,
          isArabic,
        });
      } catch (err) {
        console.error("Auto sendKeyholderInviteEmail error:", err);
      }
    }

    return NextResponse.json({ success: true, vault: newVault }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/vault error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create vault" },
      { status: 500 }
    );
  }
}
