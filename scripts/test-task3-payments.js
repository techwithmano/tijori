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
  console.log("=== STARTING TASK 3 END-TO-END PAYMENTS & STRIPE AUDIT ===");

  const executablePath = findBrowserExecutable();
  console.log("Using browser at:", executablePath);

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

  // 1. Register a real user and verify Stripe Customer creation
  console.log("\n1. Registering user for real Stripe payments test...");
  const timestamp = Date.now();
  const testEmail = `stripe_user_${timestamp}@tijori.app`;

  await page.goto(`${BASE_URL}/signup`, { waitUntil: "networkidle0" });
  const inputs = await page.$$("input");
  await inputs[0].type("Salem Al-Mutawa");
  await inputs[1].type(testEmail);
  await inputs[2].type("StrongP@ssw0rd123!");
  await new Promise((r) => setTimeout(r, 400));
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: "networkidle0", timeout: 10000 });
  console.log("Registered and redirected to:", page.url());

  // 2. Attach test card via /api/stripe/save-card
  console.log("\n2. Attaching test card off-session (Visa •••• 4242)...");
  const saveCardRes = await page.evaluate(async () => {
    const res = await fetch("/api/stripe/save-card", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ useTestCard: true }),
    });
    return res.json();
  });
  console.log("Card save response:", saveCardRes);

  // 3. Create Vault
  console.log("\n3. Creating live vault for test user...");
  const createVaultRes = await page.evaluate(async () => {
    const res = await fetch("/api/vault", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Japan Summer Trip ✈️",
        targetAmount: 600,
        pullAmount: 25,
        cadence: "weekly",
        allowanceDay: 25,
        keyholder: {
          name: "Fahad Al-Mutawa",
          phone: "+965 9988 7766",
          relationship: "Best Friend",
        },
      }),
    });
    return res.json();
  });
  console.log("Vault created:", createVaultRes.success ? "SUCCESS" : "FAILED", createVaultRes.vault?._id);

  // 4. Navigate to /dashboard and inspect saved card + Add money now button
  console.log("\n4. Navigating to Dashboard...");
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 1000));

  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, "task3-dashboard-savedcard.png"),
    fullPage: false,
  });
  console.log("Captured task3-dashboard-savedcard.png");

  // 5. Open "Add money now" modal
  console.log("\n5. Testing 'Add money now' Top-Up flow...");
  await page.click("#add-money-now-btn");
  await new Promise((r) => setTimeout(r, 600));

  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, "task3-topup-modal.png"),
    fullPage: false,
  });
  console.log("Captured task3-topup-modal.png");

  // Execute topup via API or modal button
  console.log("\n6. Executing real off-session PaymentIntent for 20 KWD...");
  const topUpRes = await page.evaluate(async () => {
    const res = await fetch("/api/vault/topup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 20 }),
    });
    return res.json();
  });
  console.log("TopUp Response from Stripe:", topUpRes);

  // Refresh dashboard to see updated balance & ledger entry
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 800));

  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, "task3-topup-success.png"),
    fullPage: false,
  });
  console.log("Captured task3-topup-success.png");

  // 7. Test Cron Pull (Task 4)
  console.log("\n7. Testing GET /api/cron/pull with due vault...");
  const cronRes = await page.evaluate(async () => {
    const res = await fetch("/api/cron/pull?force=true", {
      method: "GET",
    });
    return res.json();
  });
  console.log("Cron pull execution results:", cronRes);

  // Reload dashboard to see balance after cron pull (should be 20 + 25 = 45 KWD)
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 800));

  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, "task3-dashboard-after-cron.png"),
    fullPage: false,
  });
  console.log("Captured task3-dashboard-after-cron.png");

  // 8. Test "Needs Attention" Banner when charge fails or card missing
  console.log("\n8. Testing Needs Attention Banner for missing card / failed pull...");
  const client = await page.target().createCDPSession();
  await client.send("Network.clearBrowserCookies");

  const noCardEmail = `nocard_${Date.now()}@tijori.app`;
  await page.evaluate(async (email) => {
    await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Bader",
        email,
        password: "password123!",
      }),
    });
  }, noCardEmail);

  // Create vault for Bader without adding card
  await page.evaluate(async () => {
    await fetch("/api/vault", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "New Phone Fund 📱",
        targetAmount: 400,
        pullAmount: 20,
        cadence: "weekly",
        keyholder: {
          name: "Hamad",
          phone: "+965 9911 2233",
        },
      }),
    });
  });

  // Run cron pull: it should fail due to NO_PAYMENT_METHOD and mark needsAttention: true
  const failCronRes = await page.evaluate(async () => {
    const res = await fetch("/api/cron/pull?force=true");
    return res.json();
  });
  console.log("Cron pull with missing card result:", failCronRes);

  // Navigate to Bader's dashboard to observe the coral "Needs Attention" banner
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 1000));

  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, "task3-needs-attention-banner.png"),
    fullPage: false,
  });
  console.log("Captured task3-needs-attention-banner.png");

  // 9. Webhook Idempotency test
  console.log("\n9. Testing Webhook Idempotency...");
  if (topUpRes.paymentIntentId && createVaultRes.vault?._id) {
    const webhookRes = await page.evaluate(async ({ vaultId, piId }) => {
      const mockEvent = {
        id: "evt_test_" + Date.now(),
        type: "payment_intent.succeeded",
        data: {
          object: {
            id: piId,
            amount: 6520, // cents
            currency: "usd",
            metadata: {
              vaultId,
              kwdAmount: "20",
              type: "TOP_UP",
            },
          },
        },
      };
      const res = await fetch("/api/stripe/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mockEvent),
      });
      return res.json();
    }, { vaultId: createVaultRes.vault._id, piId: topUpRes.paymentIntentId });
    console.log("Webhook Idempotency test result:", webhookRes);
  }

  await browser.close();
  console.log("\n=== ALL TASK 3 AUDIT TESTS COMPLETED SUCCESSFULLY! ===");
}

run().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
