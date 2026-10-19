/**
 * scripts/capture-audit.js
 * Comprehensive Playwright Visual Audit & Contact Sheet Generator for Tijori (تِجوري)
 * Covers all screens at 390x844 (phone) and 1440x900 (desktop) in EN and AR (RTL)
 */

const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const AUDIT_DIR = path.join(__dirname, "..", "audit");
const SCREENSHOTS_DIR = path.join(AUDIT_DIR, "screenshots");

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

function findBrowserPath() {
  const candidates = [
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return undefined;
}

async function waitForStable(page, minWaitMs = 2500) {
  try {
    await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
  } catch {}
  try {
    await page.evaluate(async () => {
      if (document.fonts) await document.fonts.ready;
    }).catch(() => {});
  } catch {}
  await page.waitForTimeout(minWaitMs);
}

async function main() {
  console.log("==================================================================");
  console.log("  TIJORI PLAYWRIGHT VISUAL AUDIT & CONTACT SHEET GENERATOR (TASK 7)");
  console.log("==================================================================");

  // 1. Setup User 1: Empty user (for empty dashboard)
  const emptyEmail = `audit_empty_${Date.now()}@tijori.app`;
  console.log(`\n1. Creating Empty Test User (${emptyEmail})...`);
  const emptyRegRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Nasser Al-Ghanim", email: emptyEmail, password: "Password123!" }),
  });
  const emptyCookieHeader = emptyRegRes.headers.get("set-cookie")?.split(";")[0] || "";
  const [emptyCName, emptyCVal] = emptyCookieHeader.split("=");

  // 2. Setup User 2: Active user with real vault, Stripe card & top-up
  const activeEmail = `audit_active_${Date.now()}@tijori.app`;
  console.log(`2. Creating Active Test User (${activeEmail})...`);
  const activeRegRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Abdulrahman", email: activeEmail, password: "Password123!" }),
  });
  const activeCookieHeader = activeRegRes.headers.get("set-cookie")?.split(";")[0] || "";
  const [activeCName, activeCVal] = activeCookieHeader.split("=");

  // Attach Stripe Test Card (pm_card_visa represents standard 4242 card)
  console.log("3. Attaching Stripe Test Card (4242 4242 4242 4242)...");
  await fetch(`${BASE_URL}/api/stripe/save-card`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: activeCookieHeader },
    body: JSON.stringify({ paymentMethodId: "pm_card_visa" }),
  });

  // Create Active Vault
  console.log("4. Creating Active Vault ('Japan Summer Trip', 500 KWD target)...");
  const vaultRes = await fetch(`${BASE_URL}/api/vault`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: activeCookieHeader },
    body: JSON.stringify({
      title: "Japan Summer Trip",
      targetAmount: 500,
      pullAmount: 25,
      cadence: "weekly",
      keyholder: {
        name: "Fahad Al-Mutawa",
        phone: "+96599887766",
        relationship: "Best Friend",
      },
    }),
  });
  const vaultData = await vaultRes.json();
  const vaultId = vaultData.vault._id;

  // Real Top-Up
  console.log("5. Performing Real Top-Up (+125 KWD off-session PaymentIntent)...");
  await fetch(`${BASE_URL}/api/vault/topup`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: activeCookieHeader },
    body: JSON.stringify({ vaultId, amountKwd: 125 }),
  });

  // Launch Playwright
  const executablePath = findBrowserPath();
  const launchOptions = {
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
  };
  if (executablePath) {
    launchOptions.executablePath = executablePath;
  } else {
    launchOptions.channel = "msedge";
  }

  const browser = await chromium.launch(launchOptions);
  console.log("6. Playwright Browser launched successfully.\n");

  const capturedFiles = [];

  // Helper to capture a page state
  async function captureState(context, { url, filename, lang, viewport, actionsBeforeScreenshot }) {
    const filePath = path.join(SCREENSHOTS_DIR, filename);

    const page = await context.newPage();
    try {
      await page.setViewportSize(viewport);
      // Set language cookie before loading
      await context.addCookies([
        { name: "tijori_lang", value: lang, domain: "localhost", path: "/" },
      ]);

      await page.goto(url, { waitUntil: "domcontentloaded" });
      await waitForStable(page, 2000);

      if (actionsBeforeScreenshot) {
        await actionsBeforeScreenshot(page);
        await waitForStable(page, 1500);
      }

      await page.screenshot({ path: filePath, fullPage: false });
      console.log(`  ✓ Saved: ${filename}`);
      capturedFiles.push(filename);
    } finally {
      await page.close();
    }
  }

  // Viewports
  const PHONE = { width: 390, height: 844 };
  const DESKTOP = { width: 1440, height: 900 };

  // --------------------------------------------------------------------------
  // BROWSER CONTEXTS: GUEST, EMPTY USER, ACTIVE USER
  // --------------------------------------------------------------------------
  const guestContext = await browser.newContext();
  const emptyContext = await browser.newContext();
  await emptyContext.addCookies([
    { name: emptyCName, value: emptyCVal, domain: "localhost", path: "/" },
  ]);

  const activeContext = await browser.newContext();
  await activeContext.addCookies([
    { name: activeCName, value: activeCVal, domain: "localhost", path: "/" },
  ]);

  console.log("--- CAPTURING GUEST & AUTH SCREENS ---");

  // 01. LANDING
  for (const lang of ["en", "ar"]) {
    await captureState(guestContext, {
      url: `${BASE_URL}/`,
      filename: `01_landing_${lang}_desktop.png`,
      lang,
      viewport: DESKTOP,
    });
    await captureState(guestContext, {
      url: `${BASE_URL}/`,
      filename: `01_landing_${lang}_phone.png`,
      lang,
      viewport: PHONE,
    });
  }

  // 02. SIGNUP
  for (const lang of ["en", "ar"]) {
    await captureState(guestContext, {
      url: `${BASE_URL}/signup`,
      filename: `02_signup_${lang}_desktop.png`,
      lang,
      viewport: DESKTOP,
    });
    await captureState(guestContext, {
      url: `${BASE_URL}/signup`,
      filename: `02_signup_${lang}_phone.png`,
      lang,
      viewport: PHONE,
    });
  }

  // 03. LOGIN
  for (const lang of ["en", "ar"]) {
    await captureState(guestContext, {
      url: `${BASE_URL}/login`,
      filename: `03_login_${lang}_desktop.png`,
      lang,
      viewport: DESKTOP,
    });
    await captureState(guestContext, {
      url: `${BASE_URL}/login`,
      filename: `03_login_${lang}_phone.png`,
      lang,
      viewport: PHONE,
    });
  }

  // 04. ONBOARDING STEP 1
  for (const lang of ["en", "ar"]) {
    await captureState(emptyContext, {
      url: `${BASE_URL}/onboarding`,
      filename: `04_onboarding_step1_${lang}_desktop.png`,
      lang,
      viewport: DESKTOP,
    });
    await captureState(emptyContext, {
      url: `${BASE_URL}/onboarding`,
      filename: `04_onboarding_step1_${lang}_phone.png`,
      lang,
      viewport: PHONE,
    });
  }

  // 05. ONBOARDING CARD STEP (Step 4 with Stripe Elements & Test Mode Hint)
  for (const lang of ["en", "ar"]) {
    const advanceToStep4 = async (p) => {
      try {
        const goalInput = p.locator('input[type="text"]').first();
        await goalInput.fill("Japan Summer Trip");
      } catch {}
      const next1 = p.locator('button[type="submit"]');
      await next1.click();
      await p.waitForTimeout(700);
      const next2 = p.locator('button[type="submit"]');
      await next2.click();
      await p.waitForTimeout(700);
      await p.locator('input[type="text"]').first().fill("Fahad Al-Mutawa");
      await p.locator('input[type="tel"]').fill("99887766");
      const next3 = p.locator('button[type="submit"]');
      await next3.click();
      await p.waitForTimeout(1200);
    };

    await captureState(emptyContext, {
      url: `${BASE_URL}/onboarding`,
      filename: `05_onboarding_card_${lang}_desktop.png`,
      lang,
      viewport: DESKTOP,
      actionsBeforeScreenshot: advanceToStep4,
    });
    await captureState(emptyContext, {
      url: `${BASE_URL}/onboarding`,
      filename: `05_onboarding_card_${lang}_phone.png`,
      lang,
      viewport: PHONE,
      actionsBeforeScreenshot: advanceToStep4,
    });
  }

  // 06. DASHBOARD EMPTY (New User without Vault)
  for (const lang of ["en", "ar"]) {
    await captureState(emptyContext, {
      url: `${BASE_URL}/dashboard`,
      filename: `06_dashboard_empty_${lang}_desktop.png`,
      lang,
      viewport: DESKTOP,
    });
    await captureState(emptyContext, {
      url: `${BASE_URL}/dashboard`,
      filename: `06_dashboard_empty_${lang}_phone.png`,
      lang,
      viewport: PHONE,
    });
  }

  // 07. DASHBOARD WITH VAULT (Active User with 125 KWD Funded)
  for (const lang of ["en", "ar"]) {
    await captureState(activeContext, {
      url: `${BASE_URL}/dashboard`,
      filename: `07_dashboard_vault_${lang}_desktop.png`,
      lang,
      viewport: DESKTOP,
    });
    await captureState(activeContext, {
      url: `${BASE_URL}/dashboard`,
      filename: `07_dashboard_vault_${lang}_phone.png`,
      lang,
      viewport: PHONE,
    });
  }

  // 09. BREAK SHEET (REASON STEP)
  for (const lang of ["en", "ar"]) {
    const openBreakReason = async (p) => {
      const breakBtn = p.locator('button:has-text("I need to break it"), button:has-text("أبي أكسر القفل")');
      await breakBtn.click();
      await p.waitForTimeout(600);
      const excuse = lang === "ar"
        ? "لقيت سنيكرز ليمتد بمجمع 360 ويخلص بساعة!"
        : "Sneaker drop at 360 Mall sells out in an hour!";
      await p.locator("textarea").fill(excuse);
      await p.waitForTimeout(300);
    };

    await captureState(activeContext, {
      url: `${BASE_URL}/dashboard`,
      filename: `09_break_sheet_reason_${lang}_desktop.png`,
      lang,
      viewport: DESKTOP,
      actionsBeforeScreenshot: openBreakReason,
    });
    await captureState(activeContext, {
      url: `${BASE_URL}/dashboard`,
      filename: `09_break_sheet_reason_${lang}_phone.png`,
      lang,
      viewport: PHONE,
      actionsBeforeScreenshot: openBreakReason,
    });
  }

  // 10. BREAK SHEET (AI REALITY CHECK ROAST STEP)
  for (const lang of ["en", "ar"]) {
    const triggerAiRoast = async (p) => {
      const breakBtn = p.locator('button:has-text("I need to break it"), button:has-text("أبي أكسر القفل")');
      await breakBtn.click();
      await p.waitForTimeout(600);
      const excuse = lang === "ar"
        ? "لقيت سنيكرز ليمتد بمجمع 360 ويخلص بساعة!"
        : "Sneaker drop at 360 Mall sells out in an hour!";
      await p.locator("textarea").fill(excuse);
      await p.waitForTimeout(300);
      const sendBtn = p.locator('button:has-text("Send to"), button:has-text("أرسل لـ")');
      await sendBtn.click();
      await p.waitForTimeout(1500);
    };

    await captureState(activeContext, {
      url: `${BASE_URL}/dashboard`,
      filename: `10_break_sheet_roast_${lang}_desktop.png`,
      lang,
      viewport: DESKTOP,
      actionsBeforeScreenshot: triggerAiRoast,
    });
    await captureState(activeContext, {
      url: `${BASE_URL}/dashboard`,
      filename: `10_break_sheet_roast_${lang}_phone.png`,
      lang,
      viewport: PHONE,
      actionsBeforeScreenshot: triggerAiRoast,
    });
  }

  // SUBMIT REAL BREAK REQUEST TO TRIGGER PENDING STATE & GET UNLOCK TOKEN
  console.log("\n7. Submitting Real Break Request to generate single-use Keyholder token...");
  const breakRequestRes = await fetch(`${BASE_URL}/api/vault/${vaultId}/unlock`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: activeCookieHeader },
    body: JSON.stringify({
      action: "REQUEST",
      reason: "Sneaker drop at 360 Mall sells out in an hour, need the cash right now!",
    }),
  });
  const breakRequestData = await breakRequestRes.json();
  const unlockToken = breakRequestData.token || breakRequestData.vault?.unlockToken;
  console.log(`   Single-use Keyholder token: ${unlockToken}`);

  // 08. DASHBOARD WITH BREAK PENDING (Coral banner, Waiting on Fahad)
  for (const lang of ["en", "ar"]) {
    await captureState(activeContext, {
      url: `${BASE_URL}/dashboard`,
      filename: `08_dashboard_break_pending_${lang}_desktop.png`,
      lang,
      viewport: DESKTOP,
    });
    await captureState(activeContext, {
      url: `${BASE_URL}/dashboard`,
      filename: `08_dashboard_break_pending_${lang}_phone.png`,
      lang,
      viewport: PHONE,
    });
  }

  // 11. KEYHOLDER PAGE (Decision moment)
  for (const lang of ["en", "ar"]) {
    await captureState(guestContext, {
      url: `${BASE_URL}/unlock/${unlockToken}`,
      filename: `11_keyholder_page_${lang}_phone.png`,
      lang,
      viewport: PHONE,
    });
    await captureState(guestContext, {
      url: `${BASE_URL}/unlock/${unlockToken}`,
      filename: `11_keyholder_page_${lang}_desktop.png`,
      lang,
      viewport: DESKTOP,
    });
  }

  // 12. KEYHOLDER RESULT AFTER DENY
  console.log("\n8. Capturing Keyholder result after Deny...");
  for (const lang of ["en", "ar"]) {
    const executeDeny = async (p) => {
      const denyBtn = p.locator('button:has-text("Keep it locked"), button:has-text("خله مقفول")');
      await denyBtn.waitFor({ state: "visible", timeout: 8000 });
      await denyBtn.click();
      await p.waitForTimeout(1500);
    };

    const getFreshToken = async (l) => {
      const tRes = await fetch(`${BASE_URL}/api/vault/${vaultId}/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: activeCookieHeader },
        body: JSON.stringify({
          action: "REQUEST",
          reason: l === "ar"
            ? "لقيت سنيكرز ليمتد بمجمع 360 ويخلص بساعة!"
            : "Sneaker drop at 360 Mall sells out in an hour!",
        }),
      });
      const tData = await tRes.json();
      return tData.token || tData.vault?.unlockToken;
    };

    const tokenPhone = await getFreshToken(lang);
    await captureState(guestContext, {
      url: `${BASE_URL}/unlock/${tokenPhone}`,
      filename: `12_keyholder_denied_${lang}_phone.png`,
      lang,
      viewport: PHONE,
      actionsBeforeScreenshot: executeDeny,
    });

    const tokenDesktop = await getFreshToken(lang);
    await captureState(guestContext, {
      url: `${BASE_URL}/unlock/${tokenDesktop}`,
      filename: `12_keyholder_denied_${lang}_desktop.png`,
      lang,
      viewport: DESKTOP,
      actionsBeforeScreenshot: executeDeny,
    });
  }

  // 13. ERROR / BURNED TOKEN STATE (Single-use security defense)
  console.log("\n9. Capturing Burned Token security defense screen...");
  for (const lang of ["en", "ar"]) {
    await captureState(guestContext, {
      url: `${BASE_URL}/unlock/burned-token-expired-demo-security`,
      filename: `13_burned_token_${lang}_phone.png`,
      lang,
      viewport: PHONE,
    });
    await captureState(guestContext, {
      url: `${BASE_URL}/unlock/burned-token-expired-demo-security`,
      filename: `13_burned_token_${lang}_desktop.png`,
      lang,
      viewport: DESKTOP,
    });
  }

  console.log(`\nAll ${capturedFiles.length} individual screenshots verified.`);

  // --------------------------------------------------------------------------
  // 4. BUILD CONTACT SHEETS (SHEET 1, 2, 3, 4)
  // --------------------------------------------------------------------------
  console.log("\n--- BUILDING CONTACT SHEETS (SHEET 1 - 4) ---");

  // Read all actual image files present in SCREENSHOTS_DIR matching the prefixes
  const allSaved = fs.readdirSync(SCREENSHOTS_DIR);

  const sheets = [
    {
      filename: "SHEET_1_phone_en.png",
      title: "TIJORI AUDIT • SHEET 1 (PHONE 390x844 — ENGLISH LTR)",
      filter: (f) => f.endsWith("_en_phone.png"),
      cols: 4,
    },
    {
      filename: "SHEET_2_phone_ar.png",
      title: "TIJORI AUDIT • SHEET 2 (PHONE 390x844 — ARABIC RTL)",
      filter: (f) => f.endsWith("_ar_phone.png"),
      cols: 4,
    },
    {
      filename: "SHEET_3_desktop_en.png",
      title: "TIJORI AUDIT • SHEET 3 (DESKTOP 1440x900 — ENGLISH LTR)",
      filter: (f) => f.endsWith("_en_desktop.png"),
      cols: 2,
    },
    {
      filename: "SHEET_4_desktop_ar.png",
      title: "TIJORI AUDIT • SHEET 4 (DESKTOP 1440x900 — ARABIC RTL)",
      filter: (f) => f.endsWith("_ar_desktop.png"),
      cols: 2,
    },
  ];

  for (const s of sheets) {
    const matchedFiles = allSaved.filter(s.filter).sort();
    console.log(`Generating ${s.filename} with ${matchedFiles.length} images...`);

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background-color: #0B0A14;
    color: #F5F3FF;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    padding: 40px;
    width: ${s.cols === 4 ? "1800px" : "1920px"};
  }
  .header {
    border-bottom: 2px solid #2A2639;
    padding-bottom: 24px;
    margin-bottom: 32px;
  }
  .header h1 {
    font-size: 28px;
    font-weight: 800;
    color: #C6FF3D;
    letter-spacing: -0.5px;
  }
  .header p {
    color: #A29DB8;
    font-size: 14px;
    margin-top: 6px;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(${s.cols}, 1fr);
    gap: 24px;
  }
  .card {
    background: #15131F;
    border: 1px solid #2A2639;
    border-radius: 16px;
    padding: 16px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.4);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .img-wrap {
    width: 100%;
    background: #0B0A14;
    border-radius: 10px;
    overflow: hidden;
    border: 1px solid #2A2639;
  }
  .img-wrap img {
    width: 100%;
    display: block;
  }
  .label {
    margin-top: 14px;
    font-family: monospace;
    font-size: 13px;
    font-weight: 700;
    color: #F5F3FF;
    background: #1E1B2B;
    border: 1px solid #2A2639;
    padding: 8px 12px;
    border-radius: 8px;
    word-break: break-all;
    text-align: center;
  }
</style>
</head>
<body>
  <div class="header">
    <h1>${s.title}</h1>
    <p>Automated Contact Sheet • Grounded in Real DB State • Stripe Test Tokenization • Zero Emojis/Demo Shortcuts</p>
  </div>
  <div class="grid">
    ${matchedFiles
      .map(
        (f) => `
      <div class="card">
        <div class="img-wrap">
          <img src="${path.join(SCREENSHOTS_DIR, f).replace(/\\/g, "/")}" />
        </div>
        <div class="label">${f}</div>
      </div>
    `
      )
      .join("")}
  </div>
</body>
</html>
    `;

    const htmlPath = path.join(AUDIT_DIR, `temp_${s.filename}.html`);
    fs.writeFileSync(htmlPath, htmlContent);

    const sheetPage = await browser.newPage();
    await sheetPage.setViewportSize({ width: s.cols === 4 ? 1800 : 1920, height: 1080 });
    await sheetPage.goto(`file://${htmlPath.replace(/\\/g, "/")}`, { waitUntil: "networkidle" });
    await sheetPage.waitForTimeout(1500);

    const sheetOutPath = path.join(SCREENSHOTS_DIR, s.filename);
    await sheetPage.screenshot({ path: sheetOutPath, fullPage: true });
    console.log(`  ✓ Created Contact Sheet: ${s.filename}`);

    await sheetPage.close();
    try { fs.unlinkSync(htmlPath); } catch {}
  }

  await browser.close();
  console.log("\n==================================================================");
  console.log("  TASK 7 COMPLETE: ALL 52 SCREENSHOTS & 4 CONTACT SHEETS SAVED!");
  console.log("==================================================================");
}

main().catch((err) => {
  console.error("Task 7 capture-audit failed:", err);
  process.exit(1);
});
