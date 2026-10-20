/**
 * scripts/capture-m1.js
 * Captures the 15 required browser screenshots for TASK M1 into /audit/screenshots/
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE_URL = 'http://localhost:3000';
const OUT_DIR = path.join(__dirname, '..', 'audit', 'screenshots');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function capture() {
  console.log('📸 Starting TASK M1 Screenshot Capture Suite...\n');

  const browser = await chromium.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({
    permissions: ['clipboard-read', 'clipboard-write'],
  });
  const page = await context.newPage();

  // Helper to wait 2.5s for fonts, 3D canvas, and animations to settle
  const waitSettle = async () => {
    await page.waitForTimeout(2500);
  };

  // ─────────────────────────────────────────────────────────────
  // 1. Landing Hero EN Desktop
  // ─────────────────────────────────────────────────────────────
  console.log('Capturing 1: M1_landing_hero_en_desktop.png...');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.setItem('tijori_lang', 'en'));
  await page.reload({ waitUntil: 'networkidle' });
  await waitSettle();
  await page.screenshot({ path: path.join(OUT_DIR, 'M1_landing_hero_en_desktop.png') });

  // ─────────────────────────────────────────────────────────────
  // 2. Landing Hero AR Desktop
  // ─────────────────────────────────────────────────────────────
  console.log('Capturing 2: M1_landing_hero_ar_desktop.png...');
  await page.evaluate(() => localStorage.setItem('tijori_lang', 'ar'));
  await page.reload({ waitUntil: 'networkidle' });
  await waitSettle();
  await page.screenshot({ path: path.join(OUT_DIR, 'M1_landing_hero_ar_desktop.png') });

  // ─────────────────────────────────────────────────────────────
  // 3. Landing Hero EN Phone
  // ─────────────────────────────────────────────────────────────
  console.log('Capturing 3: M1_landing_hero_en_phone.png...');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => localStorage.setItem('tijori_lang', 'en'));
  await page.reload({ waitUntil: 'networkidle' });
  await waitSettle();
  await page.screenshot({ path: path.join(OUT_DIR, 'M1_landing_hero_en_phone.png') });

  // ─────────────────────────────────────────────────────────────
  // 4. The Two Rules EN Desktop
  // ─────────────────────────────────────────────────────────────
  console.log('Capturing 4: M1_two_rules_en_desktop.png...');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE_URL}/#unlock-rules`, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    const el = document.getElementById('unlock-rules');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await waitSettle();
  await page.screenshot({ path: path.join(OUT_DIR, 'M1_two_rules_en_desktop.png') });

  // ─────────────────────────────────────────────────────────────
  // 5. How It Works EN Desktop
  // ─────────────────────────────────────────────────────────────
  console.log('Capturing 5: M1_howitworks_en_desktop.png...');
  await page.goto(`${BASE_URL}/#how-it-works`, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    const el = document.getElementById('how-it-works');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await waitSettle();
  await page.screenshot({ path: path.join(OUT_DIR, 'M1_howitworks_en_desktop.png') });

  // ─────────────────────────────────────────────────────────────
  // 6. Onboarding Step 1 EN Desktop
  // ─────────────────────────────────────────────────────────────
  console.log('Capturing 6: M1_onboarding_step1_en_desktop.png...');
  await page.goto(`${BASE_URL}/onboarding`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.setItem('tijori_lang', 'en'));
  await page.reload({ waitUntil: 'networkidle' });
  await waitSettle();
  await page.screenshot({ path: path.join(OUT_DIR, 'M1_onboarding_step1_en_desktop.png') });

  // ─────────────────────────────────────────────────────────────
  // 7. Onboarding Step 2 EN Desktop
  // ─────────────────────────────────────────────────────────────
  console.log('Capturing 7: M1_onboarding_step2_en_desktop.png...');
  await page.click('button[type="submit"]');
  await waitSettle();
  await page.screenshot({ path: path.join(OUT_DIR, 'M1_onboarding_step2_en_desktop.png') });

  // ─────────────────────────────────────────────────────────────
  // 8. Onboarding Step 3 EN Desktop
  // ─────────────────────────────────────────────────────────────
  console.log('Capturing 8: M1_onboarding_step3_en_desktop.png...');
  await page.click('button[type="submit"]');
  await waitSettle();
  await page.screenshot({ path: path.join(OUT_DIR, 'M1_onboarding_step3_en_desktop.png') });

  // ─────────────────────────────────────────────────────────────
  // 9. Onboarding Step 4 Card EN Desktop (showing test-card helper)
  // ─────────────────────────────────────────────────────────────
  console.log('Capturing 9: M1_onboarding_step4_card_en_desktop.png...');
  await page.fill('input[type="tel"]', '99887766');
  await page.click('button[type="submit"]');
  await waitSettle();
  await page.screenshot({ path: path.join(OUT_DIR, 'M1_onboarding_step4_card_en_desktop.png') });

  // ─────────────────────────────────────────────────────────────
  // 10. Onboarding Step 4 Card EN Phone
  // ─────────────────────────────────────────────────────────────
  console.log('Capturing 10: M1_onboarding_step4_card_en_phone.png...');
  await page.setViewportSize({ width: 390, height: 844 });
  await waitSettle();
  await page.screenshot({ path: path.join(OUT_DIR, 'M1_onboarding_step4_card_en_phone.png') });

  // ─────────────────────────────────────────────────────────────
  // 11. Onboarding Step 1 AR Phone
  // ─────────────────────────────────────────────────────────────
  console.log('Capturing 11: M1_onboarding_step1_ar_phone.png...');
  await page.goto(`${BASE_URL}/onboarding`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.setItem('tijori_lang', 'ar'));
  await page.reload({ waitUntil: 'networkidle' });
  await waitSettle();
  await page.screenshot({ path: path.join(OUT_DIR, 'M1_onboarding_step1_ar_phone.png') });

  // ─────────────────────────────────────────────────────────────
  // 12. Dashboard Empty EN Desktop (brand-new user, no vault)
  // ─────────────────────────────────────────────────────────────
  console.log('Capturing 12: M1_dashboard_empty_en_desktop.png...');
  const emptyUserEmail = `empty_m1_${Date.now()}@test.tijori.app`;
  const emptyReg = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Empty User', email: emptyUserEmail, password: 'Password123!' }),
  });
  const emptyCookie = emptyReg.headers.get('set-cookie');
  let emptyToken = '';
  if (emptyCookie) {
    const m = emptyCookie.match(/tijori_session=([^;]+)/);
    if (m) emptyToken = m[1];
  }

  await context.clearCookies();
  if (emptyToken) {
    await context.addCookies([{ name: 'tijori_session', value: emptyToken, domain: 'localhost', path: '/' }]);
  }

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.setItem('tijori_lang', 'en'));
  await page.reload({ waitUntil: 'networkidle' });
  await waitSettle();
  await page.screenshot({ path: path.join(OUT_DIR, 'M1_dashboard_empty_en_desktop.png') });

  // ─────────────────────────────────────────────────────────────
  // 13. Dashboard Vault EN Desktop (user with active vault)
  // ─────────────────────────────────────────────────────────────
  console.log('Capturing 13: M1_dashboard_vault_en_desktop.png...');
  const activeUserEmail = `active_m1_${Date.now()}@test.tijori.app`;
  const activeReg = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Fahad Al-Kuwaiti', email: activeUserEmail, password: 'Password123!' }),
  });
  const activeCookie = activeReg.headers.get('set-cookie');
  let activeToken = '';
  if (activeCookie) {
    const m = activeCookie.match(/tijori_session=([^;]+)/);
    if (m) activeToken = m[1];
  }

  // Create real vault for active user
  const vaultRes = await fetch(`${BASE_URL}/api/vault`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `tijori_session=${activeToken}`,
    },
    body: JSON.stringify({
      title: 'Japan Summer Trip',
      targetAmount: 500,
      pullAmount: 25,
      cadence: 'weekly',
      keyholder: {
        name: 'Ahmed Al-Mutawa',
        phone: '+96599887766',
        relationship: 'Best Friend',
      },
      keyholderPin: '123456',
    }),
  });
  const vaultData = await vaultRes.json();

  if (vaultData.success && vaultData.vault?._id) {
    // Add real top-up pull of 50 KWD so current balance is real
    await fetch(`${BASE_URL}/api/vault/${vaultData.vault._id}/pull`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `tijori_session=${activeToken}`,
      },
      body: JSON.stringify({ amount: 50 }),
    });
  }

  await context.clearCookies();
  if (activeToken) {
    await context.addCookies([{ name: 'tijori_session', value: activeToken, domain: 'localhost', path: '/' }]);
  }

  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.setItem('tijori_lang', 'en'));
  await page.reload({ waitUntil: 'networkidle' });
  await waitSettle();
  await page.screenshot({ path: path.join(OUT_DIR, 'M1_dashboard_vault_en_desktop.png') });

  // ─────────────────────────────────────────────────────────────
  // 14. Dashboard Vault AR Desktop
  // ─────────────────────────────────────────────────────────────
  console.log('Capturing 14: M1_dashboard_vault_ar_desktop.png...');
  await page.evaluate(() => localStorage.setItem('tijori_lang', 'ar'));
  await page.reload({ waitUntil: 'networkidle' });
  await waitSettle();
  await page.screenshot({ path: path.join(OUT_DIR, 'M1_dashboard_vault_ar_desktop.png') });

  // ─────────────────────────────────────────────────────────────
  // 15. Break Sheet EN Desktop
  // ─────────────────────────────────────────────────────────────
  console.log('Capturing 15: M1_break_sheet_en_desktop.png...');
  await page.evaluate(() => localStorage.setItem('tijori_lang', 'en'));
  await page.reload({ waitUntil: 'networkidle' });
  await waitSettle();

  // Click Break Vault action button
  const breakBtn = await page.$('#break-vault-action-btn');
  if (breakBtn) {
    await breakBtn.click();
  }
  await waitSettle();
  await page.screenshot({ path: path.join(OUT_DIR, 'M1_break_sheet_en_desktop.png') });

  await browser.close();
  console.log('\n✨ All 15 screenshots captured successfully in audit/screenshots/!');
}

capture().catch((e) => {
  console.error('Capture failed:', e);
  process.exit(1);
});
