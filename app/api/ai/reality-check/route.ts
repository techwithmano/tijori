import { NextRequest, NextResponse } from "next/server";
import { ai } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
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

    const prompt = isArabic
      ? `أنت خبير توفير كويتي ذكي وساخر في منصة (تِجوري). وجّه كلامك مباشرة للمستخدم ("أنت") الذي يريد كسر خزينته لهدف "${goal}" ولديه فيها حالياً ${currentBalance} د.ك. عذره للكسر: "${excuse}". اسخر من عذره بلهجة كويتية/خليجية شبابية حقيقية بجملتين قصيرتين فقط وبدون فلسفة، وذكره بهدفه، وحذره من الإحراج مع رفيجه ${keyholderName}. استخدم د.ك.`
      : `You are Tijori's witty anti-impulse savings engine. Address the user directly as "You". The user is attempting to break their locked savings vault for "${goal}" (saved so far: ${currentBalance} KWD). Their excuse: "${excuse}". Roast their excuse in strictly 2 punchy, hilarious sentences in Gulf-flavored youth English with natural Kuwaiti slang (e.g. "Wallah", "ya rayal", "habibi", "cmon bro"). Remind them of their goal and warn them how ridiculous they will sound to their Keyholder ${keyholderName}. Use "KWD", never "KD".`;

    let realityCheck = "";

    try {
      if (process.env.GEMINI_API_KEY) {
        const callPromise = ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: prompt,
        });
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Gemini timeout")), 2500)
        );
        const response: any = await Promise.race([callPromise, timeoutPromise]);
        realityCheck = response.text?.trim() || "";
      }
    } catch (genError: any) {
      console.warn("Gemini API call failed or timed out, using intelligent GCC fallback:", genError?.message);
    }

    // High quality culturally authentic fallback if API key or rate limit triggers
    if (!realityCheck) {
      const cleanGoal = goal.replace(/🇯🇵/g, "").trim();
      if (isArabic) {
        const arFallbacks = [
          `يعني صدق بتطير ${currentBalance} د.ك عشان "${excuse}" وتنسى هدفك "${cleanGoal}"؟ اذكر الله وخلك قد كلمتك قبل لا تحرج نفسك مع ${keyholderName} بالواتساب.`,
          `يا صاحبي، "${excuse}" هذي قمة الصرف اللحظي وأنت توك ما كملت هدف "${cleanGoal}". حط الفون على جنب ولا تخلي ${keyholderName} يضحك عليك.`,
          `والله عيب تكسر خزينتك الحين عشان "${excuse}" وتضيع تعبك في ${currentBalance} د.ك. اثبت مكانك وخلك رجال قد التحدي!`,
        ];
        realityCheck = arFallbacks[Math.floor(Math.random() * arFallbacks.length)];
      } else {
        const enFallbacks = [
          `You really want to blow ${currentBalance} KWD on "${excuse}" when you're this close to "${cleanGoal}"? Put the phone down, your future self is cringing before ${keyholderName} even sees this.`,
          `Wallah bro, "${excuse}" is pure impulse talking over your ${currentBalance} KWD fund for "${cleanGoal}". Keep your dignity and let your vault stay locked before ${keyholderName} denies you anyway.`,
          `Ya rayal, think about "${cleanGoal}" before throwing away your streak over "${excuse}". Take a breath, put the card away, and let your money grow.`,
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
