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
  console.log(`Starting QA screenshot capture with browser: ${executablePath}`);

  // 1. Setup User 1: Empty user (no vault)
  const emptyEmail = `qa_empty_${Date.now()}@test.app`;
  console.log(`Creating empty test user: ${emptyEmail}...`);
  const emptyReg = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Faisal Al-Sabah", email: emptyEmail, password: "Password123!" }),
  });
  const emptyCookie = emptyReg.headers.get("set-cookie")?.split(";")[0] || "";

  // 2. Setup User 2: Active user with funded vault & break request for keyholder token
  const vaultEmail = `qa_vault_${Date.now()}@test.app`;
  console.log(`Creating funded vault test user: ${vaultEmail}...`);
  const vaultReg = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Abdulrahman", email: vaultEmail, password: "Password123!" }),
  });
  const vaultCookie = vaultReg.headers.get("set-cookie")?.split(";")[0] || "";

  // Create active vault
  const vRes = await fetch(`${BASE_URL}/api/vault`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: vaultCookie },
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
  const vData = await vRes.json();
  const vaultId = vData.vault._id;

  // Add 125 KWD funds
  await fetch(`${BASE_URL}/api/vault/topup`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: vaultCookie },
    body: JSON.stringify({ vaultId, amountKwd: 125 }),
  });

  // Request a break to generate a Keyholder unlock token
  const breakRes = await fetch(`${BASE_URL}/api/vault/${vaultId}/unlock`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: vaultCookie },
    body: JSON.stringify({
      action: "REQUEST",
      reason: "Sneaker drop at 360 Mall sells out in an hour, need the cash right now!",
    }),
  });
  const breakData = await breakRes.json();
  const unlockToken = breakData.token || breakData.vault?.unlockToken;
  console.log(`Created vault ${vaultId} with unlockToken: ${unlockToken}`);

  const browser = await puppeteer.launch({
    executablePath,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
  });

  const page = await browser.newPage();

  async function setLocale(lang) {
    await page.setCookie({
      name: "tijori_lang",
      value: lang,
      domain: "localhost",
      path: "/",
    });
  }

  async function clearAuth() {
    const cookies = await page.cookies();
    for (const c of cookies) {
      if (c.name === "token") {
        await page.deleteCookie(c);
      }
    }
  }

  async function setAuth(c) {
    await clearAuth();
    if (!c) return;
    const [cName, cVal] = c.split("=");
    await page.setCookie({
      name: cName,
      value: cVal,
      domain: "localhost",
      path: "/",
    });
  }

  try {
    // -------------------------------------------------------------
    // 1. LANDING PAGE (1440px & 390px, EN & AR)
    // -------------------------------------------------------------
    await clearAuth();

    // 1a. Landing 1440px EN
    await page.setViewport({ width: 1440, height: 900 });
    await setLocale("en");
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "task6-landing-1440-en.png") });
    console.log("Captured: task6-landing-1440-en.png");

    // 1b. Landing 1440px AR
    await setLocale("ar");
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "task6-landing-1440-ar.png") });
    console.log("Captured: task6-landing-1440-ar.png");

    // 1c. Landing 390px EN
    await page.setViewport({ width: 390, height: 844 });
    await setLocale("en");
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "task6-landing-390-en.png") });
    console.log("Captured: task6-landing-390-en.png");

    // 1d. Landing 390px AR
    await setLocale("ar");
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "task6-landing-390-ar.png") });
    console.log("Captured: task6-landing-390-ar.png");

    // -------------------------------------------------------------
    // 2. SIGNUP PAGE (1440px & 390px, EN & AR)
    // -------------------------------------------------------------
    // 2a. Signup 390px EN
    await page.setViewport({ width: 390, height: 844 });
    await setLocale("en");
    await page.goto(`${BASE_URL}/signup`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "task6-signup-390-en.png") });
    console.log("Captured: task6-signup-390-en.png");

    // 2b. Signup 390px AR
    await setLocale("ar");
    await page.goto(`${BASE_URL}/signup`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "task6-signup-390-ar.png") });
    console.log("Captured: task6-signup-390-ar.png");

    // 2c. Signup 1440px EN
    await page.setViewport({ width: 1440, height: 900 });
    await setLocale("en");
    await page.goto(`${BASE_URL}/signup`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "task6-signup-1440-en.png") });
    console.log("Captured: task6-signup-1440-en.png");

    // 2d. Signup 1440px AR
    await setLocale("ar");
    await page.goto(`${BASE_URL}/signup`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "task6-signup-1440-ar.png") });
    console.log("Captured: task6-signup-1440-ar.png");

    // -------------------------------------------------------------
    // 3. ONBOARDING STEP 1 (1440px & 390px, EN & AR)
    // -------------------------------------------------------------
    await setAuth(emptyCookie);

    // 3a. Onboarding Step 1 390px EN
    await page.setViewport({ width: 390, height: 844 });
    await setLocale("en");
    await page.goto(`${BASE_URL}/onboarding`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "task6-onboarding-step1-390-en.png") });
    console.log("Captured: task6-onboarding-step1-390-en.png");

    // 3b. Onboarding Step 1 390px AR
    await setLocale("ar");
    await page.goto(`${BASE_URL}/onboarding`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "task6-onboarding-step1-390-ar.png") });
    console.log("Captured: task6-onboarding-step1-390-ar.png");

    // 3c. Onboarding Step 1 1440px EN
    await page.setViewport({ width: 1440, height: 900 });
    await setLocale("en");
    await page.goto(`${BASE_URL}/onboarding`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "task6-onboarding-step1-1440-en.png") });
    console.log("Captured: task6-onboarding-step1-1440-en.png");

    // 3d. Onboarding Step 1 1440px AR
    await setLocale("ar");
    await page.goto(`${BASE_URL}/onboarding`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "task6-onboarding-step1-1440-ar.png") });
    console.log("Captured: task6-onboarding-step1-1440-ar.png");

    // -------------------------------------------------------------
    // 4. DASHBOARD (EMPTY STATE)
    // -------------------------------------------------------------
    // 4a. Dashboard Empty 1440px EN
    await page.setViewport({ width: 1440, height: 900 });
    await setLocale("en");
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "task6-dashboard-empty-1440-en.png") });
    console.log("Captured: task6-dashboard-empty-1440-en.png");

    // 4b. Dashboard Empty 1440px AR
    await setLocale("ar");
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "task6-dashboard-empty-1440-ar.png") });
    console.log("Captured: task6-dashboard-empty-1440-ar.png");

    // 4c. Dashboard Empty 390px EN
    await page.setViewport({ width: 390, height: 844 });
    await setLocale("en");
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "task6-dashboard-empty-390-en.png") });
    console.log("Captured: task6-dashboard-empty-390-en.png");

    // 4d. Dashboard Empty 390px AR
    await setLocale("ar");
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "task6-dashboard-empty-390-ar.png") });
    console.log("Captured: task6-dashboard-empty-390-ar.png");

    // -------------------------------------------------------------
    // 5. DASHBOARD (WITH A VAULT)
    // -------------------------------------------------------------
    await setAuth(vaultCookie);

    // 5a. Dashboard Vault 1440px EN
    await page.setViewport({ width: 1440, height: 900 });
    await setLocale("en");
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "task6-dashboard-vault-1440-en.png") });
    console.log("Captured: task6-dashboard-vault-1440-en.png");

    // 5b. Dashboard Vault 1440px AR
    await setLocale("ar");
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "task6-dashboard-vault-1440-ar.png") });
    console.log("Captured: task6-dashboard-vault-1440-ar.png");

    // 5c. Dashboard Vault 390px EN
    await page.setViewport({ width: 390, height: 844 });
    await setLocale("en");
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "task6-dashboard-vault-390-en.png") });
    console.log("Captured: task6-dashboard-vault-390-en.png");

    // 5d. Dashboard Vault 390px AR
    await setLocale("ar");
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "task6-dashboard-vault-390-ar.png") });
    console.log("Captured: task6-dashboard-vault-390-ar.png");

    // -------------------------------------------------------------
    // 6. BREAK SHEET MODAL (390px EN & AR)
    // -------------------------------------------------------------
    // 6a. Break Sheet 390px EN
    await page.setViewport({ width: 390, height: 844 });
    await setLocale("en");
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 800));
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const bBtn = btns.find((b) => b.textContent && b.textContent.includes("I need to break it"));
      if (bBtn) bBtn.click();
    });
    await new Promise((r) => setTimeout(r, 600));
    await page.focus("textarea");
    await page.type("textarea", "Limited sneaker drop at 360 Mall and they sell out in an hour!", { delay: 15 });
    await page.evaluate(() => {
      if (document.activeElement) document.activeElement.blur();
      window.scrollTo(0, 0);
    });
    await new Promise((r) => setTimeout(r, 400));
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "task6-break-sheet-390-en.png") });
    console.log("Captured: task6-break-sheet-390-en.png");

    // 6b. Break Sheet 390px AR
    await setLocale("ar");
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 800));
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const bBtn = btns.find((b) => b.textContent && b.textContent.includes("أبي أكسر القفل"));
      if (bBtn) bBtn.click();
    });
    await new Promise((r) => setTimeout(r, 600));
    await page.focus("textarea");
    await page.type("textarea", "لقيت سنيكرز بمجمع 360 ما يتعوض ويخلص بساعة!", { delay: 15 });
    await page.evaluate(() => {
      if (document.activeElement) document.activeElement.blur();
      window.scrollTo(0, 0);
    });
    await new Promise((r) => setTimeout(r, 400));
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "task6-break-sheet-390-ar.png") });
    console.log("Captured: task6-break-sheet-390-ar.png");

    // -------------------------------------------------------------
    // 7. KEYHOLDER CLEARANCE PAGE ON PHONE (390px EN & AR)
    // -------------------------------------------------------------
    await clearAuth();

    // 7a. Keyholder Phone 390px EN
    await page.setViewport({ width: 390, height: 844 });
    await setLocale("en");
    await page.goto(`${BASE_URL}/unlock/${unlockToken}`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "task6-keyholder-phone-390-en.png") });
    console.log("Captured: task6-keyholder-phone-390-en.png");

    // 7b. Keyholder Phone 390px AR
    await setLocale("ar");
    await page.goto(`${BASE_URL}/unlock/${unlockToken}`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "task6-keyholder-phone-390-ar.png") });
    console.log("Captured: task6-keyholder-phone-390-ar.png");

    console.log("\nALL 22 QA SCREENSHOTS CAPTURED SUCCESSFULLY!");
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error("QA Capture error:", err);
  process.exit(1);
});
