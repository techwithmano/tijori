import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Vault } from "@/models/Vault";

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

    let pullAmount = vault.pullAmount || 25;
    try {
      const body = await req.json();
      if (body && body.amount && !isNaN(Number(body.amount))) {
        pullAmount = Number(body.amount);
      }
    } catch {
      // Body is optional; default to vault.pullAmount
    }

    vault.currentBalance = Math.min(
      vault.targetAmount,
      (vault.currentBalance || 0) + pullAmount
    );

    // Prepend new transaction so latest is first
    vault.transactions.unshift({
      amount: pullAmount,
      type: "SIMULATED_PULL",
      status: "SUCCESS",
      createdAt: new Date(),
      note: "Judges Demo Micro-Pull (+25 KWD) ⚡",
    });

    await vault.save();

    return NextResponse.json({
      success: true,
      message: `Successfully pulled ${pullAmount} KWD into vault`,
      vault,
    });
  } catch (error: any) {
    console.error("POST /api/vault/[id]/pull error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to execute micro-pull" },
      { status: 500 }
    );
  }
}
