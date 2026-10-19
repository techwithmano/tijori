const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer-core");

const BASE_URL = "http://localhost:3000";
const AUDIT_DIR = path.join(__dirname, "..", "audit");
const SCREENSHOTS_DIR = path.join(AUDIT_DIR, "screenshots");

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

function findBrowserExecutable() {
  const candidates = [
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return candidates[0];
}

async function capture() {
  const executablePath = findBrowserExecutable();
  console.log(`Using browser at: ${executablePath}`);

  const browser = await puppeteer.launch({
    executablePath,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    // 1. English Desktop Hero
    console.log("Navigating to English landing...");
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle0" });
    await page.evaluate(() => {
      document.cookie = "tijori_lang=en; path=/; max-age=31536000";
    });
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 1500));

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "task4-landing-hero-en.png"),
    });
    console.log("Captured task4-landing-hero-en.png");

    // 2. Arabic Desktop Hero (RTL verification)
    console.log("Switching to Arabic RTL...");
    await page.evaluate(() => {
      document.cookie = "tijori_lang=ar; path=/; max-age=31536000";
    });
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 1500));

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "task4-landing-hero-ar.png"),
    });
    console.log("Captured task4-landing-hero-ar.png");

    // Switch back to EN for section captures
    await page.evaluate(() => {
      document.cookie = "tijori_lang=en; path=/; max-age=31536000";
    });
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 1000));

    // 3. How It Works Section
    await page.evaluate(() => {
      const el = document.getElementById("how-it-works");
      if (el) el.scrollIntoView({ behavior: "instant", block: "center" });
    });
    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "task4-how-it-works.png"),
    });
    console.log("Captured task4-how-it-works.png");

    // 4. Live HTML Phone Mockup Section
    await page.evaluate(() => {
      window.scrollTo(0, 1600);
    });
    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "task4-phone-mockup.png"),
    });
    console.log("Captured task4-phone-mockup.png");

    // Test clicking inside the mockup (simulate interaction)
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const reject = btns.find((b) => b.textContent && (b.textContent.includes("Keep Locked") || b.textContent.includes("Reject")));
      if (reject) reject.click();
    });
    await new Promise((r) => setTimeout(r, 600));
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "task4-phone-mockup-rejected.png"),
    });
    console.log("Captured task4-phone-mockup-rejected.png");

    // 5. Final CTA and Footer
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "task4-final-cta-footer.png"),
    });
    console.log("Captured task4-final-cta-footer.png");

    // 6. Mobile Viewport (390 x 844)
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 1200));
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "task4-landing-mobile.png"),
    });
    console.log("Captured task4-landing-mobile.png");

    // 7. Full Page Desktop
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 1200));
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "task4-landing-full-en.png"),
      fullPage: true,
    });
    console.log("Captured task4-landing-full-en.png");

    console.log("All Task 4 screenshots captured successfully!");
  } finally {
    await browser.close();
  }
}

capture().catch((err) => {
  console.error("Capture failed:", err);
  process.exit(1);
});
