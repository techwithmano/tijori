import Stripe from "stripe";
import { User, IUser } from "@/models/User";

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY || "sk_test_placeholder_for_build";
  if (!stripeInstance) {
    stripeInstance = new Stripe(secretKey, {
      apiVersion: "2025-02-24.acacia",
      typescript: true,
    });
  }
  return stripeInstance;
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    const client = getStripe();
    return (client as any)[prop];
  },
});

/**
 * Currency configuration:
 * KWD is not directly supported as a charge currency on standard US/international Stripe accounts.
 * Therefore, charges are processed in USD using a fixed rate constant, while all UI,
 * ledger records, and vault balances remain strictly in Kuwaiti Dinar (KWD).
 */
export const KWD_TO_USD_RATE = 3.26; // 1 KWD = 3.26 USD

export const isStripeTestMode = !process.env.STRIPE_SECRET_KEY?.startsWith("sk_live");

export function kwdToUsdCents(kwdAmount: number): number {
  return Math.max(50, Math.round(kwdAmount * KWD_TO_USD_RATE * 100)); // Minimum 50 cents for Stripe
}

export function usdCentsToKwd(cents: number): number {
  return Number((cents / (KWD_TO_USD_RATE * 100)).toFixed(3));
}

/**
 * Ensures a user has a Stripe Customer ID, creating and saving one if missing.
 */
export async function getOrCreateStripeCustomer(user: IUser): Promise<string> {
  if (user.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }

  const customer = await stripe.customers.create({
    name: user.name,
    email: user.email,
    metadata: {
      userId: user._id.toString(),
      app: "tijori",
    },
  });

  user.stripeCustomerId = customer.id;
  await User.findByIdAndUpdate(user._id, { stripeCustomerId: customer.id });
  return customer.id;
}

export default stripe;
