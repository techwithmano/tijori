import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { Vault } from "@/models/Vault";
import { hashPassword, createSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const demoEmail = "demo@tijori.app";
    const demoPassword = "password123";
    const hashedPassword = await hashPassword(demoPassword);

    let user = await User.findOne({ email: demoEmail });

    if (!user) {
      user = await User.create({
        name: "Abdulrahman Haramain",
        email: demoEmail,
        password: hashedPassword,
        phone: "+965 9900 1122",
        allowanceDay: 25,
        preferredLang: "en",
      });
    } else {
      user.name = "Abdulrahman Haramain";
      user.password = hashedPassword;
      user.allowanceDay = 25;
      user.preferredLang = "en";
      await user.save();
    }

    // Seed or reset active demo vault
    let vault = await Vault.findOne({ userId: user._id });

    const targetDate = new Date("2027-06-15T00:00:00.000Z");

    const seedTransactions = [
      {
        amount: 25,
        type: "SCHEDULED_PULL" as const,
        status: "SUCCESS" as const,
        note: "Allowance Tuck (Day-25 Auto-Save) 🚀",
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        amount: 20,
        type: "STRIPE_DEPOSIT" as const,
        status: "SUCCESS" as const,
        note: "KNET / Card Deposit (+20 KWD)",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        amount: 25,
        type: "SCHEDULED_PULL" as const,
        status: "SUCCESS" as const,
        note: "Weekly Discipline Tuck ⚡",
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        amount: 55,
        type: "SIMULATED_PULL" as const,
        status: "SUCCESS" as const,
        note: "Mid-Month Shielded Micro-Pull 🛡️",
        createdAt: new Date(),
      },
    ];

    if (!vault) {
      vault = await Vault.create({
        userId: user._id,
        title: "Japan Summer Trip 🇯🇵",
        targetAmount: 500,
        currentBalance: 125,
        totalProtected: 380,
        streakCount: 18,
        cadence: "weekly",
        pullAmount: 25,
        allowanceDay: 25,
        targetDate,
        status: "LOCKED",
        keyholder: {
          name: "Fahad Al-Mutawa",
          phone: "+965 9988 7766",
          relationship: "Brother",
        },
        transactions: seedTransactions,
      });
    } else {
      vault.title = "Japan Summer Trip 🇯🇵";
      vault.targetAmount = 500;
      vault.currentBalance = 125;
      vault.totalProtected = 380;
      vault.streakCount = 18;
      vault.cadence = "weekly";
      vault.pullAmount = 25;
      vault.allowanceDay = 25;
      vault.targetDate = targetDate;
      vault.status = "LOCKED";
      vault.unlockToken = null;
      vault.unlockReason = null;
      vault.keyholder = {
        name: "Fahad Al-Mutawa",
        phone: "+965 9988 7766",
        relationship: "Brother",
      };
      vault.transactions = seedTransactions;
      await vault.save();
    }

    const response = NextResponse.json({
      success: true,
      message: "Demo account seeded and logged in",
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        allowanceDay: user.allowanceDay,
        preferredLang: user.preferredLang,
      },
      vault: {
        id: vault._id.toString(),
        title: vault.title,
        currentBalance: vault.currentBalance,
        targetAmount: vault.targetAmount,
        totalProtected: vault.totalProtected,
        streakCount: vault.streakCount,
      },
    });

    createSession(response, user);
    return response;
  } catch (error: any) {
    console.error("POST /api/seed error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to seed demo database" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  // Allow GET /api/seed as a convenience endpoint
  return POST(req);
}
