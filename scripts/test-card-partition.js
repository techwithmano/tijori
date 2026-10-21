const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const SCREENSHOTS_DIR = path.join(__dirname, '..', 'audit', 'screenshots');
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function testCardPartition() {
  console.log('=== Validating Pre-filled Card Partition with Abdulrahman Haramain ===');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  const timestamp = Date.now();
  const testEmail = `card_test_${timestamp}@tijori.app`;
  const testPassword = 'Password123!';

  // 1. Register test user named Abdulrahman Haramain
  console.log(`1. Registering user as Abdulrahman Haramain (${testEmail})...`);
  await page.goto('http://localhost:3000/register', { waitUntil: 'networkidle' });
  await page.fill('input[type="text"]', 'Abdulrahman Haramain');
  await page.fill('input[type="email"]', testEmail);
  await page.fill('input[type="password"]', testPassword);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/onboarding', { timeout: 15000 });

  // 2. Complete Step 1: Goal
  console.log('2. Step 1: Goal...');
  const titleInput = await page.waitForSelector('input[type="text"]');
  await titleInput.fill('Japan Summer Trip');
  const amountInput = await page.waitForSelector('input[type="number"]');
  await amountInput.fill('600');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(500);

  // 3. Step 2: Pacing
  console.log('3. Step 2: Pacing...');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(500);

  // 4. Step 3: Keyholder
  console.log('4. Step 3: Keyholder...');
  await page.fill('input[placeholder="Ahmed"]', 'Ahmed');
  await page.fill('input[type="email"]', 'ahmed.keyholder@example.com');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1500);

  // 5. Step 4: Validate Card Partition
  console.log('\n5. Validating Step 4 Card Partition...');
  await page.waitForSelector('#save-card-submit-btn');

  // Check card visual text
  const pageContent = await page.innerText('body');
  if (!pageContent.includes('ABDULRAHMAN HARAMAIN')) {
    throw new Error('FAILED: Visual credit card does not display ABDULRAHMAN HARAMAIN!');
  }
  console.log('✓ Visual card displays cardholder: ABDULRAHMAN HARAMAIN');

  if (!pageContent.includes('4242') && !pageContent.includes('12/34')) {
    throw new Error('FAILED: Visual credit card does not display test card number or expiry!');
  }
  console.log('✓ Visual card displays test card number: 4242 and expiry: 12/34');

  // Check inputs are pre-filled
  const cardNumValue = await page.$eval('input[placeholder="4242 4242 4242 4242"]', (el) => el.value);
  const expiryValue = await page.$eval('input[placeholder="12/34"]', (el) => el.value);
  const cvcValue = await page.$eval('input[placeholder="123"]', (el) => el.value);
  const nameValue = await page.$eval('input[placeholder="Abdulrahman Haramain"]', (el) => el.value);

  console.log(`Pre-filled values in inputs:`);
  console.log(`- Card Number: "${cardNumValue}"`);
  console.log(`- Expiry: "${expiryValue}"`);
  console.log(`- CVC: "${cvcValue}"`);
  console.log(`- Name on Card: "${nameValue}"`);

  if (!cardNumValue.includes('4242') || expiryValue !== '12/34' || cvcValue !== '123' || !nameValue.includes('Abdulrahman')) {
    throw new Error('FAILED: Card inputs are not properly pre-filled with demo credentials!');
  }
  console.log('✓ All card inputs are properly pre-filled!');

  // Capture Screenshot of Step 4
  const step4Screenshot = path.join(SCREENSHOTS_DIR, 'step4-prefilled-card-partition.png');
  await page.screenshot({ path: step4Screenshot });
  console.log(`✓ Screenshot captured: ${step4Screenshot}`);

  // 6. Submit Card to link vault
  console.log('\n6. Submitting Card to link vault...');
  const submitBtn = await page.waitForSelector('#save-card-submit-btn');
  await submitBtn.click();

  // Wait for redirect to dashboard
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  console.log('✓ Successfully saved card and redirected to Dashboard!');

  await page.waitForTimeout(1000);
  const dashboardScreenshot = path.join(SCREENSHOTS_DIR, 'dashboard-after-card-save.png');
  await page.screenshot({ path: dashboardScreenshot });
  console.log(`✓ Screenshot captured: ${dashboardScreenshot}`);

  await browser.close();
  console.log('\n🎉 ALL CARD PARTITION CHECKS PASSED PERFECTLY!');
}

testCardPartition().catch((err) => {
  console.error('\n❌ TEST FAILED:', err.message);
  process.exit(1);
});
