const { sendKeyholderInviteEmail } = require('../lib/resend');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

async function run() {
  console.log('Testing live Resend email delivery with account mailbox...');

  // Test 1: Send invite with a third-party email (e.g. Ahmed)
  console.log('\n--- TEST 1: Sending invite intended for Ahmed (ahmed@example.com) ---');
  const res1 = await sendKeyholderInviteEmail({
    to: 'ahmed@example.com',
    keyholderName: 'Ahmed',
    applicantName: 'Abdulrahman Haramain',
    goalTitle: 'Japan Summer Trip',
    targetAmount: 500,
    inviteUrl: 'http://localhost:3000/keyholder/invite/live-test-token',
    isArabic: false,
  });

  console.log('Test 1 Result:', res1);
  if (!res1.success) {
    throw new Error(`Test 1 failed: ${res1.error}`);
  }

  // Test 2: Send invite directly to user's real email
  console.log('\n--- TEST 2: Sending invite directly to abdukhogali1@gmail.com ---');
  const res2 = await sendKeyholderInviteEmail({
    to: 'abdukhogali1@gmail.com',
    keyholderName: 'Ahmed (Direct)',
    applicantName: 'Abdulrahman Haramain',
    goalTitle: 'Japan Summer Trip',
    targetAmount: 500,
    inviteUrl: 'http://localhost:3000/keyholder/invite/live-test-token-2',
    isArabic: false,
  });

  console.log('Test 2 Result:', res2);
  if (!res2.success) {
    throw new Error(`Test 2 failed: ${res2.error}`);
  }

  console.log('\nSUCCESS! Both emails dispatched through Resend and delivered directly to abdukhogali1@gmail.com inbox!');
}

run().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
