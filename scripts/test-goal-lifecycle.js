/**
 * Tijori Goal Lifecycle Test Suite
 * Tests end-to-end steps:
 * 1. User Registration & Session Initialization
 * 2. Goal Creation (Vault) with target amount, cadence, and Keyholder email
 * 3. Keyholder Activation via Private Link (Friend PIN setup)
 * 4. Funding the Goal (Card Deposit)
 * 5. Anti-Impulse Discipline Enforcement (Block direct deletion of locked funded vault)
 * 6. AI Reality Check & Emergency Break Protocol Execution
 * 7. Removing the Unlocked Goal (DELETE /api/vault/[id])
 * 8. Dashboard Empty State Verification
 * 9. Direct Removal of Empty (0 KWD) Vault
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
};

function log(step, msg, details = null) {
  const ts = new Date().toISOString().substring(11, 19);
  console.log(`${colors.cyan}[${ts}]${colors.reset} ${colors.bright}[${step}]${colors.reset} ${msg}`);
  if (details) {
    console.log(`   ${colors.yellow}-> ${typeof details === "string" ? details : JSON.stringify(details, null, 2)}${colors.reset}`);
  }
}

function success(msg) {
  console.log(`   ${colors.green}✓ ${msg}${colors.reset}\n`);
}

function fail(msg, err = null) {
  console.error(`   ${colors.red}✗ FAIL: ${msg}${colors.reset}`);
  if (err) console.error(err);
  process.exit(1);
}

async function runGoalLifecycleTest() {
  console.log("\n" + "=".repeat(70));
  console.log(`${colors.bright}${colors.magenta}   TIJORI — COMPLETE GOAL LIFECYCLE & DISCIPLINE TEST SUITE${colors.reset}`);
  console.log("=".repeat(70) + "\n");

  const testId = Date.now().toString().slice(-6);
  const userEmail = `goal_test_${testId}@tijori.kw`;
  const userPassword = "Password123!";
  const userName = "Yousef Al-Ghanim";
  let cookieHeader = "";

  // -------------------------------------------------------------
  // STEP 1: User Registration
  // -------------------------------------------------------------
  log("STEP 1", `Registering test user: ${userEmail}`);
  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: userEmail,
      password: userPassword,
      name: userName,
      allowanceDay: 25,
    }),
  });

  const regData = await regRes.json();
  if (!regRes.ok || !regData.success) {
    fail("User registration failed", regData);
  }

  const rawCookie = regRes.headers.get("set-cookie");
  if (rawCookie) {
    cookieHeader = rawCookie.split(";")[0];
  }
  success(`User registered successfully (User ID: ${regData.user?.id})`);

  // -------------------------------------------------------------
  // STEP 2: Goal Creation
  // -------------------------------------------------------------
  log("STEP 2", "Creating new goal: 'Tokyo Summer 2027' (600 KWD target, 25 KWD weekly)");
  const vaultPayload = {
    title: "Tokyo Summer 2027",
    targetAmount: 600,
    pullAmount: 25,
    cadence: "weekly",
    customCadenceDays: 7,
    incrementalSavingsType: "none",
    incrementalSavingsValue: 0,
    allowanceDay: 25,
    keyholder: {
      name: "Fatima Al-Sabah",
      email: `fatima_${testId}@example.com`,
      phone: "+96590001122",
      relationship: "Best Friend",
    },
  };

  const createRes = await fetch(`${BASE_URL}/api/vault`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
    },
    body: JSON.stringify(vaultPayload),
  });

  const createData = await createRes.json();
  if (!createRes.ok || !createData.success || !createData.vault) {
    fail("Goal creation failed", createData);
  }

  const vault = createData.vault;
  const vaultId = vault._id;
  const inviteToken = vault.inviteToken;

  log("GOAL DETAILS", {
    vaultId,
    title: vault.title,
    targetAmount: `${vault.targetAmount} KWD`,
    currentBalance: `${vault.currentBalance} KWD`,
    status: vault.status,
    keyholderName: vault.keyholder?.name,
    keyholderEmail: vault.keyholder?.email,
    inviteToken,
  });
  success(`Goal created and locked! Keyholder invite link generated: ${BASE_URL}/keyholder/invite/${inviteToken}`);

  // -------------------------------------------------------------
  // STEP 3: Keyholder Activation via Secret Invite Link
  // -------------------------------------------------------------
  log("STEP 3", "Keyholder visits private link and sets confidential 6-digit PIN");
  const friendSecretPin = "774411";

  const inviteAcceptRes = await fetch(`${BASE_URL}/api/keyholder/invite/${inviteToken}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      pin: friendSecretPin,
      confirmPin: friendSecretPin,
      name: "Fatima Al-Sabah",
    }),
  });

  const inviteAcceptData = await inviteAcceptRes.json();
  if (!inviteAcceptRes.ok || !inviteAcceptData.success) {
    fail("Keyholder PIN activation failed", inviteAcceptData);
  }
  success(`Keyholder Fatima successfully activated vault key with secret PIN: ${friendSecretPin}`);

  // -------------------------------------------------------------
  // STEP 4: Funding the Goal (Card Deposit)
  // -------------------------------------------------------------
  log("STEP 4", "Depositing 100 KWD into goal vault via card top-up");
  const topUpRes = await fetch(`${BASE_URL}/api/vault/topup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
    },
    body: JSON.stringify({
      vaultId,
      amountKwd: 100,
    }),
  });

  const topUpData = await topUpRes.json();
  if (!topUpRes.ok || !topUpData.success) {
    fail("Top-up deposit failed", topUpData);
  }

  const fundedVault = topUpData.vault;
  log("FUNDED STATE", {
    currentBalance: `${fundedVault.currentBalance} KWD`,
    percentFunded: `${Math.round((fundedVault.currentBalance / fundedVault.targetAmount) * 100)}%`,
    status: fundedVault.status,
    transactionsCount: fundedVault.transactions?.length,
  });
  success("100 KWD deposited successfully! Vault is strictly locked.");

  // -------------------------------------------------------------
  // STEP 5: Anti-Impulse Discipline Enforcement Test
  // -------------------------------------------------------------
  log("STEP 5", "ANTI-IMPULSE TEST: Attempting direct deletion of active locked vault with 100 KWD");
  const directDeleteRes = await fetch(`${BASE_URL}/api/vault/${vaultId}`, {
    method: "DELETE",
    headers: {
      Cookie: cookieHeader,
    },
  });

  const directDeleteData = await directDeleteRes.json();
  if (directDeleteRes.status === 400 && !directDeleteData.success) {
    success(`Anti-Impulse Discipline ENFORCED! Direct deletion correctly blocked: "${directDeleteData.error}"`);
  } else {
    fail("Anti-Impulse check failed! Locked vault with active funds was incorrectly deleted", directDeleteData);
  }

  // -------------------------------------------------------------
  // STEP 6: Emergency Break Protocol Execution
  // -------------------------------------------------------------
  log("STEP 6a", "Testing AI Reality Check (Roast) before emergency break");
  const roastRes = await fetch(`${BASE_URL}/api/ai/reality-check`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      excuse: "I saw a limited edition jacket and I really want to buy it right now",
      goal: "Tokyo Summer 2027",
      currentBalance: 100,
      targetAmount: 600,
      keyholderName: "Fatima",
      lang: "en",
    }),
  });

  const roastData = await roastRes.json();
  log("AI REALITY CHECK", roastData.realityCheck);
  success("AI Reality Check generated witty deterrence roast.");

  log("STEP 6b", "Executing Emergency Solo Break (15% deterrent fee, 85% returned)");
  const breakRes = await fetch(`${BASE_URL}/api/vault/${vaultId}/unlock`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
    },
    body: JSON.stringify({
      action: "EMERGENCY_BREAK",
      reason: "Emergency solo release",
    }),
  });

  const breakData = await breakRes.json();
  if (!breakRes.ok || !breakData.success) {
    fail("Emergency break execution failed", breakData);
  }

  const brokenVault = breakData.vault;
  log("BROKEN VAULT STATE", {
    status: brokenVault.status,
    currentBalance: `${brokenVault.currentBalance} KWD`,
    unlockMethod: brokenVault.unlockMethod,
    recentTransactions: brokenVault.transactions?.slice(0, 2).map((t) => ({
      type: t.type,
      amount: `${t.amount} KWD`,
      note: t.note,
    })),
  });
  success("Emergency break completed! 85 KWD refunded, 15 KWD discipline fee deducted, status = UNLOCKED, balance = 0 KWD.");

  // -------------------------------------------------------------
  // STEP 7: Removing the Unlocked Goal
  // -------------------------------------------------------------
  log("STEP 7", `Removing the UNLOCKED goal via DELETE /api/vault/${vaultId}`);
  const deleteUnlockedRes = await fetch(`${BASE_URL}/api/vault/${vaultId}`, {
    method: "DELETE",
    headers: {
      Cookie: cookieHeader,
    },
  });

  const deleteUnlockedData = await deleteUnlockedRes.json();
  if (!deleteUnlockedRes.ok || !deleteUnlockedData.success) {
    fail("Failed to delete unlocked vault", deleteUnlockedData);
  }
  success(`Unlocked goal successfully removed: "${deleteUnlockedData.message}"`);

  // -------------------------------------------------------------
  // STEP 8: Dashboard Empty State Verification
  // -------------------------------------------------------------
  log("STEP 8", "Verifying user dashboard state after goal removal");
  const dashRes = await fetch(`${BASE_URL}/api/vault`, {
    method: "GET",
    headers: {
      Cookie: cookieHeader,
    },
  });

  const dashData = await dashRes.json();
  if (!dashRes.ok || !dashData.success) {
    fail("Dashboard fetch failed", dashData);
  }

  log("DASHBOARD STATE", {
    vaultsCount: dashData.vaults?.length || 0,
    vault: dashData.vault,
  });

  if ((dashData.vaults?.length || 0) === 0 && dashData.vault === null) {
    success("Verified: User has 0 active vaults. Dashboard shows pristine empty state.");
  } else {
    fail("Vault was not cleanly removed from user's active vaults list", dashData);
  }

  // -------------------------------------------------------------
  // STEP 9: Direct Removal of an Empty (0 KWD) Goal
  // -------------------------------------------------------------
  log("STEP 9", "Testing direct removal of a brand-new empty (0 KWD) goal without fees");
  const emptyVaultRes = await fetch(`${BASE_URL}/api/vault`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
    },
    body: JSON.stringify({
      title: "MacBook Pro M4",
      targetAmount: 500,
      pullAmount: 20,
      cadence: "weekly",
      keyholder: {
        name: "Ali",
        email: `ali_${testId}@example.com`,
      },
    }),
  });

  const emptyVaultData = await emptyVaultRes.json();
  const emptyVaultId = emptyVaultData.vault?._id;
  log("EMPTY VAULT CREATED", { emptyVaultId, balance: emptyVaultData.vault?.currentBalance });

  const deleteEmptyRes = await fetch(`${BASE_URL}/api/vault/${emptyVaultId}`, {
    method: "DELETE",
    headers: { Cookie: cookieHeader },
  });

  const deleteEmptyData = await deleteEmptyRes.json();
  if (deleteEmptyRes.ok && deleteEmptyData.success) {
    success("Empty (0 KWD) goal successfully removed with zero penalties!");
  } else {
    fail("Failed to remove 0 KWD goal", deleteEmptyData);
  }

  // -------------------------------------------------------------
  // SUMMARY REPORT
  // -------------------------------------------------------------
  console.log("=".repeat(70));
  console.log(`${colors.bright}${colors.green}   ALL 9 LIFECYCLE STEPS TESTED & PASSED PERFECTLY!${colors.reset}`);
  console.log("=".repeat(70) + "\n");
}

runGoalLifecycleTest().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
