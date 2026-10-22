import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Vault } from "@/models/Vault";
import { User } from "@/models/User";
import { sendKeyholderPinRecoveryEmail } from "@/lib/resend";
import { getRequestOrigin } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { token, unlockToken, inviteToken, vaultId, lang = "en" } = body;

    const queryToken = inviteToken || token;
    let vault = null;

    if (queryToken) {
      vault = await Vault.findOne({ inviteToken: queryToken });
    }
    if (!vault && (unlockToken || token)) {
      vault = await Vault.findOne({ unlockToken: unlockToken || token });
    }
    if (!vault && vaultId) {
      vault = await Vault.findById(vaultId);
    }

    if (!vault) {
      return NextResponse.json(
        { success: false, error: "Associated vault was not found." },
        { status: 404 }
      );
    }

    const keyholderEmail = vault.keyholderEmail || vault.keyholder?.email;
    if (!keyholderEmail) {
      return NextResponse.json(
        { success: false, error: "No email address registered for this Keyholder." },
        { status: 400 }
      );
    }

    let ownerName = "Your Friend";
    if (vault.userId) {
      const owner = await User.findById(vault.userId).select("name");
      if (owner?.name) ownerName = owner.name;
    }

    const friendName = vault.keyholder?.name || vault.keyholderName || "Friend";
    const origin = getRequestOrigin(req);
    const recoveryUrl = `${origin}/keyholder/invite/${vault.inviteToken}?action=recover`;

    const emailResult = await sendKeyholderPinRecoveryEmail({
      to: keyholderEmail.trim(),
      keyholderName: friendName,
      applicantName: ownerName,
      goalTitle: vault.title,
      recoveryUrl,
      isArabic: lang === "ar",
    });

    if (!emailResult.success) {
      return NextResponse.json(
        { success: false, error: emailResult.error || "Failed to dispatch recovery email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Recovery link sent to ${keyholderEmail}`,
      recipient: keyholderEmail,
    });
  } catch (error: any) {
    console.error("POST /api/keyholder/recover error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process recovery request" },
      { status: 500 }
    );
  }
}
