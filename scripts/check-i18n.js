/**
 * scripts/check-i18n.js
 * Validates key parity between en.json and ar.json,
 * and ensures values in ar.json are not identical untranslated copies of en.json.
 */

const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '..', 'lib', 'i18n', 'en.json');
const arPath = path.join(__dirname, '..', 'lib', 'i18n', 'ar.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));

function flatten(obj, prefix = '') {
  let res = {};
  for (const k in obj) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
      Object.assign(res, flatten(obj[k], key));
    } else {
      res[key] = obj[k];
    }
  }
  return res;
}

const flatEn = flatten(en);
const flatAr = flatten(ar);

const enKeys = Object.keys(flatEn);
const arKeys = Object.keys(flatAr);

let hasErrors = false;

// 1. Missing in AR
const missingInAr = enKeys.filter((k) => !(k in flatAr));
if (missingInAr.length > 0) {
  console.error('❌ Keys in en.json but missing in ar.json:');
  missingInAr.forEach((k) => console.error(`  - ${k}`));
  hasErrors = true;
}

// 2. Missing in EN
const missingInEn = arKeys.filter((k) => !(k in flatEn));
if (missingInEn.length > 0) {
  console.error('❌ Keys in ar.json but missing in en.json:');
  missingInEn.forEach((k) => console.error(`  - ${k}`));
  hasErrors = true;
}

// 3. Allowed identical values (brand names, language indicators, email placeholders, numbers)
const allowedIdenticalKeys = new Set([
  'common.langEn',
  'common.langAr',
  'auth.emailPlaceholder',
]);

const identical = [];
for (const k of enKeys) {
  if (k in flatAr && flatEn[k] === flatAr[k]) {
    // If it's pure numbers, punctuation or an allowed key, allow it
    const val = String(flatEn[k]).trim();
    if (allowedIdenticalKeys.has(k) || /^[\d\s.,%+\-–—:/@#]+$/.test(val)) {
      continue;
    }
    identical.push({ key: k, value: flatEn[k] });
  }
}

if (identical.length > 0) {
  console.error('❌ Keys in ar.json identical to English (untranslated):');
  identical.forEach((item) => console.error(`  - ${item.key}: "${item.value}"`));
  hasErrors = true;
}

if (hasErrors) {
  console.error('\n❌ i18n parity check FAILED.');
  process.exit(1);
} else {
  console.log(`✅ i18n check PASSED: ${enKeys.length} keys verified with 100% parity and valid Arabic translations.`);
  process.exit(0);
}
