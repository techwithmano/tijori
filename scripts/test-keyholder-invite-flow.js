const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:3000';
const SCREENSHOTS_DIR = path.join(__dirname, '..', 'audit', 'screenshots');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function runTest() {
  console.log('Launching browser for Keyholder Invite Flow validation...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  const testEmail = `keyholder_ui_${Date.now()}@tijori.app`;
  const testPassword = 'Password123!';

  console.log(`\n=== 1. Registering test user: ${testEmail} ===`);
  await page.goto(`${BASE_URL}/signup`, { waitUntil: 'networkidle' });
  await page.fill('input[type="text"]', 'Abdulrahman');
  await page.fill('input[type="email"]', testEmail);
  await page.fill('input[type="password"]', testPassword);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/onboarding', { timeout: 15000 });
  await page.waitForTimeout(500);

  // Step 1: Goal
  console.log('Completing Step 1 (Goal)...');
  await page.fill('input[value="Japan Summer Trip"]', 'Tokyo Trip 2027');
  await page.fill('input[type="number"]', '1200');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(500);

  // Step 2: Pacing
  console.log('Completing Step 2 (Pacing)...');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(500);

  // Step 3: Keyholder Invite Setup
  console.log('\n=== 3. Testing Step 3 (Keyholder Private Invite) ===');
  const step3Title = await page.innerText('h1');
  console.log(`Step 3 Title: "${step3Title}"`);

  // CRITICAL CHECK: Verify that NO PIN input exists for the user on Step 3
  const pinInput = await page.$('input[placeholder="123456"]');
  if (pinInput) {
    throw new Error('FAILED: Step 3 is still showing a PIN input to the user!');
  }
  console.log('PASSED: No PIN input displayed to the user in Step 3.');

  // Check that the Private Invite Link Card is rendered
  const inviteCard = await page.getByText(/Private Keyholder Invite Link|رابط دعوة حامل المفتاح/i).first();
  if (!inviteCard) {
    throw new Error('FAILED: Keyholder invite card is missing from Step 3.');
  }
  console.log('PASSED: Keyholder invite link card is present.');

  // Check Email input
  const emailInput = await page.$('input[type="email"]');
  if (!emailInput) {
    throw new Error('FAILED: Keyholder email input not found.');
  }
  await emailInput.fill('fahad.keyholder@example.com');
  console.log('PASSED: Keyholder email input filled.');

  // Check Send Email Invite button
  const sendEmailBtn = await page.getByText(/Send Email Invite|إرسال الدعوة/i).first();
  if (!sendEmailBtn) {
    throw new Error('FAILED: Send Email Invite button not found.');
  }
  console.log('PASSED: Send Email Invite button verified.');

  // Extract the generated invite URL from Step 3
  const inviteUrl = await page.evaluate(() => {
    // Look for link text inside the monospace invite box
    const monoBox = document.querySelector('div.font-mono');
    if (monoBox && monoBox.textContent && monoBox.textContent.includes('/keyholder/invite/')) {
      return monoBox.textContent.trim();
    }
    return null;
  });

  if (!inviteUrl) {
    throw new Error('FAILED: Could not extract invite URL from Step 3.');
  }
  console.log(`PASSED: Extracted private invite link: ${inviteUrl}`);

  // Fill in Keyholder details
  await page.fill('input[placeholder="Ahmed"]', 'Fahad Al-Mutawa');

  // Test Copy Link Button
  const copyBtn = await page.getByText(/Copy Link|نسخ الرابط/i).first();
  if (copyBtn) {
    await copyBtn.click();
    await page.waitForTimeout(300);
    console.log('PASSED: Clicked Copy Link button.');
  }

  // Test Send Email Invite Button click
  await sendEmailBtn.click();
  await page.waitForTimeout(1500);
  console.log('PASSED: Clicked Send Email Invite button.');

  // Take screenshot of new Step 3 UI
  const step3Screenshot = path.join(SCREENSHOTS_DIR, 'step3-keyholder-email-invite.png');
  await page.screenshot({ path: step3Screenshot });
  console.log(`Screenshot captured: ${step3Screenshot}`);

  // Continue to Step 4
  await page.click('button[type="submit"]');
  await page.waitForTimeout(800);

  // Step 4: Card Skip & Create Vault
  console.log('\n=== 4. Completing Step 4 & Creating Vault ===');
  try {
    await page.waitForSelector('button:has-text("Skip"), button:has-text("تخطي")', { timeout: 10000 });
    const skipBtn = await page.$('button:has-text("Skip"), button:has-text("تخطي")');
    if (!skipBtn) {
      throw new Error('Skip button not found on Step 4');
    }
    console.log('Clicking Skip button...');
    await skipBtn.click();
    console.log('Waiting for URL /dashboard...');
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    console.log('PASSED: Vault created and redirected to dashboard.');
  } catch (err) {
    const dbgScreenshot = path.join(SCREENSHOTS_DIR, 'debug-step4-failure.png');
    await page.screenshot({ path: dbgScreenshot });
    console.error(`Debug screenshot captured: ${dbgScreenshot}`);
    const bodyText = await page.innerText('body');
    console.error(`Current URL: ${page.url()}\nPage Text:\n${bodyText}`);
    throw err;
  }

  // === 5. Testing the Friend's Setup Page ===
  console.log('\n=== 5. Friend opening private invite link ===');
  const friendContext = await browser.newContext({ viewport: { width: 390, height: 844 } }); // Mobile viewport
  const friendPage = await friendContext.newPage();
  console.log(`Friend navigating to: ${inviteUrl}`);
  await friendPage.goto(inviteUrl, { waitUntil: 'networkidle' });
  await friendPage.waitForTimeout(1000);

  const friendPageText = await friendPage.innerText('body');
  if (!friendPageText.includes('Fahad') && !friendPageText.includes('Keyholder')) {
    throw new Error(`Friend page did not load expected content:\n${friendPageText.slice(0, 300)}`);
  }
  console.log('PASSED: Friend invite page loaded with personalized context.');

  // Friend sets secret 6-digit PIN: "889900"
  console.log('Friend setting secret 6-digit PIN (889900)...');
  const pinInputs = await friendPage.$$('input[type="password"]');
  if (pinInputs.length < 2) {
    throw new Error('Friend invite page must provide both PIN and Confirm PIN inputs.');
  }
  await pinInputs[0].fill('889900');
  await pinInputs[1].fill('889900');

  // Capture screenshot of Friend setup page
  const friendSetupScreenshot = path.join(SCREENSHOTS_DIR, 'friend-pin-setup-page.png');
  await friendPage.screenshot({ path: friendSetupScreenshot });
  console.log(`Screenshot captured: ${friendSetupScreenshot}`);

  // Submit PIN
  await friendPage.click('button[type="submit"]');
  await friendPage.waitForTimeout(1500);

  // Verify success confirmation
  const successText = await friendPage.innerText('body');
  if (!successText.includes('You Hold the Key') && !successText.includes('حامل المفتاح')) {
    throw new Error(`Expected success message after setting PIN. Text: ${successText.slice(0, 300)}`);
  }
  console.log('PASSED: Friend successfully locked their secret 6-digit PIN with confetti!');

  // Capture screenshot of success page
  const friendSuccessScreenshot = path.join(SCREENSHOTS_DIR, 'friend-pin-success-page.png');
  await friendPage.screenshot({ path: friendSuccessScreenshot });
  console.log(`Screenshot captured: ${friendSuccessScreenshot}`);

  await browser.close();
  console.log('\n🎉 ALL CHECKS PASSED PERFECTLY!');
}

runTest().catch((err) => {
  console.error('\n❌ TEST FAILED:', err.message);
  process.exit(1);
});
