import { NextRequest, NextResponse } from "next/server";
import { ai, getGemini } from "@/lib/gemini";
import { calculateSoloBreak, SOLO_FEE_PCT, FRIEND_FEE_PCT } from "@/lib/config";

// In-memory rate limiting map: ip -> array of timestamps
const rateLimitMap = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 10;

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

// Common female names and relationship cues
const FEMALE_NAMES = new Set([
  "sara", "sarah", "noura", "nora", "fatima", "fatema", "fatemah", "maryam", "mariam",
  "dana", "danah", "haya", "reem", "lulwa", "dalal", "shaikha", "sheikha", "munira",
  "rawan", "asma", "zahra", "zahraa", "shahad", "hessa", "hissa", "anoud", "alanoud",
  "fajer", "abrar", "malak", "ghadeer", "maha", "manal", "farah", "taiba", "layla",
  "laila", "abeer", "hanan", "eman", "imane", "bashayer", "shorouq", "judy", "zainab",
  "سارة", "ساره", "نورة", "نوره", "فاطمة", "فاطمه", "مريم", "دانة", "دانه", "هيا",
  "ريم", "لولوة", "لولوه", "دلال", "شيخة", "شيخه", "منيرة", "منيره", "روان", "أسماء",
  "زهراء", "شهد", "حصة", "حصه", "العنود", "فجر", "أبرار", "ملاك", "غدير", "مها",
  "منال", "فرح", "طيبة", "طيبه", "ليلى", "عبير", "حنان", "إيمان", "بشاير", "شروق", "زينب"
]);

const MALE_NAMES = new Set([
  "ahmed", "ahmad", "mohammed", "mohammad", "ali", "abdullah", "abdallah", "fahad",
  "salem", "hamad", "abdulrahman", "abdulaziz", "omar", "yousef", "youssef", "jaber",
  "mishari", "mishaal", "nawaf", "nasser", "bader", "talal", "jarrah", "khalid", "khaled",
  "أحمد", "احمد", "محمد", "علي", "عبدالله", "فهد", "سالم", "حمد", "عبدالرحمن",
  "عبدالعزيز", "عمر", "يوسف", "جابر", "مشاري", "مشعل", "نواف", "ناصر", "بدر", "طلال",
  "جراح", "خالد"
]);

