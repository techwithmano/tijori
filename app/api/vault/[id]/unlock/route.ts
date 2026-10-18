import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Vault } from "@/models/Vault";
import crypto from "crypto";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await context.params;

    const vault = await Vault.findById(id);
    if (!vault) {
      return NextResponse.json(
        { success: false, error: "Vault not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { action, reason, excuse, realityCheck } = body;
    const finalReason = reason || excuse || "Impulse withdrawal request";

    if (!["REQUEST", "APPROVE", "DENY", "LOCK"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "Invalid action. Must be REQUEST, APPROVE, or DENY" },
        { status: 400 }
      );
    }

    let unlockUrl = "";
    let token = "";

    if (action === "REQUEST") {
      vault.status = "UNLOCK_PENDING";
      token = crypto.randomUUID();
      vault.unlockToken = token;
      vault.unlockReason = finalReason;
      vault.breakExcuse = finalReason;
      if (realityCheck) vault.realityCheck = realityCheck;

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      unlockUrl = `${appUrl}/unlock/${token}`;

      vault.transactions.unshift({
        amount: 0,
        type: "WITHDRAWAL",
        status: "PENDING_KEYHOLDER",
        createdAt: new Date(),
        note: `Unlock requested: "${finalReason}"`,
      });
    } else if (action === "APPROVE") {
      vault.status = "UNLOCKED";
      vault.unlockToken = null; // Invalidate single-use token

      vault.transactions.unshift({
        amount: vault.currentBalance,
        type: "WITHDRAWAL",
        status: "APPROVED_RELEASED",
        createdAt: new Date(),
        note: `Keyholder ${vault.keyholder.name} authorized full withdrawal ✅`,
      });
    } else if (action === "DENY") {
      vault.status = "LOCKED";
      vault.unlockToken = null; // Invalidate single-use token
      vault.totalProtected = (vault.totalProtected || 0) + (vault.currentBalance || 0);

      vault.transactions.unshift({
        amount: 0,
        type: "SIMULATED_PULL",
        status: "INTERVENED_PROTECTED",
        createdAt: new Date(),
        note: `Keyholder ${vault.keyholder.name} blocked withdrawal! 🛡️ Savings safe`,
      });
    } else if (action === "LOCK") {
      vault.status = "LOCKED";
      vault.unlockToken = null;
    }

    await vault.save();

    return NextResponse.json({
      success: true,
      message: `Vault status updated to ${vault.status}`,
      token: token || null,
      unlockUrl: unlockUrl || null,
      vault,
    });
  } catch (error: any) {
    console.error("POST /api/vault/[id]/unlock error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update vault unlock status" },
      { status: 500 }
    );
  }
}
