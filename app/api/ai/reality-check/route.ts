import { NextRequest, NextResponse } from "next/server";
import { ai } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      excuse = "I just really need this right now",
      goal = "Japan Summer Trip 🇯🇵",
      currentBalance = 125,
      targetAmount = 500,
      keyholderName = "Fahad",
    } = body;

    const prompt = `You are "Tijori" (تِجوري)—a witty, ruthless, yet caring GCC financial intervention AI designed to cure impulse spending among young adults (18-28) in Kuwait, Saudi Arabia, and the Gulf.

The user is attempting to prematurely break open their locked savings vault!
- Savings Goal: "${goal}"
- Current Progress: ${currentBalance} KWD saved out of ${targetAmount} KWD target.
- User's Stated Excuse: "${excuse}"
- Designated Keyholder Friend: "${keyholderName}"

TASK:
Write a sharp, brutally honest, culturally hilarious reality check in EXACTLY TWO SENTENCES calling out their excuse. Reference GCC youth habits (e.g., 4 KWD daily specialty V60/Spanish lattes, luxury perfumes from Avenues/Al-Hamra, chalet weekend impulsive splits, designer drip, car valets). Remind them that ${keyholderName} will see right through this weak impulse. 

Respond ONLY with the two sentences. No preamble, no quotes, no markdown headers.`;

    let realityCheck = "";

    try {
      if (process.env.GEMINI_API_KEY) {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
        });

        realityCheck = response.text?.trim() || "";
      }
    } catch (genError: any) {
      console.warn("Gemini API call failed, using intelligent GCC fallback:", genError?.message);
    }

    // High quality intelligent fallback if API key or rate limit triggers
    if (!realityCheck) {
      const fallbacks = [
        `Breaking your ${goal} vault for "${excuse}" is peak lack of discipline—another 4 KWD iced matcha won't fix your lifestyle. ${keyholderName} will laugh you out of the diwaniya before ever clicking approve on this.`,
        `You've disciplined yourself to save ${currentBalance} KWD, and now you want to blow it on "${excuse}"? Good luck convincing ${keyholderName} that this impulse purchase is more important than your future.`,
        `Let's be completely real: "${excuse}" is just your dopamine craving looking for an exit before salary day. ${keyholderName} was chosen as your Keyholder specifically to protect you from moments of weakness like this.`,
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
          "Impulse trap detected. Your Keyholder has been notified to protect your hard-earned savings from another avoidable expense.",
      },
      { status: 500 }
    );
  }
}
