const Stripe = require("stripe");
const fs = require("fs");
const path = require("path");

if (fs.existsSync(".env.local")) {
  const content = fs.readFileSync(".env.local", "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const idx = trimmed.indexOf("=");
      if (idx > -1) {
        const k = trimmed.substring(0, idx).trim();
        let v = trimmed.substring(idx + 1).trim();
        if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
        if (v.startsWith("'") && v.endsWith("'")) v = v.slice(1, -1);
        process.env[k] = v;
      }
    }
  }
}

const stripeKey = process.env.STRIPE_SECRET_KEY;
console.log("Stripe Key starting with:", stripeKey ? stripeKey.substring(0, 12) + "..." : "none");

if (!stripeKey) {
  console.error("No STRIPE_SECRET_KEY found!");
  process.exit(1);
}

const stripe = new Stripe(stripeKey, { apiVersion: "2024-12-18.acacia" });

async function checkAccount() {
  try {
    const account = await stripe.accounts.retrieve();
    console.log("Account ID:", account.id);
    console.log("Country:", account.country);
    console.log("Default currency:", account.default_currency);
    console.log("Capabilities:", account.capabilities);
  } catch (err) {
    console.error("Account retrieve failed, testing customer/payment intents directly:", err.message);
  }

  // Test creating a test customer
  try {
    const customer = await stripe.customers.create({
      name: "Tijori Test User",
      email: "test@tijori.app",
    });
    console.log("Successfully created test customer:", customer.id);

    // Test creating a SetupIntent
    const setupIntent = await stripe.setupIntents.create({
      customer: customer.id,
      usage: "off_session",
    });
    console.log("Successfully created SetupIntent:", setupIntent.id, "client_secret:", setupIntent.client_secret ? "EXISTS" : "MISSING");

    // Test KWD currency capability on a test PaymentIntent
    try {
      // In Stripe, KWD has 3 decimal places, but Stripe currency specs require amounts to be multiples of 10 in smallest unit (fils).
      // e.g. 10.000 KWD = 10000 fils
      const piKwd = await stripe.paymentIntents.create({
        amount: 10000, // 10 KWD
        currency: "kwd",
        customer: customer.id,
        payment_method_types: ["card"],
      });
      console.log("KWD PaymentIntent creation succeeded! ID:", piKwd.id, "Currency:", piKwd.currency);
      // Clean up test PI
      await stripe.paymentIntents.cancel(piKwd.id);
    } catch (kwdErr) {
      console.log("KWD PaymentIntent creation failed:", kwdErr.message);
    }

    // Clean up test customer
    await stripe.customers.del(customer.id);
    console.log("Deleted test customer.");
  } catch (err) {
    console.error("Stripe test failed:", err.message);
  }
}

checkAccount();
