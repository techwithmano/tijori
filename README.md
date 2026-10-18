# Tijori (تِجوري) — Anti-Impulse Micro-Savings & Peer Friction Protocol

> **"Traditional banking makes spending too easy. Tijori makes impulse withdrawals an embarrassing group project."**

[![Next.js 15](https://img.shields.io/badge/Next.js-15.5-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
[![Stripe](https://img.shields.io/badge/Stripe-Test%20Mode-635BFF?style=for-the-badge&logo=stripe)](https://stripe.com/)
[![Gemini 2.5 Flash](https://img.shields.io/badge/Google-Gemini%202.5%20Flash-4285F4?style=for-the-badge&logo=google)](https://ai.google.dev/)

---

## 🌟 Overview

**Tijori (تِجوري)** is a behavioral FinTech platform designed specifically for young adults (15–30) across the GCC (Kuwait, Saudi Arabia, UAE, Qatar, Bahrain, Oman).

Unlike conventional savings apps that offer frictionless "withdraw now" buttons, Tijori leverages **behavioral friction**, **peer accountability**, and **cultural synchronization**:
1. **The Keyholder Protocol:** Time-locked vaults cannot be broken unilaterally. Emergency withdrawals require the approval of a designated friend (Keyholder) via a secure, tokenized single-use link.
2. **Gemini 2.5 Flash Reality Check:** Frivolous excuses ("limited sneaker drop", "another V60 coffee run", "chalet weekend") are roasted in real-time by AI, arming the Keyholder with behavioral ammunition to deny the request.
3. **GCC Day-25 Allowance Pacing:** Synchronized with student allowances (*I'ana* / إعانة) and monthly payrolls, dynamically pulling larger amounts post-salary and tapering down before the next cycle.
4. **Discipline Tax Warning & Protected Savings:** Unapproved emergency withdrawals trigger a 5% forfeit fee, while successful denials increment the user's permanent **"Protected Savings"** badge.
5. **Stripe Test Mode Checkout:** Direct one-click micro-deposits (+20 KWD) seamlessly routed via official Stripe checkout sessions.

---

## 📸 Visual Audit & Screenshots

Automated full-page captures generated via `npm run audit` located in [`/audit/screenshots/`](./audit/screenshots/):

| View | Route | Form Factor | Highlights |
| :--- | :--- | :--- | :--- |
| **Main Dashboard** | `/` | Desktop (1440p) | Protected savings stat badge (`🛡️ 380 KWD Protected`), animated SVG progress ring, Stripe checkout deposit button, and Judges Demo Bar |
| **Emergency Break Modal** | `/` (Modal) | Desktop (1440p) | Discipline Tax (5% fee) warning, excuse input, AI roast callout, and WhatsApp peer share button |
| **Keyholder Decision Screen** | `/unlock/[token]` | Mobile (iPhone 14/15/16 Pro) | Mobile-first decision terminal with exact excuse quote, Gemini roast, and burn-on-click protection |
| **Vault Creation Wizard** | `/create` | Desktop & Mobile | Dynamic AI Allowance Pacing Curve generator and Keyholder designation |

Detailed design token audits, component hierarchy trees, and WCAG AAA contrast reports can be found in [`audit/UI_REPORT.md`](./audit/UI_REPORT.md).

---

## 🛠️ Tech Stack & Architecture

```
Tijori/
├── app/
│   ├── api/
│   │   ├── ai/pacing/            # Gemini 2.5 dynamic pacing curve generator
│   │   ├── ai/reality-check/     # Gemini 2.5 behavioral roast engine
│   │   ├── stripe/checkout/      # Stripe Checkout session handler (Test mode)
│   │   ├── unlock/[token]/       # Single-use tokenized Keyholder decision API
│   │   └── vault/                # Vault CRUD, simulated pulls, & unlock triggers
│   ├── create/                   # High-tech vault creation wizard
│   ├── unlock/[token]/           # Standalone mobile Keyholder decision screen
│   ├── globals.css               # Obsidian tokens, tactile physics, & glow utilities
│   ├── layout.tsx                # App root layout with ambient luxury glow
│   └── page.tsx                  # Main reactive dashboard & savings ledger
├── audit/
│   ├── screenshots/              # Automated screenshot captures (Desktop & Mobile)
│   └── UI_REPORT.md              # Full visual audit & WCAG AAA compliance report
├── lib/
│   ├── db.ts                     # Robust MongoDB Atlas connection with direct replica fallback
│   ├── gemini.ts                 # Google GenAI client configuration
│   └── stripe.ts                 # Stripe Node.js SDK client
├── models/
│   └── Vault.ts                  # Mongoose schema with single-use tokens & protected totals
└── scripts/
    └── capture-audit.js          # Headless Chromium automation for visual regression
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** >= 18.0.0
- **MongoDB Atlas** cluster or local MongoDB instance
- **Google Gemini API Key** ([Google AI Studio](https://aistudio.google.com/))
- **Stripe Account** (Test Mode keys from [Stripe Dashboard](https://dashboard.stripe.com/))

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/techwithmano/tijori.git
cd tijori

# Install dependencies
npm install
```

### 3. Environment Configuration
Create a `.env.local` file in the root directory (refer to `.env.example`):
```env
MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.mongodb.net/tijori?retryWrites=true&w=majority"
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
GEMINI_API_KEY="AIzaSy..."
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the live dashboard.

### 5. Run Automated Visual Audit
```bash
npm run audit
```
This launches headless Chromium/Edge and captures desktop and mobile viewports directly into `audit/screenshots/`.

### 6. Production Build
```bash
npm run build
npm run start
```

---

## 🔒 Security & Privacy Notice
- Secret credentials (`.env.local`) are strictly excluded via `.gitignore`.
- Single-use unlock tokens are cryptographically randomized using `crypto.randomUUID()` and burned immediately after Keyholder resolution.

---

## 📜 License
MIT License. Built for the GCC Youth FinTech Innovation Initiative.
