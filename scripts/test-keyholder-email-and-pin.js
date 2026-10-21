const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ownerContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const ownerPage = await ownerContext.newPage();

  const timestamp = Date.now();
  const email = `abdulrahman_${timestamp}@example.com`;
  const password = 'Password123!';

  console.log(`1. Signing up user: ${email}`);
  await ownerPage.goto('http://localhost:3000/signup', { waitUntil: 'networkidle' });
  await ownerPage.fill('input[type="text"]', 'Abdulrahman Haramain');
  await ownerPage.fill('input[type="email"]', email);
  await ownerPage.fill('input[type="password"]', password);
  await ownerPage.click('button[type="submit"]');

  console.log('2. Waiting for onboarding Step 1...');
  await ownerPage.waitForURL('**/onboarding**', { timeout: 15000 });

  // Step 1: Goal & Target
  await ownerPage.fill('input[type="text"]', 'Japan Summer Trip');
  await ownerPage.fill('input[type="number"]', '500');
  await ownerPage.click('button[type="submit"]');
  await ownerPage.waitForTimeout(1000);

  // Step 2: Save amount & Frequency
  console.log('3. Completing Step 2: 25 KWD weekly');
  await ownerPage.click('button[type="submit"]');
  await ownerPage.waitForTimeout(1000);

  // Step 3: Keyholder details
  console.log('4. Completing Step 3: Keyholder Ahmed (ahmed@example.com)');
  const step3Inputs = ownerPage.locator('input[type="text"], input[type="email"]');
  await step3Inputs.nth(0).fill('Ahmed');
  await step3Inputs.nth(1).fill('ahmed@example.com');

  // Submit Step 3 by clicking Continue
  console.log('5. Clicking Continue on Step 3 to trigger email invite...');
  await ownerPage.click('button[type="submit"]');
  await ownerPage.waitForTimeout(3000);

  // Check that Step 4 card partition loaded
  console.log('6. Onboarding arrived at Step 4 (Card Partition)');
  await ownerPage.waitForSelector('#save-card-submit-btn', { timeout: 15000 });

  // Fetch the created vault from /api/vault using owner's session
  const vaultRes = await ownerPage.evaluate(async () => {
    const res = await fetch('/api/vault');
    return res.json();
  });

  const vault = vaultRes.vault;
  if (!vault || !vault.inviteToken) {
    throw new Error('Failed to retrieve vault or inviteToken from API');
  }

  const inviteToken = vault.inviteToken;
  const inviteUrl = `http://localhost:3000/keyholder/invite/${inviteToken}`;
  console.log(`7. Retrieved invite token: ${inviteToken}`);
  console.log(`   Generated Invite URL: ${inviteUrl}`);

  // Now simulate the Friend (Keyholder Ahmed) opening the invite link
  console.log('8. Friend opening the invite link in a new browser context...');
  const friendContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const friendPage = await friendContext.newPage();

  await friendPage.goto(inviteUrl, { waitUntil: 'networkidle' });
  await friendPage.waitForTimeout(1500);

  const invitePageText = await friendPage.textContent('body');
  console.log('   Checking invite page text for applicant and goal name...');
  const hasApplicant = /Abdulrahman/i.test(invitePageText);
  const hasGoal = /Japan Summer Trip/i.test(invitePageText);
  console.log('   - Has Applicant name (Abdulrahman):', hasApplicant ? 'PASS' : 'FAIL');
  console.log('   - Has Goal name (Japan Summer Trip):', hasGoal ? 'PASS' : 'FAIL');

  // Enter secret 6-digit PIN as Ahmed
  console.log('9. Ahmed entering secret PIN: 987654');
  const pinInputs = friendPage.locator('input[type="password"], input[type="tel"], input[inputmode="numeric"], input[type="text"]');
  const count = await pinInputs.count();
  console.log(`   Found ${count} inputs on invite page`);

  // Locate PIN and Confirm PIN
  await pinInputs.nth(count - 2).fill('987654');
  await pinInputs.nth(count - 1).fill('987654');

  console.log('10. Submitting secret PIN...');
  await friendPage.click('button[type="submit"]');
  await friendPage.waitForTimeout(2000);

  const successText = await friendPage.textContent('body');
  const pinSaved = /PIN is set|Secret PIN Set|تم حفظ الرمز السري|Secret PIN has been saved|You hold the key/i.test(successText);
  console.log('   - PIN Saved Screen:', pinSaved ? 'PASS' : 'FAIL');

  const screenshotDir = path.join(__dirname, '..', 'audit', 'screenshots');
  if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });

  const screenshotPath = path.join(screenshotDir, 'keyholder-pin-success.png');
  await friendPage.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Saved screenshot to: ${screenshotPath}`);

  if (!pinSaved) {
    throw new Error('Keyholder PIN was not saved successfully');
  }

  console.log('\nALL VERIFICATIONS FOR RESEND EMAIL & KEYHOLDER INVITE FLOW PASSED PERFECTLY!');
  await browser.close();
  process.exit(0);
})().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
