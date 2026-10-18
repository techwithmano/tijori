import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Vault } from "@/models/Vault";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { User } = await import("@/models/User");
    const session = await getCurrentUser(req);

    let vault = null;
    let user = null;

    if (session?.userId) {
      vault = await Vault.findOne({ userId: session.userId }).sort({ createdAt: -1 });
      user = await User.findById(session.userId).select("-password");
    }

    // Default to the official demo user vault if not logged in
    if (!vault) {
      const demoUser = await User.findOne({ email: "demo@tijori.app" });
      if (demoUser) {
        vault = await Vault.findOne({ userId: demoUser._id }).sort({ createdAt: -1 });
        if (!user) user = demoUser;
      }
    }

    // Auto-seed default demo vault if still none exists in the database
    if (!vault) {
      const now = Date.now();
      vault = await Vault.create({
        userId: session?.userId || undefined,
        title: "Japan Summer Trip 🇯🇵",
        targetAmount: 500,
        currentBalance: 125,
        pullAmount: 25,
        cadence: "weekly",
        allowanceDay: 25,
        status: "LOCKED",
        totalProtected: 380,
        streakCount: 18,
        keyholder: {
          name: "Fahad Al-Mutawa",
          phone: "+965 9988 7766",
          relationship: "Brother",
        },
        targetDate: new Date("2027-06-15T00:00:00.000Z"),
        transactions: [
          {
            amount: 25,
            type: "SCHEDULED_PULL",
            status: "SUCCESS",
            createdAt: new Date(now - 3 * 24 * 60 * 60 * 1000),
            note: "Allowance Tuck (Day-25 Auto-Save) 🚀",
          },
          {
            amount: 10,
            type: "STRIPE_DEPOSIT",
            status: "SUCCESS",
            createdAt: new Date(now - 2 * 24 * 60 * 60 * 1000),
            note: "KNET Quick Boost (+10 KWD)",
          },
          {
            amount: 25,
            type: "SCHEDULED_PULL",
            status: "SUCCESS",
            createdAt: new Date(now - 1 * 24 * 60 * 60 * 1000),
            note: "Weekly Discipline Tuck ⚡",
          },
          {
            amount: 65,
            type: "SIMULATED_PULL",
            status: "SUCCESS",
            createdAt: new Date(),
            note: "Mid-Month Shielded Micro-Pull 🛡️",
          },
        ],
      });
      console.log("Seeded default demo vault:", vault._id);
    }

    if (session?.userId && !user) {
      const { User } = await import("@/models/User");
      user = await User.findById(session.userId).select("-password");
    }

    return NextResponse.json({
      success: true,
      vault,
      user: user || {
        name: session?.name || "Abdulrahman Haramain",
        email: session?.email || "demo@tijori.app",
        allowanceDay: 25,
        preferredLang: "en",
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

    if (!title || !targetAmount || !pullAmount || !targetDate || !keyholder?.name || !keyholder?.phone) {
      return NextResponse.json(
        { success: false, error: "Missing required vault parameters" },
        { status: 400 }
      );
    }

    const newVault = await Vault.create({
      userId: session?.userId || undefined,
      title,
      targetAmount: Number(targetAmount),
      currentBalance: 0,
      pullAmount: Number(pullAmount),
      cadence,
      allowanceDay: Number(allowanceDay),
      status: "LOCKED",
      targetDate: new Date(targetDate),
      keyholder: {
        name: keyholder.name,
        phone: keyholder.phone,
        relationship: keyholder.relationship || "Guardian",
      },
      transactions: [
        {
          amount: Number(pullAmount),
          type: "SCHEDULED_PULL",
          status: "SUCCESS",
          createdAt: new Date(),
          note: "Initial Tuck - Welcome to Tijori",
        },
      ],
    });

    // Also update current balance to initial deposit
    newVault.currentBalance = Number(pullAmount);
    await newVault.save();

    return NextResponse.json({ success: true, vault: newVault }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/vault error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create vault" },
      { status: 500 }
    );
  }
}
