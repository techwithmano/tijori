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
  console.log(`Using browser at: ${executablePath}`);

  // 1. Setup a fresh test user with an active vault
  const email = `task5_${Date.now()}@test.app`;
  const password = "Password123!";

  console.log(`Registering test user: ${email}...`);
  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Abdulrahman", email, password }),
  });
  const regData = await regRes.json();
  const cookie = regRes.headers.get("set-cookie")?.split(";")[0] || "";

  // Attach card
  await fetch(`${BASE_URL}/api/stripe/save-card`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ paymentMethodId: "pm_card_visa" }),
  });

  // Create an active vault
  console.log("Creating active vault...");
  const vaultRes = await fetch(`${BASE_URL}/api/vault`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
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

  // Add some funds to the vault
  await fetch(`${BASE_URL}/api/vault/topup`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ vaultId, amountKwd: 125 }),
  });

  const browser = await puppeteer.launch({
    executablePath,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    // Set auth cookie
    const [cName, cVal] = cookie.split("=");
    await page.setCookie({
      name: cName,
      value: cVal,
      domain: "localhost",
      path: "/",
    });

    // 1. Desktop Dashboard (English)
    console.log("Capturing Desktop Dashboard (English)...");
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 1200));
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "task5-dashboard-desktop-en.png"),
    });
    console.log("Captured task5-dashboard-desktop-en.png");

    // 2. Desktop Dashboard (Arabic RTL)
    console.log("Capturing Desktop Dashboard (Arabic RTL)...");
    await page.evaluate(() => {
      document.cookie = "tijori_lang=ar; path=/; max-age=31536000";
    });
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 1200));
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "task5-dashboard-desktop-ar.png"),
    });
    console.log("Captured task5-dashboard-desktop-ar.png");

    // Switch back to EN for flow verification
    await page.evaluate(() => {
      document.cookie = "tijori_lang=en; path=/; max-age=31536000";
    });
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 800));

    // 3. Mobile Viewport (Phone first: 390x844)
    await page.setViewport({ width: 390, height: 844 });
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 1000));
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "task5-dashboard-mobile.png"),
    });
    console.log("Captured task5-dashboard-mobile.png");

    // 4. Trigger Break Flow Modal: "I need to break it"
    console.log("Opening Break Sheet...");
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const breakBtn = btns.find((b) => b.textContent && b.textContent.includes("I need to break it"));
      if (breakBtn) breakBtn.click();
    });
    await new Promise((r) => setTimeout(r, 600));

    // Type excuse using page.type so React controlled component updates state
    await page.focus("textarea");
    await page.type("textarea", "Limited sneaker drop at 360 Mall and they sell out in an hour!", { delay: 20 });
    await page.evaluate(() => {
      if (document.activeElement) document.activeElement.blur();
      window.scrollTo(0, 0);
    });
    await new Promise((r) => setTimeout(r, 600));
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "task5-break-step1-reason.png"),
    });
    console.log("Captured task5-break-step1-reason.png");

    // Click "Send to Fahad" to trigger AI Reality Check
    console.log("Requesting AI reality check roast...");
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const sendBtn = btns.find((b) => b.textContent && (b.textContent.includes("Ask") || b.textContent.includes("Send to") || b.textContent.includes("أرسل") || b.textContent.includes("طلب إذن")));
      if (sendBtn) sendBtn.click();
    });

    // Wait for Step 2 (roast) to render
    await page.waitForFunction(
      () => Array.from(document.querySelectorAll("button")).some((b) => b.textContent && (b.textContent.includes("Still sending it") || b.textContent.includes("مصرّ"))),
      { timeout: 15000 }
    );
    await page.evaluate(() => {
      if (document.activeElement) document.activeElement.blur();
      window.scrollTo(0, 0);
    });
    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "task5-break-step2-roast.png"),
    });
    console.log("Captured task5-break-step2-roast.png");

    // Click "Still sending it" to create single-use token & open WhatsApp link
    console.log("Confirming Still sending it...");
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const stillBtn = btns.find((b) => b.textContent && (b.textContent.includes("Still sending it") || b.textContent.includes("مصرّ")));
      if (stillBtn) stillBtn.click();
    });

    // Wait for Step 3 (share screen with WhatsApp button)
    await page.waitForFunction(
      () => Array.from(document.querySelectorAll("a, button")).some((el) => el.textContent && el.textContent.includes("WhatsApp")),
      { timeout: 15000 }
    );
    await page.evaluate(() => {
      if (document.activeElement) document.activeElement.blur();
      window.scrollTo(0, 0);
    });
    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "task5-break-step3-share.png"),
    });
    console.log("Captured task5-break-step3-share.png");

    // Fetch the updated vault to get the single-use unlock token
    const updatedVaultRes = await fetch(`${BASE_URL}/api/vault`, {
      headers: { Cookie: cookie },
    });
    const updatedVaultData = await updatedVaultRes.json();
    const token = updatedVaultData.vault.unlockToken;
    console.log(`Generated single-use unlock token: ${token}`);

    // Reload dashboard to verify coral "Waiting on Fahad" state shown ONCE
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 1000));
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "task5-dashboard-waiting-on-fahad.png"),
    });
    console.log("Captured task5-dashboard-waiting-on-fahad.png");

    // 5. KEYHOLDER PAGE /unlock/[token] (mobile-first at 390px)
    console.log(`Navigating to Keyholder page: ${BASE_URL}/unlock/${token}...`);
    await page.goto(`${BASE_URL}/unlock/${token}`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 1200));
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "task5-keyholder-page-mobile.png"),
    });
    console.log("Captured task5-keyholder-page-mobile.png");

    // Test Keyholder decision: click "Keep it locked"
    console.log("Keyholder clicking 'Keep it locked'...");
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const lockBtn = btns.find((b) => b.textContent && b.textContent.includes("Keep it locked"));
      if (lockBtn) lockBtn.click();
    });
    await new Promise((r) => setTimeout(r, 1200));
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "task5-keyholder-denied-result.png"),
    });
    console.log("Captured task5-keyholder-denied-result.png");

    // Verify token burning: reload the same URL, must show "This link was already used"
    console.log("Reloading Keyholder URL to verify token burning...");
    await page.goto(`${BASE_URL}/unlock/${token}`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 1000));
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "task5-keyholder-burned-link.png"),
    });
    console.log("Captured task5-keyholder-burned-link.png");

    console.log("All Task 5 flows and screenshots captured successfully!");
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error("Task 5 test failed:", err);
  process.exit(1);
});
