import { NextRequest, NextResponse } from "next/server";
import { ai } from "@/lib/gemini";
import { calculateSoloBreak, SOLO_FEE_PCT, FRIEND_FEE_PCT } from "@/lib/config";

// In-memory rate limiting map: ip -> array of timestamps
const rateLimitMap = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 5;

  const timestamps = rateLimitMap.get(ip) || [];
  const validTimestamps = timestamps.filter((t) => now - t < windowMs);

  if (validTimestamps.length >= maxRequests) {
    rateLimitMap.set(ip, validTimestamps);
    return true;
  }

  validTimestamps.push(now);
  rateLimitMap.set(ip, validTimestamps);
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    const body = await req.json();
    const {
      excuse = "Flash sneaker drop at 360 Mall",
      goal = "Japan Summer Trip",
      currentBalance = 125,
      targetAmount = 500,
      keyholderName = "Ahmed",
      lang = "en",
    } = body;

    const isArabic = lang === "ar";
    const { fee: soloFee } = calculateSoloBreak(Number(currentBalance) || 100);
    const soloFeeFormatted = soloFee.toFixed(3);
    const cleanGoal = String(goal).replace(/🇯🇵/g, "").trim();

    // Check rate limit: 5 requests per minute
    if (isRateLimited(ip)) {
      const fallbackRoast = isArabic
        ? `خف علينا يا الحبيب! طلبت مراجعات وايد بدقيقة وحدة. خلك مع هدفك "${cleanGoal}" ولا تدفع رسوم طوارئ ${SOLO_FEE_PCT}٪.`
        : `Slow down, habibi! You've triggered too many roasts this minute. Focus on "${cleanGoal}" instead of burning ${SOLO_FEE_PCT}% on emergency fees.`;
      return NextResponse.json({
        success: true,
        realityCheck: fallbackRoast,
        rateLimited: true,
      });
    }

    const prompt = isArabic
      ? `أنت خبير توفير كويتي ذكي وساخر في منصة (تِجوري). وجّه كلامك مباشرة للمستخدم ("أنت") الذي يريد كسر خزينته لهدف "${cleanGoal}" ولديه فيها حالياً ${currentBalance} د.ك. كسر الخزينة يكلّفه رسوم طوارئ ${SOLO_FEE_PCT}٪ (${soloFeeFormatted} د.ك تؤخذ كرسوم) أو ${FRIEND_FEE_PCT}٪ إذا وافق رفيجه ${keyholderName}. عذره للكسر: "${excuse}". اسخر من عذره بلهجة كويتية/خليجية شبابية حقيقية بجملتين قصيرتين فقط وبدون فلسفة، وذكره بهدفه وبرسوم الطوارئ ${SOLO_FEE_PCT}٪، وحذره من الإحراج مع رفيجه ${keyholderName}. استخدم د.ك.`
      : `You are Tijori's witty savings advisor. Address the user directly as "You". The user is attempting to break their locked savings vault for "${cleanGoal}" (saved so far: ${currentBalance} KWD). Breaking early incurs a ${SOLO_FEE_PCT}% emergency fee (${soloFeeFormatted} KWD kept as a fee) or a ${FRIEND_FEE_PCT}% fee if their friend ${keyholderName} approves. Their excuse: "${excuse}". Roast their excuse in strictly 2 punchy, hilarious sentences in Gulf-flavored youth English with natural Kuwaiti slang (e.g. "Wallah", "ya rayal", "habibi", "cmon bro"). Warn them about losing ${soloFeeFormatted} KWD as a ${SOLO_FEE_PCT}% emergency fee or sounding ridiculous to their Keyholder ${keyholderName}. Use "KWD", never "KD".`;

    let realityCheck = "";

    try {
      if (process.env.GEMINI_API_KEY) {
        const callPromise = ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
        });
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Gemini timeout")), 3000)
        );
        const response: any = await Promise.race([callPromise, timeoutPromise]);
        realityCheck = response.text?.trim() || "";
      }
    } catch (genError: any) {
      console.warn("Gemini API call failed or timed out, using intelligent GCC fallback:", genError?.message);
    }

    // High quality culturally authentic fallback if API key or timeout triggers
    if (!realityCheck) {
      if (isArabic) {
        const arFallbacks = [
          `يعني صدق بتطير فلوسك وتدفع رسوم طوارئ ${SOLO_FEE_PCT}٪ (${soloFeeFormatted} د.ك) عشان "${excuse}" وتنسى هدفك "${cleanGoal}"؟ اذكر الله وخلك قد كلمتك قبل لا تحرج نفسك مع ${keyholderName}.`,
          `يا صاحبي، "${excuse}" بتكلفك رسوم طوارئ ${SOLO_FEE_PCT}٪ (${soloFeeFormatted} د.ك) تؤخذ كرسوم من تعبك لهدف "${cleanGoal}". حط الفون على جنب ولا تخلي ${keyholderName} يضحك عليك.`,
          `والله حسافة تخسر ${SOLO_FEE_PCT}٪ كرسوم طوارئ من تعبك في ${currentBalance} د.ك عشان "${excuse}". اثبت مكانك وخلك رجال قد التحدي!`,
        ];
        realityCheck = arFallbacks[Math.floor(Math.random() * arFallbacks.length)];
      } else {
        const enFallbacks = [
          `You really want to blow ${currentBalance} KWD on "${excuse}" and surrender a ${SOLO_FEE_PCT}% emergency fee (${soloFeeFormatted} KWD) when you're this close to "${cleanGoal}"? Put the phone down, your future self is cringing before ${keyholderName} even sees this.`,
          `Wallah bro, "${excuse}" is pure impulse talking—you'll lose ${SOLO_FEE_PCT}% (${soloFeeFormatted} KWD kept as a fee) on your ${currentBalance} KWD fund for "${cleanGoal}". Keep your dignity and let your vault stay locked before ${keyholderName} denies you anyway.`,
          `Ya rayal, think about "${cleanGoal}" before throwing away ${SOLO_FEE_PCT}% in emergency fees over "${excuse}". Take a breath, put the card away, and let your money grow.`,
        ];
        realityCheck = enFallbacks[Math.floor(Math.random() * enFallbacks.length)];
      }
    }

    return NextResponse.json({
      success: true,
      realityCheck,
    });
  } catch (error: any) {
    console.error("POST /api/ai/reality-check error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to generate reality check",
        realityCheck:
          "Wallah bro, think about your goal before blowing your savings on temporary urges. Put the phone down and keep it locked!",
      },
      { status: 500 }
    );
  }
}
