import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Vault } from "@/models/Vault";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    await connectToDatabase();
    const { token } = await context.params;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Token is required" },
        { status: 400 }
      );
    }

    // Find the active vault that matches this single-use unlock token
    const vault = await Vault.findOne({ unlockToken: token });

    if (!vault) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This single-use Keyholder link has already been used, expired, or is invalid.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, vault });
  } catch (error: any) {
    console.error("GET /api/unlock/[token] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve tokenized vault" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    await connectToDatabase();
    const { token } = await context.params;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Token is required" },
        { status: 400 }
      );
    }

    const vault = await Vault.findOne({ unlockToken: token });

    if (!vault) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This single-use decision link is no longer valid or has already been submitted.",
        },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { action } = body;

    if (!["APPROVE", "DENY"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "Action must be either APPROVE or DENY" },
        { status: 400 }
      );
    }

    if (action === "APPROVE") {
      vault.status = "UNLOCKED";
      vault.unlockToken = null; // Invalidate single-use token immediately

      vault.transactions.unshift({
        amount: vault.currentBalance,
        type: "WITHDRAWAL",
        status: "SUCCESS",
        createdAt: new Date(),
        note: `Keyholder ${vault.keyholder.name} authorized release`,
      });
    } else if (action === "DENY") {
      vault.status = "LOCKED";
      vault.unlockToken = null; // Invalidate single-use token immediately
      // Accumulate protected savings
      vault.totalProtected = (vault.totalProtected || 0) + (vault.currentBalance || 0);

      vault.transactions.unshift({
        amount: 0,
        type: "SIMULATED_PULL",
        status: "SUCCESS",
        createdAt: new Date(),
        note: `Keyholder ${vault.keyholder.name} rejected impulse break! 🛡️ Savings safe`,
      });
    }

    await vault.save();

    return NextResponse.json({
      success: true,
      message:
        action === "DENY"
          ? "Impulse withdrawal blocked! Funds remain locked and protected."
          : "Withdrawal approved. Funds have been unlocked.",
      vault,
    });
  } catch (error: any) {
    console.error("POST /api/unlock/[token] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process Keyholder decision" },
      { status: 500 }
    );
  }
}
