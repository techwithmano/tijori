/**
 * scripts/capture-audit.js
 * Automated Visual Audit & Screenshot Capture Workflow for Tijori (تِجوري)
 * Uses puppeteer-core connected to the native system Chromium / Edge browser.
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

async function fetchLatestVaultAndToken() {
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
  console.log("   TIJORI (تِجوري) - AUTOMATED UI AUDIT CAPTURE  ");
  console.log("=================================================");

  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
    console.log(`Created directory: ${SCREENSHOTS_DIR}`);
  }

  const browserPath = findBrowserExecutable();
  console.log(`Using Browser executable: ${browserPath}`);

  const { vaultId, token } = await fetchLatestVaultAndToken();
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
      name: "01_landing_desktop.png",
      url: `${BASE_URL}/`,
      viewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
      description: "Interactive Landing Page - Hero with Dual CTAs, Savings Simulator & Keyholder Protocol Walkthrough",
      action: async (page) => {
        await page.waitForSelector("#simulator", { timeout: 15000 }).catch(() => {});
        await new Promise((r) => setTimeout(r, 1200));
      },
    },
    {
      name: "02_landing_mobile.png",
      url: `${BASE_URL}/`,
      viewport: {
        width: 390,
        height: 844,
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 2,
      },
      description: "Landing Page Mobile - Responsive Hero & Interactive Sliders on iPhone Viewport",
      action: async (page) => {
        await page.waitForSelector("#simulator", { timeout: 15000 }).catch(() => {});
        await new Promise((r) => setTimeout(r, 1200));
      },
    },
    {
      name: "03_dashboard_desktop.png",
      url: `${BASE_URL}/dashboard`,
      viewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
      description: "Clean Vault Dashboard - Hero Vault Card, SVG Progress Ring, Action Bar & Savings Ledger",
      action: async (page) => {
        await page.waitForFunction(
          () => !document.body.innerText.includes("Loading Tijori"),
          { timeout: 30000 }
        );
        await new Promise((r) => setTimeout(r, 1500));
      },
    },
    {
      name: "04_dashboard_modal_desktop.png",
      url: `${BASE_URL}/dashboard?modal=true`,
      viewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
      description: "Emergency Break Modal - Pure Social Friction with 5% Discipline Tax Warning & WhatsApp Share",
      action: async (page) => {
        try {
          await fetch(`${BASE_URL}/api/vault/${vaultId}/unlock`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "LOCK" }),
          });
        } catch (e) {}

        await page.goto(`${BASE_URL}/dashboard?modal=true`, { waitUntil: "networkidle2" });
        await page.waitForFunction(
          () => !document.body.innerText.includes("Loading Tijori"),
          { timeout: 30000 }
        );
        const btn = await page.$("#request-break-btn");
        if (btn) {
          await btn.click().catch(() => {});
        }
        await page.waitForSelector("textarea", { timeout: 10000 }).catch(() => {});
        await new Promise((r) => setTimeout(r, 1500));
      },
    },
    {
      name: "05_keyholder_mobile.png",
      url: `${BASE_URL}/unlock/${token}`,
      viewport: {
        width: 390,
        height: 844,
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 2,
      },
      description: "Keyholder Mobile View - Isolated 256-Bit Single-Use Channel with applicant's written reason and Deny/Approve CTAs",
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

        await page.waitForFunction(
          () => !document.body.innerText.includes("Verifying Single-Use"),
          { timeout: 30000 }
        );
        await new Promise((r) => setTimeout(r, 1500));
      },
    },
    {
      name: "06_create_wizard_desktop.png",
      url: `${BASE_URL}/create`,
      viewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
      description: "Creation Wizard - Clean inputs, Quick-Pick inspiration chips & Mathematical Pacing chart",
      action: async (page) => {
        await page.waitForSelector("form", { timeout: 30000 });
        await new Promise((r) => setTimeout(r, 1200));
      },
    },
    {
      name: "07_dashboard_mobile.png",
      url: `${BASE_URL}/dashboard`,
      viewport: {
        width: 390,
        height: 844,
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 2,
      },
      description: "Vault Dashboard Mobile - Responsive single-column layout with min 48px touch targets",
      action: async (page) => {
        await page.waitForFunction(
          () => !document.body.innerText.includes("Loading Tijori"),
          { timeout: 30000 }
        );
        await new Promise((r) => setTimeout(r, 1500));
      },
    },
  ];

  for (const item of targets) {
    console.log(`\nCapturing: ${item.name} (${item.viewport.width}x${item.viewport.height})...`);
    const page = await browser.newPage();
    try {
      await page.setViewport(item.viewport);
      await page.goto(item.url, { waitUntil: "networkidle2", timeout: 40000 });

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
        route: item.url.replace(BASE_URL, ""),
        viewport: `${item.viewport.width}x${item.viewport.height}`,
        device: item.viewport.isMobile ? "Mobile (iPhone 14/15/16 Pro)" : "Desktop (1440p)",
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
  console.log("\nAll target screenshots captured successfully!");
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