function inferGender(
  genderParam?: string,
  userName?: string,
  relationship?: string
): "female" | "male" | "neutral" {
  if (genderParam === "female" || genderParam === "girl") return "female";
  if (genderParam === "male" || genderParam === "guy") return "male";

  // Check relationship if provided
  const rel = (relationship || "").toLowerCase();
  if (/sister|mother|wife|daughter|أخت|اخت|والدة|ام|زوجة|ابنة|بنت/.test(rel)) return "female";
  if (/brother|father|husband|son|أخ|اخ|والد|اب|زوج|ابن|ولد/.test(rel)) return "male";

  // Check user name
  const rawName = (userName || "").trim().toLowerCase();
  const firstName = rawName.split(/\s+/)[0];
  if (firstName) {
    if (FEMALE_NAMES.has(firstName)) return "female";
    if (MALE_NAMES.has(firstName)) return "male";
    // Arabic feminine noun ending indicators (taa marbuta)
    if (firstName.endsWith("ة") || (firstName.endsWith("ه") && firstName.length > 3)) {
      return "female";
    }
  }

  return "neutral";
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
      userName = "",
      gender = "auto",
      relationship = "",
      lang = "en",
    } = body;

    const isArabic = lang === "ar";
    const detectedGender = inferGender(gender, userName, relationship);
    const { fee: soloFee } = calculateSoloBreak(Number(currentBalance) || 100);
    const soloFeeFormatted = soloFee.toFixed(3);
    const cleanGoal = String(goal).replace(/🇯🇵/g, "").trim();

    // Check rate limit: 10 requests per minute
    if (isRateLimited(ip)) {
      let fallbackRoast = "";
      if (isArabic) {
        if (detectedGender === "female") {
          fallbackRoast = `خفي علينا يا الحبيبة! طلبتِ مراجعات وايد بدقيقة وحدة. خلك مع هدفج "${cleanGoal}" ولا تدفعين رسوم طوارئ ${SOLO_FEE_PCT}٪.`;
        } else if (detectedGender === "male") {
          fallbackRoast = `خف علينا يا الحبيب! طلبت مراجعات وايد بدقيقة وحدة. خلك مع هدفك "${cleanGoal}" ولا تدفع رسوم طوارئ ${SOLO_FEE_PCT}٪.`;
        } else {
          fallbackRoast = `خفوا علينا شوي! طلبات مراجعة وايد بدقيقة وحدة. خلك مع هدف "${cleanGoal}" ولا تدفع رسوم طوارئ ${SOLO_FEE_PCT}٪.`;
        }
      } else {
        if (detectedGender === "female") {
          fallbackRoast = `Slow down, girl! You've triggered too many roasts this minute. Focus on "${cleanGoal}" instead of burning ${SOLO_FEE_PCT}% on emergency fees.`;
        } else if (detectedGender === "male") {
          fallbackRoast = `Slow down, habibi! You've triggered too many roasts this minute. Focus on "${cleanGoal}" instead of burning ${SOLO_FEE_PCT}% on emergency fees.`;
        } else {
          fallbackRoast = `Slow down a bit! You've triggered too many reality checks this minute. Stay focused on "${cleanGoal}" instead of burning ${SOLO_FEE_PCT}% on emergency fees.`;
        }
      }

      return NextResponse.json({
        success: true,
        realityCheck: fallbackRoast,
        rateLimited: true,
      });
    }

    // Build Gender-Specific Instructions
    let genderInstruction = "";
    if (detectedGender === "female") {
      genderInstruction = isArabic
        ? `المستخدم أنثى (بنت/امرأة) ${userName ? `واسمها "${userName}"` : ""}. خاطبها بصيغة المؤنث حصراً وبلهجة كويتية بناتية ذكية وساخرة (مثل: شلونج، يا بنت الحلال، خفي علينا يا الحبيبة، رفيجتج ${keyholderName}، خزينتج، هدفج، لا تضيعين تعبج، فكري بهدفج، اثبتي مكانج وخليج قد التحدي). إياك ثم إياك أن تخاطبها بصيغة المذكر أو تقول "خلك رجال" أو "يا صاحبي" أو "يا الحبيب".`
        : `The user is a female ${userName ? `named "${userName}"` : ""}. Address her strictly using natural feminine framing and modern Kuwaiti youth English slang (e.g., "habibti", "girl", "sister", "queen"). Warn her about having to ask her friend/keyholder ${keyholderName} for approval. Never use male-only slang like "bro", "ya rayal", "my guy", or "man up".`;
    } else if (detectedGender === "male") {
      genderInstruction = isArabic
        ? `المستخدم ذكر (شاب/رجل) ${userName ? `واسمه "${userName}"` : ""}. خاطبه بصيغة المذكر بلهجة كويتية شبابية ساخرة واقعية (مثل: شلونك، يا الحبيب، يا بوفلان، خف علينا، رفيجك ${keyholderName}، خزينتك، هدفك، لا تضيع تعبك، اثبت مكانك وخلك قد التحدي).`
        : `The user is a male ${userName ? `named "${userName}"` : ""}. Address him using natural Kuwaiti youth English slang (e.g., "habibi", "bro", "ya rayal", "my guy"). Warn him about facing his friend/keyholder ${keyholderName}.`;
    } else {
      genderInstruction = isArabic
        ? `الجنس غير مؤكد أو غير محدد (قد يكون شاباً أو فتاة). بما أنك غير متأكد من جنس المستخدم، فيجب عليك حصراً وتأكيداً صياغة الرد بأسلوب محايد عام يناسب الجميع دون أي صيغة مذكر أو مؤنث حصرية (مثال: "اذكر الله وفكر بهدفك وبالمبلغ اللي تعبت عليه"، "ليش تخسر رسوم طوارئ عشان هالعذر؟"، "حط الفون على جنب واحفظ فلوسك"). تجنب تماماً الألفاظ الذكورية أو المؤنثة الحصرية مثل "خلك رجال" أو "يا صاحبي" أو "يا الحبيب" أو "شلونج" أو "يا بنت الحلال".`
        : `The user's gender is unspecified, ambiguous, or uncertain (could be female or male). Because you are unsure of their gender, you MUST strictly formulate a completely gender-neutral response that works universally for anyone. Focus on financial discipline, their goal "${cleanGoal}", and the cost without assuming gender. Strictly avoid gendered terms like "bro", "my guy", "man up", "ya rayal", "girl", "habibti", or "sister".`;
    }

    const prompt = isArabic
      ? `أنت خبير توفير كويتي ذكي وساخر جداً في منصة (تِجوري).
${genderInstruction}
وجّه كلامك مباشرة للمستخدم ("أنتِ" أو "أنت") الذي يريد كسر خزينته لهدف "${cleanGoal}" ولديه فيها حالياً ${currentBalance} د.ك.
كسر الخزينة بيكلّفه رسوم طوارئ انفرادية ${SOLO_FEE_PCT}٪ (${soloFeeFormatted} د.ك تؤخذ كرسوم فورية) أو ${FRIEND_FEE_PCT}٪ إذا وافق حامل المفتاح (${keyholderName}).
عذره للكسر: "${excuse}".
المطلوب منك: اسخر من عذره بلهجة كويتية شعبية حقيقية ذكية ومضحكة في جملتين قصيرتين فقط وبدون مقدمات، وذكره بهدفه وبرسوم الطوارئ ${SOLO_FEE_PCT}٪ (${soloFeeFormatted} د.ك)، وحذره من الإحراج مع ${keyholderName}. استخدم عملة "د.ك".`
      : `You are Tijori's witty, culturally authentic Kuwaiti savings advisor.
${genderInstruction}
Address the user directly. The user wants to break their locked savings vault for "${cleanGoal}" (saved so far: ${currentBalance} KWD).
Breaking early costs a ${SOLO_FEE_PCT}% emergency fee (${soloFeeFormatted} KWD kept as a fee) or a ${FRIEND_FEE_PCT}% fee if their Keyholder ${keyholderName} approves.
Their excuse: "${excuse}".
Roast their excuse in strictly 2 punchy, hilarious sentences in Gulf youth English with natural Kuwaiti slang. Warn them about losing ${soloFeeFormatted} KWD (${SOLO_FEE_PCT}% emergency fee) or embarrassing themselves in front of ${keyholderName}. Use "KWD", never "KD".`;

    let realityCheck = "";

    // Call Gemini API with fast models and reasonable timeout
    if (process.env.GEMINI_API_KEY && getGemini()) {
      const modelsToTry = ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-3.8-flash"];

      for (const model of modelsToTry) {
        try {
          const callPromise = ai.models.generateContent({
            model,
            contents: prompt,
          });

          // 6.5s timeout per model attempt
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Gemini timeout")), 6500)
          );

          const response: any = await Promise.race([callPromise, timeoutPromise]);
          const generatedText = response.text?.trim();

          if (generatedText) {
            realityCheck = generatedText;
            break;
          }
        } catch (err: any) {
          console.warn(`Gemini model ${model} attempt failed:`, err?.message || err);
        }
      }
    }

    // High quality culturally authentic and GENDER-AWARE fallback
    if (!realityCheck) {
      if (isArabic) {
        if (detectedGender === "female") {
          const femaleFallbacks = [
            `يعني صدق بتطيرين فلوسج وتدفعين رسوم طوارئ ${SOLO_FEE_PCT}٪ (${soloFeeFormatted} د.ك) عشان "${excuse}" وتنسين هدفج "${cleanGoal}"؟ خفي علينا يا الحبيبة، فكري ألف مرة قبل لا تنحرجين جدام ${keyholderName}!`,
            `يا أختي، "${excuse}" بتكلفج رسوم طوارئ ${SOLO_FEE_PCT}٪ (${soloFeeFormatted} د.ك) تروح هدر من تعبج على "${cleanGoal}". حطي الفون على جنب ولا تخلين ${keyholderName} تضحك عليج!`,
            `والله حسافة تخسرين ${SOLO_FEE_PCT}٪ كرسوم طوارئ من تعبج بـ ${currentBalance} د.ك عشان "${excuse}". اثبتي مكانج وخليج قد التحدي!`,
          ];
          realityCheck = femaleFallbacks[Math.floor(Math.random() * femaleFallbacks.length)];
        } else if (detectedGender === "male") {
          const maleFallbacks = [
            `يعني صدق بتطير فلوسك وتدفع رسوم طوارئ ${SOLO_FEE_PCT}٪ (${soloFeeFormatted} د.ك) عشان "${excuse}" وتنسى هدفك "${cleanGoal}"؟ اذكر الله وخلك قد كلمتك قبل لا تحرج نفسك مع ${keyholderName}!`,
            `يا الحبيب، "${excuse}" بتكلفك رسوم طوارئ ${SOLO_FEE_PCT}٪ (${soloFeeFormatted} د.ك) تؤخذ كرسوم من تعبك لهدف "${cleanGoal}". حط الفون على جنب ولا تخلي ${keyholderName} يضحك عليك!`,
            `والله حسافة تخسر ${SOLO_FEE_PCT}٪ كرسوم طوارئ من تعبك في ${currentBalance} د.ك عشان "${excuse}". اثبت مكانك وخلك قد التحدي!`,
          ];
          realityCheck = maleFallbacks[Math.floor(Math.random() * maleFallbacks.length)];
        } else {
          const neutralFallbacks = [
            `يعني صدق بتطير فلوسك وتدفع رسوم طوارئ ${SOLO_FEE_PCT}٪ (${soloFeeFormatted} د.ك) عشان "${excuse}" وتنسى هدف "${cleanGoal}"؟ اذكر الله وفكر عدل قبل لا تضيع التعب!`,
            `"${excuse}" بتكلف رسوم طوارئ ${SOLO_FEE_PCT}٪ (${soloFeeFormatted} د.ك) تؤخذ كرسوم فورية من مدخرات "${cleanGoal}". حط الفون على جنب واحفظ فلوسك قبل لا تنحرج مع ${keyholderName}!`,
            `والله حسافة تضيع ${SOLO_FEE_PCT}٪ كرسوم طوارئ من تعب ${currentBalance} د.ك عشان "${excuse}". فكر بهدفك وخلك قد التحدي!`,
          ];
          realityCheck = neutralFallbacks[Math.floor(Math.random() * neutralFallbacks.length)];
        }
      } else {
        if (detectedGender === "female") {
          const femaleEnFallbacks = [
            `You really want to blow ${currentBalance} KWD on "${excuse}" and surrender a ${SOLO_FEE_PCT}% emergency fee (${soloFeeFormatted} KWD) when you're this close to "${cleanGoal}"? Girl, put the card down, your future self is screaming before ${keyholderName} even sees this!`,
            `Wallah habibti, "${excuse}" is pure impulse talking—you'll burn ${SOLO_FEE_PCT}% (${soloFeeFormatted} KWD kept as a fee) on your ${currentBalance} KWD fund for "${cleanGoal}". Keep your goal safe and don't let ${keyholderName} catch you slipping!`,
            `Think about "${cleanGoal}" before throwing away ${SOLO_FEE_PCT}% in emergency fees over "${excuse}". Take a breath, close the app, and protect your savings!`,
          ];
          realityCheck = femaleEnFallbacks[Math.floor(Math.random() * femaleEnFallbacks.length)];
        } else if (detectedGender === "male") {
          const maleEnFallbacks = [
            `You really want to blow ${currentBalance} KWD on "${excuse}" and surrender a ${SOLO_FEE_PCT}% emergency fee (${soloFeeFormatted} KWD) when you're this close to "${cleanGoal}"? Bro, put the phone down before ${keyholderName} roasts you.`,
            `Wallah bro, "${excuse}" is pure impulse talking—you'll lose ${SOLO_FEE_PCT}% (${soloFeeFormatted} KWD kept as a fee) on your ${currentBalance} KWD fund for "${cleanGoal}". Keep your dignity and let your vault stay locked!`,
            `Ya rayal, think about "${cleanGoal}" before throwing away ${SOLO_FEE_PCT}% in emergency fees over "${excuse}". Take a breath, put the card away, and let your money grow.`,
          ];
          realityCheck = maleEnFallbacks[Math.floor(Math.random() * maleEnFallbacks.length)];
        } else {
          const neutralEnFallbacks = [
            `You really want to blow ${currentBalance} KWD on "${excuse}" and surrender a ${SOLO_FEE_PCT}% emergency fee (${soloFeeFormatted} KWD) when you're this close to "${cleanGoal}"? Put the card down and think twice before throwing away your savings!`,
            `Spending ${currentBalance} KWD on "${excuse}" means burning a ${SOLO_FEE_PCT}% emergency fee (${soloFeeFormatted} KWD kept as a fee) on your "${cleanGoal}" fund. Keep the vault locked and protect your progress before facing ${keyholderName}!`,
            `Think about "${cleanGoal}" before throwing away ${SOLO_FEE_PCT}% in emergency fees over "${excuse}". Take a deep breath, close the app, and let your savings grow.`,
          ];
          realityCheck = neutralEnFallbacks[Math.floor(Math.random() * neutralEnFallbacks.length)];
        }
      }
    }

    return NextResponse.json({
      success: true,
      realityCheck,
      gender: detectedGender,
    });
  } catch (error: any) {
    console.error("POST /api/ai/reality-check error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to generate reality check",
        realityCheck:
          "Think about your goal before blowing your savings on temporary urges. Put the phone down and keep it locked!",
      },
      { status: 500 }
    );
  }
}
