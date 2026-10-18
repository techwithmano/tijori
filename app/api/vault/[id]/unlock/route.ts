import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Vault } from "@/models/Vault";
import { ai } from "@/lib/gemini";
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
    const { action, reason, excuse, realityCheck: incomingRoast } = body;
    const finalReason = reason || excuse || "Impulse withdrawal request";

    if (!["REQUEST", "APPROVE", "DENY", "LOCK"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "Invalid action. Must be REQUEST, APPROVE, or DENY" },
        { status: 400 }
      );
    }

    let unlockUrl = "";
    let token = "";
    let realityCheck = incomingRoast || "";
    let whatsappUrl = "";

    if (action === "REQUEST") {
      vault.status = "UNLOCK_PENDING";
      token = crypto.randomUUID();
      vault.unlockToken = token;
      vault.unlockReason = finalReason;
      vault.breakExcuse = finalReason;

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      unlockUrl = `${appUrl}/unlock/${token}`;

      // Generate Gemini reality check roast if not already supplied
      if (!realityCheck) {
        try {
          if (process.env.GEMINI_API_KEY) {
            const prompt = `You are "Tijori" (تِجوري)—a witty, ruthless, yet caring GCC financial intervention AI designed to cure impulse spending among young adults (18-28) in Kuwait and the Gulf.
The user is attempting to prematurely break open their locked savings vault:
- Goal: "${vault.title}"
- Current Progress: ${vault.currentBalance} KWD saved out of ${vault.targetAmount} KWD target.
- User's Stated Excuse: "${finalReason}"
- Designated Keyholder: "${vault.keyholder.name}"

TASK:
Write a sharp, brutally honest, culturally hilarious reality check in EXACTLY TWO SENTENCES calling out their excuse. Reference GCC habits (e.g., 4 KWD specialty Spanish lattes, Avenues shopping sprees, chalet weekends, designer sneakers). Remind them that ${vault.keyholder.name} will not approve this. Respond ONLY with the two sentences.`;

            const aiRes = await ai.models.generateContent({
              model: "gemini-2.5-flash",
              contents: prompt,
            });
            realityCheck = aiRes.text?.trim() || "";
          }
        } catch (err: any) {
          console.warn("Gemini call in unlock route failed, using fallback:", err.message);
        }

        if (!realityCheck) {
          realityCheck = `Breaking your ${vault.title} savings for "${finalReason}" is peak lack of discipline. ${vault.keyholder.name} was chosen as your Keyholder specifically to block moments of weakness like this.`;
        }
      }

      vault.realityCheck = realityCheck;

      whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
        `Salam! I am trying to break my Tijori savings vault early for "${vault.title}". My reason: "${finalReason}". Approve or block me here: ${unlockUrl}`
      )}`;

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
      realityCheck: realityCheck || null,
      whatsappUrl: whatsappUrl || null,
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
