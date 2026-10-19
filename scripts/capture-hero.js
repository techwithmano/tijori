const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const BASE_URL = "http://localhost:3000";
const SCREENSHOTS_DIR = path.join(__dirname, "..", "audit", "screenshots");

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
  const executablePath = findBrowserPath();
  const browser = await chromium.launch({
    headless: true,
    executablePath,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu-rasterization"],
  });

  const targets = [
    { filename: "L2_hero_en_desktop.png", width: 1440, height: 900, lang: "en" },
    { filename: "L2_hero_ar_desktop.png", width: 1440, height: 900, lang: "ar" },
    { filename: "L2_hero_en_phone.png", width: 390, height: 844, lang: "en" },
    { filename: "L2_hero_ar_phone.png", width: 390, height: 844, lang: "ar" },
  ];

  for (const t of targets) {
    console.log(`Capturing ${t.filename} (${t.width}x${t.height}, ${t.lang})...`);
    const context = await browser.newContext({
      viewport: { width: t.width, height: t.height },
      deviceScaleFactor: 2,
    });
    await context.addCookies([
      { name: "tijori_lang", value: t.lang, domain: "localhost", path: "/" },
      { name: "TIJORI_LANG", value: t.lang, domain: "localhost", path: "/" },
    ]);
    const page = await context.newPage();
    await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
    await waitForStable(page, 3200);

    const isRtl = await page.evaluate(() => document.documentElement.dir === "rtl");
    if (t.lang === "ar" && !isRtl) {
      const arBtn = await page.$('button[aria-label="Switch to Arabic"]');
      if (arBtn) {
        await arBtn.click();
        await page.waitForTimeout(2000);
      }
    } else if (t.lang === "en" && isRtl) {
      const enBtn = await page.$('button[aria-label="Switch to English"]');
      if (enBtn) {
        await enBtn.click();
        await page.waitForTimeout(2000);
      }
    }

    const savePath = path.join(SCREENSHOTS_DIR, t.filename);
    await page.screenshot({ path: savePath });
    console.log(`  ✓ Saved ${t.filename}`);
    await context.close();
  }

  await browser.close();
  console.log("Done!");
}

main().catch(console.error);
