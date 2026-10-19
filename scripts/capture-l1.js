/**
 * scripts/capture-l1.js
 * Captures all required screenshots for TASK L1 (Landing page rebuild, light theme)
 */

const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const SCREENSHOTS_DIR = path.join(__dirname, "..", "audit", "screenshots");

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
  console.log("  TIJORI TASK L1 PLAYWRIGHT VISUAL CAPTURE");
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

  // Helper to capture a screen
  async function capture({ filename, width, height, lang = "en", selector = null, scrollTo = null, fullPage = false }) {
    console.log(`Capturing ${filename} (${width}x${height}, ${lang.toUpperCase()})...`);
    const context = await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor: 2,
    });

    // Set language cookie
    await context.addCookies([
      {
        name: "tijori_lang",
        value: lang,
        domain: "localhost",
        path: "/",
      },
      {
        name: "TIJORI_LANG",
        value: lang,
        domain: "localhost",
        path: "/",
      },
    ]);

    const page = await context.newPage();
    await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
    await waitForStable(page, 2800);

    // Verify language matches requested lang
    const isRtl = await page.evaluate(() => document.documentElement.dir === "rtl");
    if (lang === "ar" && !isRtl) {
      console.log("  Switching to Arabic via switcher button...");
      const arBtn = await page.$('button[aria-label="Switch to Arabic"]');
      if (arBtn) {
        await arBtn.click();
        await page.waitForTimeout(2000);
      }
    } else if (lang === "en" && isRtl) {
      console.log("  Switching to English via switcher button...");
      const enBtn = await page.$('button[aria-label="Switch to English"]');
      if (enBtn) {
        await enBtn.click();
        await page.waitForTimeout(2000);
      }
    }

    if (scrollTo) {
      await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (el) el.scrollIntoView({ behavior: "instant", block: "center" });
      }, scrollTo);
      await page.waitForTimeout(1000);
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

  // 1. L1_hero_en_desktop.png (1440x900, EN)
  await capture({
    filename: "L1_hero_en_desktop.png",
    width: 1440,
    height: 900,
    lang: "en",
  });

  // 2. L1_hero_ar_desktop.png (1440x900, AR)
  await capture({
    filename: "L1_hero_ar_desktop.png",
    width: 1440,
    height: 900,
    lang: "ar",
  });

  // 3. L1_hero_en_phone.png (390x844, EN)
  await capture({
    filename: "L1_hero_en_phone.png",
    width: 390,
    height: 844,
    lang: "en",
  });

  // 4. L1_hero_ar_phone.png (390x844, AR)
  await capture({
    filename: "L1_hero_ar_phone.png",
    width: 390,
    height: 844,
    lang: "ar",
  });

  // 5. L1_howitworks_en_desktop.png (1440x900, EN, scrolled to #how-it-works)
  await capture({
    filename: "L1_howitworks_en_desktop.png",
    width: 1440,
    height: 900,
    lang: "en",
    scrollTo: "#how-it-works",
  });

  // 6. L1_approval_en_desktop.png (1440x900, EN, scrolled to #friend-approval)
  await capture({
    filename: "L1_approval_en_desktop.png",
    width: 1440,
    height: 900,
    lang: "en",
    scrollTo: "#friend-approval",
  });

  // 7. L1_approval_en_phone.png (390x844, EN, scrolled to #friend-approval)
  await capture({
    filename: "L1_approval_en_phone.png",
    width: 390,
    height: 844,
    lang: "en",
    scrollTo: "#friend-approval",
  });

  // 8. L1_full_en_desktop.png (1440, EN, fullPage: true)
  await capture({
    filename: "L1_full_en_desktop.png",
    width: 1440,
    height: 900,
    lang: "en",
    fullPage: true,
  });

  // 9. L1_full_ar_desktop.png (1440, AR, fullPage: true)
  await capture({
    filename: "L1_full_ar_desktop.png",
    width: 1440,
    height: 900,
    lang: "ar",
    fullPage: true,
  });

  await browser.close();
  console.log("\n==================================================================");
  console.log("  ALL TASK L1 SCREENSHOTS CAPTURED SUCCESSFULLY!");
  console.log("==================================================================");
}

main().catch((err) => {
  console.error("Capture failed:", err);
  process.exit(1);
});
