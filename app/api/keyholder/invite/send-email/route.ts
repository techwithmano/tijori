import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Vault } from "@/models/Vault";
import { User } from "@/models/User";
import { sendKeyholderInviteEmail } from "@/lib/resend";
import { getRequestOrigin } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      to,
      keyholderName,
      applicantName: reqApplicantName,
      goalTitle: reqGoalTitle,
      targetAmount: reqTargetAmount,
      inviteUrl: reqInviteUrl,
      inviteToken,
      vaultId,
      lang = "en",
    } = body;

    let targetEmail = to;
    let friendName = keyholderName || "Friend";
    let ownerName = reqApplicantName || "Your Friend";
    let goal = reqGoalTitle || "Savings Goal";
    let amount = reqTargetAmount || 500;
    let finalInviteUrl = reqInviteUrl;

    // Look up vault if vaultId or inviteToken is provided
    if (vaultId || inviteToken) {
      await connectToDatabase();
      const vault = vaultId
        ? await Vault.findById(vaultId)
        : await Vault.findOne({ inviteToken });

      if (vault) {
        goal = vault.title;
        amount = vault.targetAmount;
        if (vault.keyholder?.name) friendName = vault.keyholder.name;
        if (vault.keyholder?.email && !targetEmail) targetEmail = vault.keyholder.email;
        if (vault.userId) {
          const owner = await User.findById(vault.userId).select("name");
          if (owner?.name) ownerName = owner.name;
        }
        if (!finalInviteUrl && vault.inviteToken) {
          const origin = getRequestOrigin(req);
          finalInviteUrl = `${origin}/keyholder/invite/${vault.inviteToken}`;
        }
      }
    }

    if (!targetEmail) {
      return NextResponse.json(
        { success: false, error: "Recipient email is required" },
        { status: 400 }
      );
    }

    // Fallback: Ensure valid invite URL if inviteToken was passed directly without vault lookup
    if (!finalInviteUrl && inviteToken) {
      const origin = getRequestOrigin(req);
      finalInviteUrl = `${origin}/keyholder/invite/${inviteToken}`;
    }

    if (!finalInviteUrl) {
      return NextResponse.json(
        { success: false, error: "Unable to generate keyholder invite URL" },
        { status: 400 }
      );
    }

    const emailResult = await sendKeyholderInviteEmail({
      to: targetEmail.trim(),
      keyholderName: friendName,
      applicantName: ownerName,
      goalTitle: goal,
      targetAmount: amount,
      inviteUrl: finalInviteUrl,
      isArabic: lang === "ar",
    });

    if (!emailResult.success) {
      if (emailResult.sandboxRestriction) {
        return NextResponse.json({
          success: false,
          sandboxRestriction: true,
          deliveredToOwnerSandbox: emailResult.deliveredToOwnerSandbox,
          error: emailResult.error,
          message:
            lang === "ar"
              ? "نطاق البريد في وضع الاختبار (Resend Sandbox). تم إرسال نسخة للمعاينة إلى بريدك المسجل."
              : "Email service is in test sandbox mode. A preview was sent to your registered email.",
        });
      }

      return NextResponse.json(
        { success: false, error: emailResult.error || "Failed to send email via Resend" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Keyholder invitation email sent to ${targetEmail}`,
      id: emailResult.id,
    });
  } catch (error: any) {
    console.error("POST /api/keyholder/invite/send-email error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process invite email" },
      { status: 500 }
    );
  }
}
