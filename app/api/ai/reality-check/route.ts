import { NextRequest, NextResponse } from "next/server";
import { ai } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      excuse = "Flash sneaker drop at 360 Mall and it ends tonight",
      goal = "Japan Summer Trip 🇯🇵",
      currentBalance = 125,
      targetAmount = 500,
      keyholderName = "Fahad",
      applicantName = "Abdulrahman",
    } = body;

    const prompt = `You are writing an alert to ${keyholderName}, whose friend ${applicantName} is trying to break his savings vault for "${goal}" (current balance: ${currentBalance} KWD). ${applicantName}'s excuse: "${excuse}". Tell ${keyholderName} why ${applicantName}'s excuse is ridiculous and tell ${keyholderName} to do his job as Keyholder and deny the request. Keep it strictly to 2 short, punchy sentences in Gulf-flavored English with touches of Arabic/Arabizi (e.g., "Wallah", "ya rayal", "habibi"). Use "KWD", never "KD".`;

    let realityCheck = "";

    try {
      if (process.env.GEMINI_API_KEY) {
        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: prompt,
        });

        realityCheck = response.text?.trim() || "";
      }
    } catch (genError: any) {
      console.warn("Gemini API call failed, using intelligent GCC fallback:", genError?.message);
    }

    // High quality culturally authentic fallback if API key or rate limit triggers
    if (!realityCheck) {
      const cleanGoal = goal.replace(/🇯🇵/g, "").trim();
      const fallbacks = [
        `Wallah ${applicantName} wants to blow ${currentBalance} KWD on sneakers at 360 Mall instead of going to ${cleanGoal || "Tokyo"}? Do your job as his brother, ${keyholderName}—hit Deny and save him from himself.`,
        `Ya rayal, ${applicantName} really thinks "${excuse}" justifies raiding his ${cleanGoal} savings right before salary day? Lock it down, ${keyholderName}, don't let him slip into regret.`,
        `Habibi ${keyholderName}, ${applicantName}'s excuse of "${excuse}" is pure impulse talking over his ${currentBalance} KWD fund. Hit Deny right now and protect his discipline.`,
      ];
      realityCheck = fallbacks[Math.floor(Math.random() * fallbacks.length)];
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
          "Wallah Abdulrahman wants to blow 125 KWD on impulse spending instead of his goal? Do your job as his Keyholder, Fahad—hit Deny and save him from himself.",
      },
      { status: 500 }
    );
  }
}
