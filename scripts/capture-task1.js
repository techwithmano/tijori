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
  console.log("Using browser at:", executablePath);

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

  // 1. Capture /dev/styleguide
  console.log("Navigating to /dev/styleguide...");
  await page.goto(`${BASE_URL}/dev/styleguide`, { waitUntil: "networkidle0" });
  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, "task1-styleguide-desktop.png"),
    fullPage: false,
  });
  console.log("Captured task1-styleguide-desktop.png");

  // Capture full page of styleguide
  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, "task1-styleguide-full.png"),
    fullPage: true,
  });
  console.log("Captured task1-styleguide-full.png");

  // Switch to Arabic on styleguide
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const arBtn = buttons.find((b) => b.textContent && b.textContent.includes("عربي"));
    if (arBtn) arBtn.click();
  });
  await new Promise((r) => setTimeout(r, 800));

  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, "task1-styleguide-ar.png"),
    fullPage: false,
  });
  console.log("Captured task1-styleguide-ar.png");

  // 2. Capture Landing Page with LanguageSwitcher
  console.log("Navigating to landing page...");
  await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle0" });
  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, "task1-landing-desktop.png"),
    fullPage: false,
  });
  console.log("Captured task1-landing-desktop.png");

  // 3. Capture Login Page with LanguageSwitcher
  console.log("Navigating to login page...");
  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle0" });
  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, "task1-login-desktop.png"),
    fullPage: false,
  });
  console.log("Captured task1-login-desktop.png");

  await browser.close();
  console.log("All Task 1 screenshots captured successfully in /audit/screenshots/");
}

capture().catch((err) => {
  console.error("Capture error:", err);
  process.exit(1);
});
