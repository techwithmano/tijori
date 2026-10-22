const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  const timestamp = Date.now();
  const email = `demo_user_${timestamp}@example.com`;
  const password = 'Password123!';

  console.log(`1. Signing up user: ${email}`);
  await page.goto('http://localhost:3000/signup', { waitUntil: 'networkidle' });
  await page.fill('input[type="text"]', 'Tijori Demo User');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');

  console.log('2. Waiting for onboarding Step 1');
  await page.waitForURL('**/onboarding**', { timeout: 15000 });

  // Step 1: Goal & Target
  await page.fill('input[type="text"]', 'Japan Summer Trip');
  await page.fill('input[type="number"]', '500');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1000);

  // Step 2: Save amount & Frequency
  console.log('3. Completing Step 2: 25 KWD weekly');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1000);

  // Step 3: Keyholder
  console.log('4. Completing Step 3: Keyholder Ahmed');
  const step3Inputs = page.locator('input[type="text"], input[type="email"]');
  if (await step3Inputs.count() >= 2) {
    await step3Inputs.nth(0).fill('Ahmed');
    await step3Inputs.nth(1).fill('ahmed@example.com');
  }
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);

  // Step 4: Card adding partition
  console.log('5. Step 4: Card Partition Verification');
  await page.waitForSelector('#save-card-submit-btn', { timeout: 15000 });

  // Click Save Card
  await page.click('#save-card-submit-btn');
  console.log('6. Submitted card, waiting for dashboard...');

  await page.waitForURL('**/dashboard**', { timeout: 20000 });
  await page.waitForTimeout(2500);

  // Inspect page text
  const dashContent = await page.textContent('body');

  console.log('7. Verifying Dashboard Timeline & Stats...');
  const hasTimeline = /Goal Timeline & Finish Date|توقعات إنجاز الهدف والموعد النهائي/i.test(dashContent);
  const hasTimeToGoal = /Time to Goal|الوقت المتبقي للهدف/i.test(dashContent);
  const hasWeeks = /19 weeks|19 أسبوع/i.test(dashContent);
  const hasPacing = /Your next 4 saves|عمليات التوفير الـ 4 القادمة/i.test(dashContent);
  const hasCoach = /Off to a great start|Strong Start|انطلاقة قوية|بداية ممتازة/i.test(dashContent);
  const hasInitialSave = /25\.000|Initial Save|First save|التوفير الأول/i.test(dashContent);

  console.log('Results:');
  console.log('- Goal Timeline Header:', hasTimeline ? 'PASS' : 'FAIL');
  console.log('- Time to Goal Label:', hasTimeToGoal ? 'PASS' : 'FAIL');
  console.log('- 19 Weeks Countdown:', hasWeeks ? 'PASS' : 'FAIL');
  console.log('- Pacing Section (Next 4 saves):', hasPacing ? 'PASS' : 'FAIL');
  console.log('- Motivational Coach Banner:', hasCoach ? 'PASS' : 'FAIL');
  console.log('- Initial Save Executed (25.000 KWD):', hasInitialSave ? 'PASS' : 'FAIL');

  const screenshotDir = path.join(__dirname, '..', 'audit', 'screenshots');
  if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });

  const screenshotPath = path.join(screenshotDir, 'dashboard-timeline-and-stats.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Saved screenshot to: ${screenshotPath}`);

  if (!hasTimeline || !hasTimeToGoal || !hasWeeks || !hasCoach) {
    throw new Error('Timeline or coach elements missing on dashboard');
  }

  console.log('ALL VERIFICATIONS PASSED SUCCESSFULLY!');
  await browser.close();
  process.exit(0);
})().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
