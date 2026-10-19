import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITransaction {
  _id?: string;
  amount: number;
  type: "SCHEDULED_PULL" | "SIMULATED_PULL" | "STRIPE_DEPOSIT" | "WITHDRAWAL" | "BREAK_REQUEST" | "TOP_UP" | "BREAK_REFUND" | "DISCIPLINE_FEE" | "BREAK_DENIED";
  status: "SUCCESS" | "FAILED" | "PENDING" | "COMPLETED" | "INTERVENED_PROTECTED" | "PENDING_KEYHOLDER";
  note?: string;
  stripePaymentIntentId?: string;
  createdAt: Date;
}

export interface IKeyholder {
  name: string;
  phone: string;
  relationship: string;
}

export interface IVault extends Document {
  userId?: mongoose.Types.ObjectId;
  title: string;
  targetAmount: number;
  currentBalance: number;
  totalProtected: number; // Increments when Keyholder clicks "Deny & Protect"
  streakCount: number; // Days/cycles without breaking vault
  denialsCount?: number; // Total number of times break was denied
  cadence: "daily" | "weekly" | "biweekly" | "monthly";
  pullAmount: number;
  allowanceDay: number;
  targetDate: Date;
  nextPullAt?: Date;
  needsAttention?: boolean;
  needsAttentionReason?: string | null;
  processedPaymentIntents?: string[];
  status: "LOCKED" | "UNLOCK_PENDING" | "UNLOCKED";
  keyholder: IKeyholder;
  unlockToken?: string | null;
  unlockReason?: string | null;
  realityCheck?: string | null;
  breakExcuse?: string | null;
  transactions: ITransaction[];
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    amount: { type: Number, required: true },
    type: {
      type: String,
      enum: ["SCHEDULED_PULL", "SIMULATED_PULL", "STRIPE_DEPOSIT", "WITHDRAWAL", "BREAK_REQUEST", "TOP_UP", "BREAK_REFUND", "DISCIPLINE_FEE", "BREAK_DENIED"],
      required: true,
    },
    status: {
      type: String,
      enum: ["SUCCESS", "FAILED", "PENDING", "COMPLETED", "INTERVENED_PROTECTED", "PENDING_KEYHOLDER"],
      default: "SUCCESS",
    },
    note: { type: String },
    stripePaymentIntentId: { type: String, default: null },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const KeyholderSchema = new Schema<IKeyholder>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    relationship: { type: String, default: "Best Friend", trim: true },
  },
  { _id: false }
);

const VaultSchema = new Schema<IVault>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: false, index: true },
    title: { type: String, required: true, trim: true },
    targetAmount: { type: Number, required: true },
    currentBalance: { type: Number, default: 0 },
    totalProtected: { type: Number, default: 0 },
    streakCount: { type: Number, default: 0 },
    denialsCount: { type: Number, default: 0 },
    cadence: { type: String, default: "weekly" },
    pullAmount: { type: Number, required: true },
    allowanceDay: { type: Number, default: 25 },
    targetDate: { type: Date, required: true },
    nextPullAt: { type: Date, default: null, index: true },
    needsAttention: { type: Boolean, default: false },
    needsAttentionReason: { type: String, default: null },
    processedPaymentIntents: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["LOCKED", "UNLOCK_PENDING", "UNLOCKED"],
      default: "LOCKED",
    },
    keyholder: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      relationship: { type: String, default: "Best Friend" },
    },
    unlockToken: { type: String, default: null, index: true },
    unlockReason: { type: String, default: null },
    realityCheck: { type: String, default: null },
    breakExcuse: { type: String, default: null },
    transactions: [TransactionSchema],
  },
  { timestamps: true }
);

if (mongoose.models.Vault) {
  delete mongoose.models.Vault;
}

export const Vault: Model<IVault> = mongoose.model<IVault>("Vault", VaultSchema);

export default Vault;
