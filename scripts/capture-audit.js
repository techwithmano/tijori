/**
 * scripts/capture-audit.js
 * Automated Desktop-Only Visual Audit & Screenshot Capture Workflow for Tijori (تِجوري)
 * Resolution: 1440x900 (Desktop Viewport)
 */

const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer-core");

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const AUDIT_DIR = path.join(__dirname, "..", "audit");
const SCREENSHOTS_DIR = path.join(AUDIT_DIR, "screenshots");

function findBrowserExecutable() {
  const candidates = [
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
  ];

  for (const p of candidates) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  return process.env.PUPPETEER_EXECUTABLE_PATH || candidates[0];
}

async function fetchOrCreateActiveVaultAndToken() {
  try {
    const res = await fetch(`${BASE_URL}/api/vault`);
    const data = await res.json();
    if (data.success && data.vault) {
      const vaultId = data.vault._id;
      let token = data.vault.unlockToken;

      // Ensure an active token exists for capturing the tokenized decision screen
      if (!token) {
        const unlockRes = await fetch(`${BASE_URL}/api/vault/${vaultId}/unlock`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "REQUEST",
            reason: "Flash sneaker drop at 360 Mall and it ends tonight 👟",
          }),
        });
        const unlockData = await unlockRes.json();
        token = unlockData.token;
      }

      return { vaultId, token };
    }
  } catch (err) {
    console.warn("Could not fetch latest vault via API:", err.message);
  }
  return { vaultId: "demo", token: "demo-token" };
}

async function runAudit() {
  console.log("=================================================");
  console.log("   TIJORI (تِجوري) - DESKTOP AUDIT CAPTURE (1440x900)  ");
  console.log("=================================================");

  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
    console.log(`Created directory: ${SCREENSHOTS_DIR}`);
  }

  const browserPath = findBrowserExecutable();
  console.log(`Using Browser executable: ${browserPath}`);

  const { vaultId, token } = await fetchOrCreateActiveVaultAndToken();
  console.log(`Active Vault ID: ${vaultId} | Active Single-Use Token: ${token}`);

  const browser = await puppeteer.launch({
    executablePath: browserPath,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-gpu",
      "--hide-scrollbars",
      "--force-color-profile=srgb",
    ],
  });

  const screenshotsLog = [];

  const targets = [
    {
      name: "01_dashboard_desktop.png",
      url: `${BASE_URL}/`,
      viewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
      description: "Main Vault Dashboard Desktop (1440x900) - Judges Demo Bar, Progress Ring, Allowance Timeline & Savings Ledger",
      action: async (page) => {
        await page.waitForSelector("#simulate-pull-btn", { timeout: 15000 }).catch(() => {});
        await new Promise((r) => setTimeout(r, 1500));
      },
    },
    {
      name: "02_emergency_break_modal_desktop.png",
      url: `${BASE_URL}/?modal=true`,
      viewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
      description: "Emergency Break Modal Desktop (1440x900) - Social Friction, 5% Discipline Tax Warning, Excuse & WhatsApp Share",
      action: async (page) => {
        await page.waitForSelector("#request-break-btn", { timeout: 15000 }).catch(() => {});
        const btn = await page.$("#request-break-btn");
        if (btn) {
          await btn.click().catch(() => {});
        }
        await page.waitForSelector("textarea", { timeout: 10000 }).catch(() => {});
        await new Promise((r) => setTimeout(r, 1200));
      },
    },
    {
      name: "03_keyholder_clearance_desktop.png",
      url: `${BASE_URL}/unlock/${token}`,
      viewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
      description: "Keyholder Decision Screen Desktop (1440x900) - 256-Bit Channel, Stated Excuse, Gemini AI Reality Check Roast, Deny & Approve CTAs",
      action: async (page) => {
        let activeToken = token;
        try {
          const checkRes = await fetch(`${BASE_URL}/api/unlock/${token}`);
          if (checkRes.status === 404) {
            const reqRes = await fetch(`${BASE_URL}/api/vault/${vaultId}/unlock`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "REQUEST",
                reason: "Flash sneaker drop at 360 Mall and it ends tonight 👟",
              }),
            });
            const reqData = await reqRes.json();
            activeToken = reqData.token;
            await page.goto(`${BASE_URL}/unlock/${activeToken}`, { waitUntil: "networkidle2" });
          }
        } catch (e) {}

        await page.waitForSelector("button", { timeout: 15000 }).catch(() => {});
        await new Promise((r) => setTimeout(r, 1500));
      },
    },
    {
      name: "04_create_wizard_desktop.png",
      url: `${BASE_URL}/create`,
      viewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
      description: "Creation Wizard Desktop (1440x900) - Clean Inputs, Quick-Pick Goal Chips & Interactive AI Allowance Pacing Preview",
      action: async (page) => {
        await page.waitForSelector("form", { timeout: 15000 }).catch(() => {});
        await new Promise((r) => setTimeout(r, 1500));
      },
    },
    {
      name: "05_auth_login_desktop.png",
      url: `${BASE_URL}/login`,
      viewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
      description: "Authentication Screen Desktop (1440x900) - Calm Trust Porcelain Card with 1-Click Judge Credentials Auto-Fill",
      action: async (page) => {
        await page.waitForSelector("form", { timeout: 15000 }).catch(() => {});
        await new Promise((r) => setTimeout(r, 1200));
      },
    },
  ];

  for (const item of targets) {
    console.log(`\nCapturing Desktop: ${item.name} (${item.viewport.width}x${item.viewport.height})...`);
    const page = await browser.newPage();
    try {
      await page.setViewport(item.viewport);
      await page.goto(item.url, { waitUntil: "networkidle2", timeout: 35000 });

      if (item.action) {
        await item.action(page);
      }

      const filePath = path.join(SCREENSHOTS_DIR, item.name);
      await page.screenshot({ path: filePath, fullPage: false });

      const stats = fs.statSync(filePath);
      const sizeKB = (stats.size / 1024).toFixed(1);

      console.log(`  ✓ Saved: ${filePath} (${sizeKB} KB)`);
      screenshotsLog.push({
        name: item.name,
        route: item.url.replace(BASE_URL, "") || "/",
        viewport: `${item.viewport.width}x${item.viewport.height}`,
        device: "Desktop (1440x900)",
        size: `${sizeKB} KB`,
        description: item.description,
      });
    } catch (err) {
      console.error(`  ✗ Error capturing ${item.name}:`, err.message);
    } finally {
      await page.close();
    }
  }

  await browser.close();
  console.log("\nAll desktop screenshots captured successfully!");
  console.table(screenshotsLog);

  return screenshotsLog;
}

if (require.main === module) {
  runAudit().catch((err) => {
    console.error("Fatal audit capture error:", err);
    process.exit(1);
  });
}

module.exports = { runAudit };
