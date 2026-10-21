const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const SCREENSHOTS_DIR = path.join(__dirname, '..', 'audit', 'screenshots');
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function testDecisionModals() {
  console.log('=== Starting Decision Modal Validation ===');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  // Flag to detect if ANY native dialog (alert/confirm/prompt) is triggered
  let nativeDialogTriggered = false;
  page.on('dialog', async (dialog) => {
    nativeDialogTriggered = true;
    console.error(`❌ UNEXPECTED NATIVE DIALOG TRIGGERED: [${dialog.type()}] "${dialog.message()}"`);
    await dialog.dismiss();
  });

  const timestamp = Date.now();
  const testEmail = `decision_test_${timestamp}@tijori.app`;
  const testPassword = 'Password123!';

  // 1. Register test user
  console.log(`\n1. Registering test user: ${testEmail}`);
  await page.goto('http://localhost:3000/register', { waitUntil: 'networkidle' });
  await page.fill('input[type="text"]', 'Sami Al-Ali');
  await page.fill('input[type="email"]', testEmail);
  await page.fill('input[type="password"]', testPassword);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/onboarding', { timeout: 10000 });

  // 2. Complete Onboarding to create vault "Japan Summer Trip"
  console.log('2. Completing Onboarding...');
  const titleInput = await page.waitForSelector('input[type="text"]');
  await titleInput.fill('Japan Summer Trip');
  const amountInput = await page.waitForSelector('input[type="number"]');
  await amountInput.fill('600');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(500);

  // Step 2: Pacing
  await page.click('button[type="submit"]');
  await page.waitForTimeout(500);

  // Step 3: Keyholder
  await page.fill('input[placeholder="Ahmed"]', 'Fahad Al-Mutawa');
  await page.fill('input[type="email"]', 'fahad.keyholder@example.com');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1000);

  // Step 4: Skip card to reach Dashboard
  await page.waitForSelector('button:has-text("Skip"), button:has-text("تخطي")');
  const skipBtn = await page.$('button:has-text("Skip"), button:has-text("تخطي")');
  await skipBtn.click();
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  console.log('✓ Reached Dashboard successfully.');

  // 3. Test TEST CASE A: Delete empty goal (0 KWD)
  // Clicking trash button on an empty goal should open the Neo-Brutalist "Permanent Deletion" modal!
  console.log('\n3. Testing Permanent Deletion Decision Modal for empty goal...');
  const deleteBtn = await page.waitForSelector('#remove-goal-header-btn');
  await deleteBtn.click();
  await page.waitForTimeout(500);

  // Verify the Neo-Brutalist Decision Modal is open
  const modal = await page.waitForSelector('div[role="dialog"]');
  const modalTitle = await modal.$eval('#decision-modal-title', (el) => el.textContent);
  console.log(`Modal Title: "${modalTitle}"`);

  if (!modalTitle.includes('Permanently remove') && !modalTitle.includes('حذف هدف')) {
    throw new Error(`Expected deletion confirmation modal, but got: ${modalTitle}`);
  }

  // Take screenshot of Permanent Deletion Modal
  const deleteModalScreenshot = path.join(SCREENSHOTS_DIR, 'modal-permanent-delete-goal.png');
  await page.screenshot({ path: deleteModalScreenshot });
  console.log(`✓ Screenshot captured: ${deleteModalScreenshot}`);

  // Click Cancel to dismiss modal
  const cancelBtn = await modal.$('button:has-text("Cancel"), button:has-text("إلغاء")');
  await cancelBtn.click();
  await page.waitForTimeout(500);
  console.log('✓ Successfully dismissed modal via Cancel button.');

  // 4. Test TEST CASE B: Discipline Protected Modal (when vault has active funds)
  // Let's add 50 KWD into the vault
  console.log('\n4. Adding 50 KWD to vault to test Discipline Protection Modal...');
  const addMoneyBtn = await page.waitForSelector('#add-money-now-btn');
  await addMoneyBtn.click();
  await page.waitForTimeout(500);
  const confirmTopupBtn = await page.waitForSelector('#confirm-topup-submit-btn');
  await confirmTopupBtn.click();
  await page.waitForTimeout(2500);

  // Now click delete button on a LOCKED vault with funds
  console.log('Clicking delete on locked goal with active funds...');
  await deleteBtn.click();
  await page.waitForTimeout(500);

  const disciplineModal = await page.waitForSelector('div[role="dialog"]');
  const disciplineTitle = await disciplineModal.$eval('#decision-modal-title', (el) => el.textContent);
  console.log(`Discipline Modal Title: "${disciplineTitle}"`);

  if (!disciplineTitle.includes('Cannot Remove') && !disciplineTitle.includes('لا يمكن حذف')) {
    throw new Error(`Expected Discipline Protected modal, but got: ${disciplineTitle}`);
  }

  // Take screenshot of Discipline Protected Modal
  const disciplineScreenshot = path.join(SCREENSHOTS_DIR, 'modal-discipline-protected.png');
  await page.screenshot({ path: disciplineScreenshot });
  console.log(`✓ Screenshot captured: ${disciplineScreenshot}`);

  // Close the discipline modal via "Understood" / "Got it"
  const understoodBtn = await disciplineModal.$('button:has-text("Understood"), button:has-text("فهمت"), button:has-text("Got it")');
  await understoodBtn.click();
  await page.waitForTimeout(500);
  console.log('✓ Successfully acknowledged discipline rule.');

  // 5. Test TEST CASE C: Emergency Solo Break Decision Modal
  console.log('\n5. Testing Emergency Solo Break Decision Modal with financial breakdown...');
  const breakBtn = await page.waitForSelector('#break-vault-action-btn');
  await breakBtn.click();
  await page.waitForTimeout(800);

  const soloBreakBtn = await page.waitForSelector('#solo-emergency-break-btn');
  await soloBreakBtn.click();
  await page.waitForTimeout(500);

  const emergencyModal = await page.waitForSelector('div[role="dialog"]');
  const emergencyTitle = await emergencyModal.$eval('#decision-modal-title', (el) => el.textContent);
  console.log(`Emergency Modal Title: "${emergencyTitle}"`);

  if (!emergencyTitle.includes('Break Vault Alone') && !emergencyTitle.includes('كسر الخزينة منفرداً')) {
    throw new Error(`Expected Emergency Break modal, but got: ${emergencyTitle}`);
  }

  // Verify financial breakdown is visible
  const modalText = await emergencyModal.innerText();
  if (!modalText.includes('Discipline Fee') && !modalText.includes('رسوم كسر الانضباط')) {
    throw new Error('Expected financial breakdown inside emergency break modal.');
  }
  console.log('✓ Verified clear financial breakdown inside the modal.');

  // Take screenshot of Emergency Solo Break Modal
  const emergencyScreenshot = path.join(SCREENSHOTS_DIR, 'modal-emergency-break-decision.png');
  await page.screenshot({ path: emergencyScreenshot });
  console.log(`✓ Screenshot captured: ${emergencyScreenshot}`);

  // Confirm emergency break through the modal
  const confirmBreakBtn = await emergencyModal.$('button:has-text("Confirm Break"), button:has-text("تأكيد الكسر")');
  await confirmBreakBtn.click();
  await page.waitForTimeout(2000);

  // Verify success modal appeared
  const successModal = await page.waitForSelector('div[role="dialog"]');
  const successTitle = await successModal.$eval('#decision-modal-title', (el) => el.textContent);
  console.log(`Success Modal Title: "${successTitle}"`);

  // Take screenshot of Success Modal
  const successScreenshot = path.join(SCREENSHOTS_DIR, 'modal-break-success.png');
  await page.screenshot({ path: successScreenshot });
  console.log(`✓ Screenshot captured: ${successScreenshot}`);

  // Close success modal
  const backBtn = await successModal.$('button:has-text("Back to Dashboard"), button:has-text("العودة للوحة التحكم")');
  await backBtn.click();
  await page.waitForTimeout(500);

  // 6. Test TEST CASE D: Logout Confirmation Modal
  console.log('\n6. Testing Sign Out Confirmation Modal...');
  const logoutBtn = await page.$('button[aria-label="Log out"], button:has-text("Log out"), button:has-text("خروج")');
  await logoutBtn.click();
  await page.waitForTimeout(500);

  const logoutModal = await page.waitForSelector('div[role="dialog"]');
  const logoutTitle = await logoutModal.$eval('#decision-modal-title', (el) => el.textContent);
  console.log(`Sign Out Modal Title: "${logoutTitle}"`);

  const logoutScreenshot = path.join(SCREENSHOTS_DIR, 'modal-sign-out-confirm.png');
  await page.screenshot({ path: logoutScreenshot });
  console.log(`✓ Screenshot captured: ${logoutScreenshot}`);

  // Final check: ensure NO native dialog was ever shown!
  if (nativeDialogTriggered) {
    throw new Error('FAILED: At least one native browser dialog was triggered!');
  }
  console.log('\n🌟 ZERO native browser dialogs were triggered! All decisions use Neo-Brutalist modals!');

  await browser.close();
  console.log('\n🎉 ALL DECISION MODAL CHECKS PASSED WITH FLYING COLORS!');
}

testDecisionModals().catch((err) => {
  console.error('\n❌ VALIDATION FAILED:', err.message);
  process.exit(1);
});
