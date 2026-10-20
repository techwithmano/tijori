import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Vault } from "@/models/Vault";
import { getCurrentUser } from "@/lib/auth";

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

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const session = await getCurrentUser(req);

    if (!session?.userId) {
      return NextResponse.json(
        { success: false, error: "Authentication required to remove goal" },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const vault = await Vault.findById(id);

    if (!vault) {
      return NextResponse.json(
        { success: false, error: "Goal not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (String(vault.userId) !== String(session.userId)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized access to goal" },
        { status: 403 }
      );
    }

    // Anti-Impulse Discipline Check:
    // If the vault has active locked savings (> 0 KWD) and is still LOCKED,
    // prevent direct bypass without completing the discipline protocol.
    if (vault.currentBalance > 0 && vault.status === "LOCKED") {
      return NextResponse.json(
        {
          success: false,
          error:
            "This goal currently has active locked funds. To maintain financial discipline, you must unlock or empty the vault before removing it.",
        },
        { status: 400 }
      );
    }

    await Vault.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "Goal successfully removed",
      vaultId: id,
    });
  } catch (error: any) {
    console.error("DELETE /api/vault/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to remove goal" },
      { status: 500 }
    );
  }
}
