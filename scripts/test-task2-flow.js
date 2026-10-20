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

async function run() {
  const executablePath = findBrowserExecutable();
  console.log("Using browser at:", executablePath);

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

  // 1. Visit /login to verify real login
  console.log("1. Testing /login...");
  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle0" });
  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, "task2-login-desktop.png"),
    fullPage: false,
  });
  console.log("Captured task2-login-desktop.png");

  // 2. Visit /forgot-password
  console.log("2. Testing /forgot-password...");
  await page.goto(`${BASE_URL}/forgot-password`, { waitUntil: "networkidle0" });
  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, "task2-forgot-password-desktop.png"),
    fullPage: false,
  });
  console.log("Captured task2-forgot-password-desktop.png");

  // 3. Visit /signup and test registration
  console.log("3. Testing /signup...");
  await page.goto(`${BASE_URL}/signup`, { waitUntil: "networkidle0" });

  // Test password strength typing
  const inputs = await page.$$("input");
  // inputs: 0 is name, 1 is email, 2 is password
  await inputs[0].type("Abdulrahman");
  const uniqueEmail = `test_${Date.now()}@tijori.app`;
  await inputs[1].type(uniqueEmail);
  await inputs[2].type("Short1!");
  await new Promise((r) => setTimeout(r, 400));

  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, "task2-signup-desktop.png"),
    fullPage: false,
  });
  console.log("Captured task2-signup-desktop.png");

  // Submit signup
  console.log("Submitting signup form...");
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: "networkidle0", timeout: 10000 });
  console.log("Current URL after signup:", page.url());

  // 4. Test Onboarding Steps
  if (page.url().includes("/onboarding")) {
    console.log("4. Onboarding Step 1...");
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "task2-onboarding-step1.png"),
      fullPage: false,
    });
    console.log("Captured task2-onboarding-step1.png");

    // Click Next on Step 1
    await page.click('button[type="submit"]');
    await new Promise((r) => setTimeout(r, 600));

    console.log("Onboarding Step 2...");
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "task2-onboarding-step2.png"),
      fullPage: false,
    });
    console.log("Captured task2-onboarding-step2.png");

    // Click Next on Step 2
    await page.click('button[type="submit"]');
    await new Promise((r) => setTimeout(r, 600));

    console.log("Onboarding Step 3...");
    const step3Inputs = await page.$$("input");
    // step3Inputs: 0 is keyholderName, 1 is keyholderPhone, 2 is keyholderRel
    await step3Inputs[0].type("Fahad Al-Mutawa");
    await step3Inputs[1].type("99887766");
    await new Promise((r) => setTimeout(r, 400));

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "task2-onboarding-step3.png"),
      fullPage: false,
    });
    console.log("Captured task2-onboarding-step3.png");

    // Click Next on Step 3
    await page.click('button[type="submit"]');
    await new Promise((r) => setTimeout(r, 600));

    console.log("Onboarding Step 4...");
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "task2-onboarding-step4.png"),
      fullPage: false,
    });
    console.log("Captured task2-onboarding-step4.png");

    // Click Finish & Open Vault or Skip Card
    const buttons = await page.$$("button");
    for (const b of buttons) {
      const text = await page.evaluate((el) => el.textContent, b);
      if (
        text &&
        (text.includes("Open My Vault") ||
          text.includes("افتح خزينتي") ||
          text.includes("link my card later") ||
          text.includes("سأربط بطاقتي لاحقاً"))
      ) {
        await b.click();
        break;
      }
    }

    await page
      .waitForFunction(() => window.location.pathname.includes("/dashboard"), { timeout: 10000 })
      .catch(() => {});
    console.log("Current URL after onboarding:", page.url());
  }

  // 5. Test Empty-State Dashboard for a user with 0 vaults
  console.log("5. Testing empty-state dashboard...");
  // Clear cookies for fresh signup or visit empty user
  const client = await page.target().createCDPSession();
  await client.send("Network.clearBrowserCookies");

  // Create another user directly via API and log them in
  const emptyUserEmail = `empty_${Date.now()}@tijori.app`;
  const regRes = await page.evaluate(async (email) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Salem",
        email,
        password: "password123!",
      }),
    });
    return res.json();
  }, emptyUserEmail);

  console.log("Created empty user:", regRes);

  // Navigate straight to /dashboard with no vault created
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle0" });
  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, "task2-dashboard-empty.png"),
    fullPage: false,
  });
  console.log("Captured task2-dashboard-empty.png");

  // Switch to Arabic on Empty Dashboard
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const arBtn = buttons.find((b) => b.textContent && b.textContent.includes("عربي"));
    if (arBtn) arBtn.click();
  });
  await new Promise((r) => setTimeout(r, 800));

  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, "task2-dashboard-empty-ar.png"),
    fullPage: false,
  });
  console.log("Captured task2-dashboard-empty-ar.png");

  await browser.close();
  console.log("All Task 2 tests and screenshots completed successfully!");
}

run().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
