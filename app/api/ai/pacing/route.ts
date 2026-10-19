import { NextRequest, NextResponse } from "next/server";
import { ai } from "@/lib/gemini";

export interface PacingItem {
  week: number;
  label: string;
  amount: number;
  phase: "SURGE" | "STEADY" | "LEAN" | "CUSHION";
  rationale: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      targetAmount = 500,
      currentBalance = 125,
      pullAmount = 25,
      allowanceDay = 25,
    } = body;

    const remaining = Math.max(0, targetAmount - currentBalance);

    const prompt = `You are a behavioral finance pacing engine for GCC youth.
Goal: Accumulate ${remaining} KWD remaining balance.
Base weekly pull: ${pullAmount} KWD.
User's monthly allowance/salary deposit day: ${allowanceDay}th of each month.

In the GCC, young adults experience high liquidity right after day ${allowanceDay} (university I'ana allowance or corporate salary), followed by a steep drop by day 18-24. 
Calibrate a 4-week dynamic micro-pull schedule adjusting the savings pull amounts according to this psychological cashflow cycle:
- Week 1 (Right after day ${allowanceDay}): "Post-Allowance Surge" (30-50% higher than base pull).
- Week 2: "Steady State" (around base pull).
- Week 3: "Mid-Month Lean" (slightly reduced pull to prevent budget stress).
- Week 4 (Days before next allowance): "Pre-Allowance Cushion" (minimum micro-pull to keep habit alive without feeling broke).

Output strictly a valid JSON array of 4 objects with this exact structure, with NO extra markdown formatting or backticks if possible:
[
  {
    "week": 1,
    "label": "Post-Allowance Surge",
    "amount": 40,
    "phase": "SURGE",
    "rationale": "Liquidity is peak right after salary drops. Lock funds before lifestyle inflation."
  },
  ...
]`;

    let schedule: PacingItem[] | null = null;

    try {
      if (process.env.GEMINI_API_KEY) {
        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: prompt,
        });

        const rawText = response.text?.trim() || "";
        // Clean markdown code fence if present
        const jsonMatch = rawText.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (jsonMatch) {
          schedule = JSON.parse(jsonMatch[0]);
        }
      }
    } catch (genError: any) {
      console.warn("Gemini pacing generation failed, fallback applied:", genError?.message);
    }

    if (!schedule || !Array.isArray(schedule) || schedule.length === 0) {
      const base = Number(pullAmount) || 25;
      schedule = [
        {
          week: 1,
          label: "Post-Allowance Surge",
          amount: Math.round(base * 1.6),
          phase: "SURGE",
          rationale: `Allowance hits on day ${allowanceDay}. Capture maximum surplus while bank balance is fresh.`,
        },
        {
          week: 2,
          label: "Steady Discipline",
          amount: base,
          phase: "STEADY",
          rationale: "Predictable automated cadence maintaining steady savings momentum.",
        },
        {
          week: 3,
          label: "Mid-Month Lean",
          amount: Math.max(5, Math.round(base * 0.7)),
          phase: "LEAN",
          rationale: "Easing pressure as social weekend outings and dining peak.",
        },
        {
          week: 4,
          label: "Pre-Allowance Cushion",
          amount: Math.max(5, Math.round(base * 0.5)),
          phase: "CUSHION",
          rationale: "Micro-commitments keep the habit alive before next month's salary refill.",
        },
      ];
    }

    return NextResponse.json({
      success: true,
      schedule,
    });
  } catch (error: any) {
    console.error("POST /api/ai/pacing error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate pacing schedule" },
      { status: 500 }
    );
  }
}
