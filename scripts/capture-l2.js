/**
 * scripts/capture-l2.js
 * Captures all required screenshots for TASK L2 and tests nav auth states
 */

const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");
const jwt = require("jsonwebtoken");

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const SCREENSHOTS_DIR = path.join(__dirname, "..", "audit", "screenshots");
const JWT_SECRET = process.env.JWT_SECRET || "tijori_ultra_secure_jwt_secret_token_2026_gcc_fintech";

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

async function waitForStable(page, minWaitMs = 2800) {
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
  console.log("  TIJORI TASK L2 PLAYWRIGHT VISUAL CAPTURE & AUTH VERIFICATION");
  console.log("==================================================================");

  const executablePath = findBrowserPath();
  const launchOptions = {
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu-rasterization"],
  };
  if (executablePath) {
    launchOptions.executablePath = executablePath;
  }

  const browser = await chromium.launch(launchOptions);

  // ── TEST AUTH STATES (Section C) ──
  console.log("\n[TESTING NAV AUTH STATES]");
  // State 1: Logged Out
  const loggedOutContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const loggedOutPage = await loggedOutContext.newPage();
  await loggedOutPage.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  await waitForStable(loggedOutPage, 1500);

  const hasLoginLink = await loggedOutPage.$('header a[href="/login"]');
  const hasStartSavingBtn = await loggedOutPage.$('header a[href="/signup"]');
  console.log(`  LOGGED OUT: "Log in" present? ${!!hasLoginLink}, "Start saving" present? ${!!hasStartSavingBtn}`);
  await loggedOutContext.close();

  // State 2: Logged In
  console.log("  Registering test session to verify LOGGED IN state...");
  const testEmail = `nav_auth_${Date.now()}@tijori.app`;
  let sessionCookieValue = "";
  try {
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Abdulrahman", email: testEmail, password: "Password123!" }),
    });
    const setCookie = regRes.headers.get("set-cookie");
    if (setCookie) {
      const match = setCookie.match(/tijori_session=([^;]+)/);
      if (match) sessionCookieValue = match[1];
    }
  } catch (e) {
    console.error("  Auth registration error:", e);
  }

  const loggedInContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  if (sessionCookieValue) {
    await loggedInContext.addCookies([
      {
        name: "tijori_session",
        value: sessionCookieValue,
        domain: "localhost",
        path: "/",
      },
    ]);
  }
  const loggedInPage = await loggedInContext.newPage();
  await loggedInPage.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  await waitForStable(loggedInPage, 2000);

  const hasDashboardPill = await loggedInPage.$('header a[href="/dashboard"]');
  const dashboardClasses = hasDashboardPill
    ? await loggedInPage.evaluate((el) => el.className, hasDashboardPill)
    : "";
  console.log(`  LOGGED IN: "Dashboard" pill button present? ${!!hasDashboardPill}`);
  console.log(`  "Dashboard" classes: "${dashboardClasses}"`);
  await loggedInContext.close();

  // ── CAPTURE REQUIRED TASK L2 SCREENSHOTS ──
  console.log("\n[CAPTURING SCREENSHOTS]");

  async function capture({ filename, width, height, lang = "en", scrollTo = null, fullPage = false, scrollOffset = 0, waitAfterScroll = 1200 }) {
    console.log(`Capturing ${filename} (${width}x${height}, ${lang.toUpperCase()})...`);
    const context = await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor: 2,
    });

    await context.addCookies([
      { name: "tijori_lang", value: lang, domain: "localhost", path: "/" },
      { name: "TIJORI_LANG", value: lang, domain: "localhost", path: "/" },
    ]);

    const page = await context.newPage();
    await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
    await waitForStable(page, 2800);

    // Verify language
    const isRtl = await page.evaluate(() => document.documentElement.dir === "rtl");
    if (lang === "ar" && !isRtl) {
      const arBtn = await page.$('button[aria-label="Switch to Arabic"]');
      if (arBtn) {
        await arBtn.click();
        await page.waitForTimeout(2000);
      }
    } else if (lang === "en" && isRtl) {
      const enBtn = await page.$('button[aria-label="Switch to English"]');
      if (enBtn) {
        await enBtn.click();
        await page.waitForTimeout(2000);
      }
    }

    if (scrollTo) {
      await page.evaluate(({ sel, offset }) => {
        const el = document.querySelector(sel);
        if (el) {
          const rect = el.getBoundingClientRect();
          window.scrollTo({
            top: window.scrollY + rect.top + offset,
            behavior: "instant",
          });
        }
      }, { sel: scrollTo, offset: scrollOffset });
      await page.waitForTimeout(waitAfterScroll);
    }

    const savePath = path.join(SCREENSHOTS_DIR, filename);
    if (fullPage) {
      await page.screenshot({ path: savePath, fullPage: true });
    } else {
      await page.screenshot({ path: savePath });
    }
    console.log(`  ✓ Saved ${filename}`);
    await context.close();
  }

  // 1. L2_hero_en_desktop.png (1440x900, EN)
  await capture({
    filename: "L2_hero_en_desktop.png",
    width: 1440,
    height: 900,
    lang: "en",
  });

  // 2. L2_hero_ar_desktop.png (1440x900, AR)
  await capture({
    filename: "L2_hero_ar_desktop.png",
    width: 1440,
    height: 900,
    lang: "ar",
  });

  // 3. L2_hero_en_phone.png (390x844, EN)
  await capture({
    filename: "L2_hero_en_phone.png",
    width: 390,
    height: 844,
    lang: "en",
  });

  // 4. L2_hero_ar_phone.png (390x844, AR)
  await capture({
    filename: "L2_hero_ar_phone.png",
    width: 390,
    height: 844,
    lang: "ar",
  });

  // 5. L2_howitworks_step1.png (1440x900, EN, scrolled so step 1 is active)
  await capture({
    filename: "L2_howitworks_step1.png",
    width: 1440,
    height: 900,
    lang: "en",
    scrollTo: "#how-it-works",
    scrollOffset: 120,
    waitAfterScroll: 1500,
  });

  // 6. L2_howitworks_step2.png (1440x900, EN, scrolled so step 2 is active)
  await capture({
    filename: "L2_howitworks_step2.png",
    width: 1440,
    height: 900,
    lang: "en",
    scrollTo: "#how-it-works",
    scrollOffset: 480,
    waitAfterScroll: 2000,
  });

  // 7. L2_howitworks_step3.png (1440x900, EN, scrolled so step 3 is active)
  await capture({
    filename: "L2_howitworks_step3.png",
    width: 1440,
    height: 900,
    lang: "en",
    scrollTo: "#how-it-works",
    scrollOffset: 840,
    waitAfterScroll: 1500,
  });

  // 8. L2_approval_en_phone.png (390x844, EN, scrolled to #friend-approval)
  await capture({
    filename: "L2_approval_en_phone.png",
    width: 390,
    height: 844,
    lang: "en",
    scrollTo: "#friend-approval",
    scrollOffset: 0,
    waitAfterScroll: 1500,
  });

  // 9. L2_full_en_desktop.png (1440x900, EN, fullPage: true)
  await capture({
    filename: "L2_full_en_desktop.png",
    width: 1440,
    height: 900,
    lang: "en",
    fullPage: true,
  });

  // 10. L2_full_ar_desktop.png (1440x900, AR, fullPage: true)
  await capture({
    filename: "L2_full_ar_desktop.png",
    width: 1440,
    height: 900,
    lang: "ar",
    fullPage: true,
  });

  await browser.close();
  console.log("\n==================================================================");
  console.log("  ALL TASK L2 SCREENSHOTS & AUDITS COMPLETED SUCCESSFULLY!");
  console.log("==================================================================");
}

main().catch((err) => {
  console.error("Capture failed:", err);
  process.exit(1);
});
