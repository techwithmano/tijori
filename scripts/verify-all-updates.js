const puppeteer = require("puppeteer-core");
const path = require("path");

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

async function verify() {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log("Navigating to http://localhost:3000...");
  await page.goto("http://localhost:3000", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 1500));

  // 1. Capture Hero with new coins and glowing dial ring
  await page.screenshot({ path: path.join(__dirname, "verify_hero_idle.png") });
  console.log("Captured verify_hero_idle.png");

  // 2. Test Vault Click: click button and capture recoil tilt & spin
  const vaultBtn = await page.$("#vault-3d-anchor button");
  if (vaultBtn) {
    console.log("Clicking vault to test 3D recoil tilt and wheel spin...");
    await vaultBtn.click();
    await new Promise((r) => setTimeout(r, 120)); // Right during peak recoil
    await page.screenshot({ path: path.join(__dirname, "verify_vault_recoil_tilt.png") });
    console.log("Captured verify_vault_recoil_tilt.png");
  }

  // 3. Scroll to the new Section 4.5: The Two Rules (5% Friend Approval vs 50% Self-Break)
  console.log("Scrolling to Unlock Rules section...");
  await page.evaluate(() => {
    const el = document.getElementById("unlock-rules");
    if (el) el.scrollIntoView();
  });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: path.join(__dirname, "verify_unlock_rules_en.png") });
  console.log("Captured verify_unlock_rules_en.png");

  // 4. Test Arabic
  console.log("Switching to Arabic...");
  await page.evaluate(() => {
    localStorage.setItem("tijori_lang", "ar");
    window.location.reload();
  });
  await new Promise((r) => setTimeout(r, 1500));

  // Capture Arabic Hero
  await page.screenshot({ path: path.join(__dirname, "verify_hero_ar.png") });
  console.log("Captured verify_hero_ar.png");

  // Capture Arabic Unlock Rules
  await page.evaluate(() => {
    const el = document.getElementById("unlock-rules");
    if (el) el.scrollIntoView();
  });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: path.join(__dirname, "verify_unlock_rules_ar.png") });
  console.log("Captured verify_unlock_rules_ar.png");

  await browser.close();
  console.log("All visual verification tests completed successfully!");
}

verify().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
