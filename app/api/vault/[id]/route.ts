import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Vault } from "@/models/Vault";

export async function GET(
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

    return NextResponse.json({ success: true, vault });
  } catch (error: any) {
    console.error("GET /api/vault/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch vault" },
      { status: 500 }
    );
  }
}
