/**
 * lib/resend.ts
 * Clean Resend email integration for Tijori (تِجوري)
 * Sends branded, high-conversion Keyholder PIN invitation emails.
 */

const RESEND_API_URL = "https://api.resend.com/emails";

export interface SendKeyholderInviteParams {
  to: string;
  keyholderName: string;
  applicantName: string;
  goalTitle: string;
  targetAmount: number | string;
  inviteUrl: string;
  isArabic?: boolean;
}

export async function sendKeyholderInviteEmail(params: SendKeyholderInviteParams) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn("sendKeyholderInviteEmail: RESEND_API_KEY is not defined in environment.");
    return { success: false, error: "RESEND_API_KEY is not configured." };
  }

  const {
    to,
    keyholderName,
    applicantName,
    goalTitle,
    targetAmount,
    inviteUrl,
    isArabic = false,
  } = params;

  const subject = isArabic
    ? `🔐 ${applicantName} اختارك لتكون حامل المفتاح في تِجوري`
    : `🔐 ${applicantName} chose you as their Keyholder on Tijori`;

  const formattedAmount = `${Number(targetAmount).toFixed(3)} KWD`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="${isArabic ? "ar" : "en"}" dir="${isArabic ? "rtl" : "ltr"}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #FAF8F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #14102B;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 520px; margin: 0 auto; background-color: #FFFFFF; border: 2px solid #14102B; border-radius: 20px; box-shadow: 4px 4px 0 #14102B; overflow: hidden;">
    <!-- Header -->
    <tr>
      <td style="padding: 24px 28px; background-color: #CFFF3A; border-bottom: 2px solid #14102B;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td>
              <span style="display: inline-block; padding: 6px 12px; background-color: #14102B; color: #FFFFFF; font-weight: 900; font-size: 16px; border-radius: 10px; letter-spacing: -0.5px;">
                🔑 Tijori • تِجوري
              </span>
            </td>
            <td align="${isArabic ? "left" : "right"}">
              <span style="font-size: 12px; font-weight: 800; color: #14102B; text-transform: uppercase;">
                ${isArabic ? "دعوة رسمية" : "Official Invite"}
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="padding: 32px 28px;">
        <h1 style="margin: 0 0 12px 0; font-size: 24px; font-weight: 900; color: #14102B; line-height: 1.25;">
          ${
            isArabic
              ? `سلام يا ${keyholderName}!`
              : `Salam ${keyholderName}!`
          }
        </h1>

        <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #4B4668;">
          ${
            isArabic
              ? `قام <strong>${applicantName}</strong> بإنشاء خزينة توفير مقفلة لهدف <strong>"${goalTitle}"</strong> بمبلغ <strong>${formattedAmount}</strong>، واختارك لتكون <strong>حامل المفتاح</strong> وحارس التزامه المالي لمنع الصرف الاندفاعي.`
              : `<strong>${applicantName}</strong> has created a locked savings vault for <strong>"${goalTitle}"</strong> (${formattedAmount}) and chose you as their trusted <strong>Keyholder</strong> to keep them accountable!`
          }
        </p>

        <!-- Goal Box -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 0 0 24px 0; background-color: #F3EFFE; border: 2px solid #14102B; border-radius: 14px; padding: 16px;">
          <tr>
            <td style="padding: 6px 12px; font-size: 13px; font-weight: 700; color: #6B4DFF;">
              ${isArabic ? "هدف التوفير:" : "Savings Goal:"}
            </td>
            <td align="${isArabic ? "left" : "right"}" style="padding: 6px 12px; font-size: 14px; font-weight: 900; color: #14102B;">
              ${goalTitle}
            </td>
          </tr>
          <tr>
            <td style="padding: 6px 12px; font-size: 13px; font-weight: 700; color: #6B4DFF;">
              ${isArabic ? "المبلغ المستهدف:" : "Target Goal:"}
            </td>
            <td align="${isArabic ? "left" : "right"}" style="padding: 6px 12px; font-size: 14px; font-weight: 900; color: #6B4DFF;">
              ${formattedAmount}
            </td>
          </tr>
        </table>

        <!-- Security Notice -->
        <div style="margin: 0 0 28px 0; padding: 14px 16px; background-color: #FAF8F5; border: 1.5px dashed #14102B; border-radius: 12px; font-size: 13px; line-height: 1.5; color: #14102B;">
          <strong>${isArabic ? "🔒 سرية تامة:" : "🔒 Strict Privacy:"}</strong>
          ${
            isArabic
              ? `أنت وحدك من سيحدد الرمز السري (PIN) المكوّن من ٦ أرقام. <strong>${applicantName} لن يعرف هذا الرمز أبداً</strong>، ولن يتمكن من كسر الخزينة مبكراً إلا بموافقتك وطلب هذا الرمز منك.`
              : `You will choose your own secret 6-digit approval PIN. <strong>${applicantName} will NEVER see this PIN</strong>, ensuring they cannot break their vault early without your genuine permission.`
          }
        </div>

        <!-- CTA Button -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 0 0 24px 0;">
          <tr>
            <td align="center">
              <a href="${inviteUrl}" target="_blank" style="display: block; width: 100%; box-sizing: border-box; text-align: center; padding: 16px 24px; background-color: #CFFF3A; color: #14102B; font-size: 16px; font-weight: 900; text-decoration: none; border: 2px solid #14102B; border-radius: 14px; box-shadow: 3px 3px 0 #14102B;">
                ${isArabic ? "ضع رقمك السري لتثبيت المفتاح 🔐" : "Set Your Secret Keyholder PIN 🔐"}
              </a>
            </td>
          </tr>
        </table>

        <!-- Fallback Link -->
        <p style="margin: 0; font-size: 11px; line-height: 1.5; color: #8F8AA8; text-align: center; word-break: break-all;">
          ${isArabic ? "أو افتح الرابط مباشرة:" : "Or open this link directly:"}<br>
          <a href="${inviteUrl}" style="color: #6B4DFF; font-weight: 700;">${inviteUrl}</a>
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding: 16px 28px; background-color: #FAF8F5; border-top: 2px solid #14102B; text-align: center; font-size: 11px; font-weight: 600; color: #8F8AA8;">
        Tijori (تِجوري) • Anti-Impulse Discipline Protocol • Kuwait
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const VERIFIED_ACCOUNT_MAILBOX = "abdukhogali1@gmail.com";
  const cleanTo = (to || "").trim();
  const fromAddress = process.env.RESEND_FROM_EMAIL?.trim() || "Tijori <onboarding@resend.dev>";

  try {
    // 1. First attempt: Send to intended recipient using configured from address
    let res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [cleanTo],
        subject,
        html: htmlContent,
      }),
    });

    let data = await res.json();

    // 2. Check if Resend blocked third-party delivery due to free-tier sandbox restrictions (HTTP 403 or 422:
    // "You can only send testing emails to your own email address (abdukhogali1@gmail.com)...")
    const isSandboxRestriction =
      !res.ok &&
      (res.status === 403 || res.status === 422) &&
      typeof data.message === "string" &&
      (data.message.includes("You can only send testing emails") || data.message.includes("resend.com/domains"));

    if (isSandboxRestriction) {
      console.warn(
        `Resend sandbox restriction for ${cleanTo}: ${data.message}. Sending preview copy to account owner ${VERIFIED_ACCOUNT_MAILBOX}...`
      );

      const testModeBanner = `
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 0 0 20px 0; background-color: #FEF3C7; border: 2px solid #14102B; border-radius: 12px; padding: 12px 16px;">
          <tr>
            <td style="font-size: 12px; font-weight: 700; color: #14102B; line-height: 1.5;">
              🧪 <strong>Tijori Test Delivery:</strong> Delivered directly to your verified mailbox (<strong>${VERIFIED_ACCOUNT_MAILBOX}</strong>).<br>
              Intended Keyholder: <strong>${keyholderName}</strong> (${cleanTo})<br>
              <em>To deliver directly to external friends via Resend, verify a custom domain at resend.com/domains.</em>
            </td>
          </tr>
        </table>
      `;

      const modifiedHtml = htmlContent.replace(
        '<!-- Body -->\n    <tr>\n      <td style="padding: 32px 28px;">',
        '<!-- Body -->\n    <tr>\n      <td style="padding: 32px 28px;">\n' + testModeBanner
      );

      try {
        await fetch(RESEND_API_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Tijori <onboarding@resend.dev>",
            to: [VERIFIED_ACCOUNT_MAILBOX],
            subject: `${subject} [Sandbox Test Preview]`,
            html: modifiedHtml,
          }),
        });
      } catch (previewErr) {
        console.error("Failed to deliver sandbox preview copy:", previewErr);
      }

      // Explicitly return sandboxRestriction so the frontend/app can notify user and provide direct WhatsApp/Copy link!
      return {
        success: false,
        sandboxRestriction: true,
        deliveredToOwnerSandbox: true,
        recipient: cleanTo,
        error: `Resend Sandbox Mode: Direct delivery to ${cleanTo} requires a verified domain in Resend. A preview was sent to ${VERIFIED_ACCOUNT_MAILBOX}. Share the private invite link directly with ${keyholderName}.`,
      };
    }

    if (!res.ok) {
      console.warn("Resend API warning:", data);
      return { success: false, error: data.message || "Failed to send email via Resend" };
    }

    console.log(`Resend email successfully dispatched to ${cleanTo} with id: ${data.id}`);
    return { success: true, id: data.id, recipient: cleanTo };
  } catch (err: any) {
    console.error("sendKeyholderInviteEmail network error:", err);
    return { success: false, error: err.message || "Network error sending email via Resend" };
  }
}
