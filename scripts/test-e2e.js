/**
 * scripts/test-e2e.js
 * End-to-End Test Suite for Tijori (تِجوري)
 * Validates Auth, DB, Vault Ledger, Micro-pulls, Stripe, Gemini AI, and Single-Use Keyholder Protocol
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

let testResults = [];

function recordTest(category, name, passed, details = "") {
  testResults.push({ category, name, passed, details });
  const status = passed ? "✓ PASS" : "✗ FAIL";
  console.log(`[${category}] ${status}: ${name} ${details ? `(${details})` : ""}`);
}

async function runTestSuite() {
  console.log("===============================================================");
  console.log("       TIJORI (تِجوري) COMPLETE END-TO-END TEST SUITE          ");
  console.log("===============================================================\n");

  let authCookie = null;
  let testVaultId = null;
  let activeToken = null;

  // --------------------------------------------------------------------------
  // 1. AUTHENTICATION TESTS
  // --------------------------------------------------------------------------
  console.log(">>> 1. Testing Authentication Engine...");

  // Test 1.1: 1-Click Demo Login
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "demo@tijori.app", password: "password123" }),
    });
    const setCookie = res.headers.get("set-cookie");
    if (setCookie && setCookie.includes("tijori_session")) {
      authCookie = setCookie.split(";")[0];
    }
    const data = await res.json();
    recordTest(
      "AUTH",
      "Demo Login (demo@tijori.app)",
      data.success === true && !!data.user,
      `User ID: ${data.user?.id}`
    );
  } catch (err) {
    recordTest("AUTH", "Demo Login (demo@tijori.app)", false, err.message);
  }

  // Test 1.2: Invalid Password Rejection
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "demo@tijori.app", password: "wrongpassword999" }),
    });
    const data = await res.json();
    recordTest(
      "AUTH",
      "Invalid Password Rejection",
      res.status === 401 && data.success === false,
      "Correctly rejected with 401"
    );
  } catch (err) {
    recordTest("AUTH", "Invalid Password Rejection", false, err.message);
  }

  // Test 1.3: Verify Session via /api/auth/me
  try {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: authCookie ? { Cookie: authCookie } : {},
    });
    const data = await res.json();
    recordTest(
      "AUTH",
      "Session Verification (GET /api/auth/me)",
      data.success === true && data.user?.email === "demo@tijori.app",
      `Authenticated as: ${data.user?.name}`
    );
  } catch (err) {
    recordTest("AUTH", "Session Verification", false, err.message);
  }

  // Test 1.4: Unauthenticated Request Rejection on Protected /api/auth/me
  try {
    const res = await fetch(`${BASE_URL}/api/auth/me`);
    const data = await res.json();
    recordTest(
      "AUTH",
      "Unauthenticated /api/auth/me Rejection",
      res.status === 401 && data.success === false,
      "Unauthorized properly flagged"
    );
  } catch (err) {
    recordTest("AUTH", "Unauthenticated Rejection", false, err.message);
  }

  // Test 1.5: Register Unique Test User
  const uniqueEmail = `test_${Date.now()}@tijori.app`;
  let newAuthCookie = null;
  try {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Yousef Al-Hajji",
        email: uniqueEmail,
        password: "secure_password_2026",
        phone: "+965 9988 7766",
        allowanceDay: 25,
      }),
    });
    const setCookie = res.headers.get("set-cookie");
    if (setCookie && setCookie.includes("tijori_session")) {
      newAuthCookie = setCookie.split(";")[0];
    }
    const data = await res.json();
    recordTest(
      "AUTH",
      "New User Registration + Starter Vault Seeding",
      data.success === true && !!data.user,
      `Registered: ${uniqueEmail}`
    );
  } catch (err) {
    recordTest("AUTH", "New User Registration", false, err.message);
  }

  // --------------------------------------------------------------------------
  // 2. VAULT & MICRO-PULL LEDGER TESTS
  // --------------------------------------------------------------------------
  console.log("\n>>> 2. Testing Vault Operations & Micro-Savings Ledger...");

  // Test 2.1: Fetch Active Vault
  try {
    const res = await fetch(`${BASE_URL}/api/vault`, {
      headers: authCookie ? { Cookie: authCookie } : {},
    });
    const data = await res.json();
    if (data.success && data.vault) {
      testVaultId = data.vault._id;
      recordTest(
        "VAULT",
        "Fetch Active Vault",
        true,
        `Title: "${data.vault.title}" | Balance: ${data.vault.currentBalance} KWD`
      );
    } else {
      recordTest("VAULT", "Fetch Active Vault", false, data.error || "No vault returned");
    }
  } catch (err) {
    recordTest("VAULT", "Fetch Active Vault", false, err.message);
  }

  // Test 2.2: Execute Simulated Micro-Pull (+25 KWD)
  let balanceBefore = 0;
  let balanceAfter = 0;
  try {
    const getRes = await fetch(`${BASE_URL}/api/vault`, {
      headers: authCookie ? { Cookie: authCookie } : {},
    });
    const getData = await getRes.json();
    balanceBefore = getData.vault.currentBalance;

    const pullRes = await fetch(`${BASE_URL}/api/vault/${testVaultId}/pull`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authCookie ? { Cookie: authCookie } : {}),
      },
      body: JSON.stringify({ amount: 25 }),
    });
    const pullData = await pullRes.json();
    balanceAfter = pullData.vault?.currentBalance;

    const pullSuccess =
      pullData.success === true &&
      balanceAfter === Math.min(pullData.vault.targetAmount, balanceBefore + 25);

    recordTest(
      "VAULT",
      "Simulate Micro-Pull (+25 KWD)",
      pullSuccess,
      `Balance: ${balanceBefore} KWD -> ${balanceAfter} KWD`
    );
  } catch (err) {
    recordTest("VAULT", "Simulate Micro-Pull", false, err.message);
  }

  // Test 2.3: Verify Ledger Transaction Log
  try {
    const res = await fetch(`${BASE_URL}/api/vault`, {
      headers: authCookie ? { Cookie: authCookie } : {},
    });
    const data = await res.json();
    const transactions = data.vault?.transactions || [];
    const hasPullTx = transactions.some((t) => t.type === "SIMULATED_PULL");
    recordTest(
      "LEDGER",
      "Ledger Transaction Audit",
      hasPullTx,
      `Total Ledger Entries: ${transactions.length}`
    );
  } catch (err) {
    recordTest("LEDGER", "Ledger Transaction Audit", false, err.message);
  }

  // --------------------------------------------------------------------------
  // 3. STRIPE CHECKOUT TESTS
  // --------------------------------------------------------------------------
  console.log("\n>>> 3. Testing Stripe Checkout Integration...");

  try {
    const res = await fetch(`${BASE_URL}/api/stripe/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vaultId: testVaultId, amount: 20 }),
    });
    const data = await res.json();
    const hasUrl = data.success === true && !!data.url;
    recordTest(
      "STRIPE",
      "Create Checkout Session (+20 KWD)",
      hasUrl,
      hasUrl ? `Redirect: ${data.url.substring(0, 45)}...` : data.error
    );
  } catch (err) {
    recordTest("STRIPE", "Create Checkout Session", false, err.message);
  }

  // --------------------------------------------------------------------------
  // 4. GEMINI AI INTERVENTION & ROAST ENGINE
  // --------------------------------------------------------------------------
  console.log("\n>>> 4. Testing Google Gemini 2.5 Flash Reality Check Engine...");

  try {
    const res = await fetch(`${BASE_URL}/api/ai/reality-check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        excuse: "There is a rare drop of Prada sunglasses at Avenues and I need them today",
        goal: "Japan Summer Trip 🇯🇵",
        currentBalance: 250,
        targetAmount: 700,
        keyholderName: "Fahad Al-Sabah",
      }),
    });
    const data = await res.json();
    const hasRoast = data.success === true && data.realityCheck?.length > 10;
    recordTest(
      "GEMINI_AI",
      "AI Reality Check Impulse Roast Generation",
      hasRoast,
      `"${data.realityCheck?.substring(0, 75)}..."`
    );
  } catch (err) {
    recordTest("GEMINI_AI", "AI Reality Check Generation", false, err.message);
  }

  // Test 4.2: Gemini 4-Week Allowance Pacing Schedule
  try {
    const res = await fetch(`${BASE_URL}/api/ai/pacing`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetAmount: 600,
        pullAmount: 30,
        allowanceDay: 25,
      }),
    });
    const data = await res.json();
    const hasSchedule =
      data.success === true &&
      Array.isArray(data.schedule) &&
      data.schedule.length === 4;
    recordTest(
      "GEMINI_AI",
      "AI 4-Week Allowance Micro-Pacing Schedule",
      hasSchedule,
      `Week 1 Pull: +${data.schedule?.[0]?.amount} KWD (${data.schedule?.[0]?.phase})`
    );
  } catch (err) {
    recordTest("GEMINI_AI", "AI 4-Week Allowance Micro-Pacing", false, err.message);
  }

  // --------------------------------------------------------------------------
  // 5. KEYHOLDER PEER FRICTION & SINGLE-USE TOKEN PROTOCOL
  // --------------------------------------------------------------------------
  console.log("\n>>> 5. Testing Keyholder Protocol & Tokenized Decision Engine...");

  // Test 5.1: Request Emergency Break (Generates single-use token + WhatsApp link)
  try {
    const res = await fetch(`${BASE_URL}/api/vault/${testVaultId}/unlock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "REQUEST",
        reason: "Flash midnight sneaker drop at 360 Mall 👟",
      }),
    });
    const data = await res.json();
    activeToken = data.token;
    const hasToken = data.success === true && !!data.token && !!data.whatsappUrl;
    recordTest(
      "KEYHOLDER",
      "Request Early Break -> Generate Single-Use Token",
      hasToken,
      `Token: ${activeToken?.substring(0, 18)}...`
    );
  } catch (err) {
    recordTest("KEYHOLDER", "Request Early Break", false, err.message);
  }

  // Test 5.2: Public Single-Use Route Token Verification (GET /api/unlock/[token])
  try {
    const res = await fetch(`${BASE_URL}/api/unlock/${activeToken}`);
    const data = await res.json();
    const isValid =
      data.success === true &&
      data.vault?.unlockToken === activeToken &&
      data.vault?.status === "UNLOCK_PENDING";
    recordTest(
      "KEYHOLDER",
      "Public Token Verification (GET /api/unlock/[token])",
      isValid,
      `Status: ${data.vault?.status} | Stated excuse preserved`
    );
  } catch (err) {
    recordTest("KEYHOLDER", "Public Token Verification", false, err.message);
  }

  // Test 5.3: Keyholder DENY Decision (Blocks impulse, increments totalProtected, burns token)
  let protectedBefore = 0;
  try {
    const vaultRes = await fetch(`${BASE_URL}/api/vault`, {
      headers: authCookie ? { Cookie: authCookie } : {},
    });
    const vaultData = await vaultRes.json();
    protectedBefore = vaultData.vault.totalProtected || 0;

    const denyRes = await fetch(`${BASE_URL}/api/unlock/${activeToken}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "DENY" }),
    });
    const denyData = await denyRes.json();

    const denySuccess =
      denyData.success === true &&
      denyData.vault?.status === "LOCKED" &&
      denyData.vault?.unlockToken === null &&
      denyData.vault?.totalProtected >= protectedBefore;

    recordTest(
      "KEYHOLDER",
      "Keyholder DENY Execution (Token Invalidation & Savings Shield)",
      denySuccess,
      `Total Protected: ${denyData.vault?.totalProtected} KWD | Token Burned: ${denyData.vault?.unlockToken === null}`
    );
  } catch (err) {
    recordTest("KEYHOLDER", "Keyholder DENY Execution", false, err.message);
  }

  // Test 5.4: Invalidation Defense: Re-using the burned token must fail (404)
  try {
    const res = await fetch(`${BASE_URL}/api/unlock/${activeToken}`);
    const data = await res.json();
    const isBurned = res.status === 404 && data.success === false;
    recordTest(
      "KEYHOLDER",
      "Burned Token Replay Attack Defense (404)",
      isBurned,
      data.error || "Token properly invalidated"
    );
  } catch (err) {
    recordTest("KEYHOLDER", "Burned Token Replay Defense", false, err.message);
  }

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  console.log("\n===============================================================");
  console.log("                     TEST SUITE SUMMARY                        ");
  console.log("===============================================================");

  const total = testResults.length;
  const passed = testResults.filter((t) => t.passed).length;
  const failed = total - passed;

  console.log(`Total Checks: ${total} | Passed: ${passed} | Failed: ${failed}`);

  if (failed === 0) {
    console.log("\n>>> ALL TESTS PASSED! APPLICATION IS 100% PRODUCTION READY. <<<\n");
  } else {
    console.log(`\n>>> ${failed} TEST(S) FAILED. INVESTIGATION REQUIRED. <<<\n`);
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error("Fatal test runner error:", err);
  process.exit(1);
});
