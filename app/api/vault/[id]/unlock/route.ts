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
    const { action = "REQUEST", reason, excuse, realityCheck: incomingRoast } = body;
    const finalReason = excuse || reason || "Impulse withdrawal request";

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
        const keyholderFirstName = vault.keyholder?.name ? vault.keyholder.name.split(" ")[0] : "Fahad";
        const cleanGoal = vault.title.replace(/🇯🇵/g, "").trim() || "Japan Summer Trip";
        const applicantName = "Abdulrahman";

        try {
          if (process.env.GEMINI_API_KEY) {
            const prompt = `You are writing an alert to ${keyholderFirstName}, whose friend ${applicantName} is trying to break his savings vault for "${cleanGoal}" (current balance: ${vault.currentBalance} KWD). ${applicantName}'s excuse: "${finalReason}". Tell ${keyholderFirstName} why ${applicantName}'s excuse is ridiculous and tell ${keyholderFirstName} to do his job as Keyholder and deny the request. Keep it strictly to 2 short, punchy sentences in Gulf-flavored English with touches of Arabic/Arabizi (e.g., "Wallah", "ya rayal", "habibi"). Use "KWD", never "KD".`;

            const aiRes = await ai.models.generateContent({
              model: "gemini-3.8-flash",
              contents: prompt,
            });
            realityCheck = aiRes.text?.trim() || "";
          }
        } catch (err: any) {
          console.warn("Gemini call in unlock route failed, using fallback:", err.message);
        }

        if (!realityCheck) {
          const fallbacks = [
            `Wallah ${applicantName} wants to blow ${vault.currentBalance} KWD on sneakers at 360 Mall instead of going to ${cleanGoal || "Tokyo"}? Do your job as his brother, ${keyholderFirstName}—hit Deny and save him from himself.`,
            `Ya rayal, ${applicantName} really thinks "${finalReason}" justifies raiding his ${cleanGoal} savings right before salary day? Lock it down, ${keyholderFirstName}, don't let him slip into regret.`,
            `Habibi ${keyholderFirstName}, ${applicantName}'s excuse of "${finalReason}" is pure impulse talking over his ${vault.currentBalance} KWD fund. Hit Deny right now and protect his discipline.`,
          ];
          realityCheck = fallbacks[Math.floor(Math.random() * fallbacks.length)];
        }
      }

      vault.realityCheck = realityCheck;

      whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
        `Salam ${vault.keyholder.name.split(" ")[0]}! I am trying to break my Tijori savings vault for ${vault.title}. My reason: "${finalReason}". Approve or block me here: ${unlockUrl}`
      )}`;

      const guardianFirstName = vault.keyholder?.name ? vault.keyholder.name.split(" ")[0] : "Fahad";
      vault.transactions.unshift({
        amount: 0,
        type: "BREAK_REQUEST",
        status: "PENDING",
        createdAt: new Date(),
        note: `🚨 Break Requested (Pending ${guardianFirstName}'s Approval)`,
      });
    } else if (action === "APPROVE") {
      vault.status = "UNLOCKED";
      vault.unlockToken = null; // Invalidate single-use token

      vault.transactions.unshift({
        amount: vault.currentBalance,
        type: "WITHDRAWAL",
        status: "SUCCESS",
        createdAt: new Date(),
        note: `Keyholder ${vault.keyholder.name} authorized release`,
      });
    } else if (action === "DENY") {
      vault.status = "LOCKED";
      vault.unlockToken = null; // Invalidate single-use token
      vault.totalProtected = (vault.totalProtected || 0) + (vault.currentBalance || 0);

      vault.transactions.unshift({
        amount: 0,
        type: "SIMULATED_PULL",
        status: "SUCCESS",
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
