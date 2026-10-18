import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Vault } from "@/models/Vault";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getCurrentUser(req);

    let query: any = {};
    if (session?.userId) {
      query = { userId: session.userId };
    }

    // Find the most recent active or created vault for this user (or global latest fallback)
    let vault = await Vault.findOne(query).sort({ createdAt: -1 });

    // Fallback to any recent vault if user has none yet
    if (!vault && session?.userId) {
      vault = await Vault.findOne().sort({ createdAt: -1 });
    }

    // Auto-seed default demo vault if none exists in the database
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
        totalProtected: 50,
        keyholder: {
          name: "Fahad Al-Mutawa",
          phone: "+965 9988 7766",
          relationship: "Best Friend / Diwaniya Bro",
        },
        targetDate: new Date(now + 90 * 24 * 60 * 60 * 1000), // 3 months out
        transactions: [
          {
            amount: 50,
            type: "SIMULATED_PULL",
            status: "SUCCESS",
            createdAt: new Date(now - 2 * 24 * 60 * 60 * 1000),
            note: "Allowance Tuck post-salary surge ⚡",
          },
          {
            amount: 50,
            type: "SCHEDULED_PULL",
            status: "SUCCESS",
            createdAt: new Date(now - 7 * 24 * 60 * 60 * 1000),
            note: "Weekly disciplined micro-pull",
          },
          {
            amount: 25,
            type: "SCHEDULED_PULL",
            status: "SUCCESS",
            createdAt: new Date(now - 14 * 24 * 60 * 60 * 1000),
            note: "Initial Tuck - Welcome to Tijori",
          },
        ],
      });
      console.log("Seeded default demo vault:", vault._id);
    }

    let user = null;
    if (session?.userId) {
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
