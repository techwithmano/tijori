import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITransaction {
  _id?: string;
  amount: number;
  type: "SCHEDULED_PULL" | "SIMULATED_PULL" | "STRIPE_DEPOSIT" | "WITHDRAWAL";
  status: string;
  createdAt: Date;
  note?: string;
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
  cadence: "daily" | "weekly" | "biweekly" | "monthly";
  pullAmount: number;
  allowanceDay: number;
  status: "LOCKED" | "UNLOCK_PENDING" | "UNLOCKED";
  keyholder: IKeyholder;
  transactions: ITransaction[];
  targetDate: Date;
  breakExcuse?: string;
  realityCheck?: string;
  unlockToken?: string | null;
  unlockReason?: string | null;
  totalProtected: number;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    amount: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ["SCHEDULED_PULL", "SIMULATED_PULL", "STRIPE_DEPOSIT", "WITHDRAWAL"],
      required: true,
    },
    status: {
      type: String,
      default: "COMPLETED",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    note: {
      type: String,
      default: "",
    },
  },
  { _id: true }
);

const KeyholderSchema = new Schema<IKeyholder>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    relationship: {
      type: String,
      required: true,
      default: "Friend",
      trim: true,
    },
  },
  { _id: false }
);

const VaultSchema = new Schema<IVault>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    targetAmount: {
      type: Number,
      required: true,
      min: 1,
    },
    currentBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    cadence: {
      type: String,
      enum: ["daily", "weekly", "biweekly", "monthly"],
      default: "weekly",
    },
    pullAmount: {
      type: Number,
      required: true,
      min: 1,
    },
    allowanceDay: {
      type: Number,
      default: 25,
      min: 1,
      max: 31,
    },
    status: {
      type: String,
      enum: ["LOCKED", "UNLOCK_PENDING", "UNLOCKED"],
      default: "LOCKED",
    },
    keyholder: {
      type: KeyholderSchema,
      required: true,
    },
    transactions: {
      type: [TransactionSchema],
      default: [],
    },
    targetDate: {
      type: Date,
      required: true,
    },
    breakExcuse: {
      type: String,
      default: "",
    },
    realityCheck: {
      type: String,
      default: "",
    },
    unlockToken: {
      type: String,
      default: null,
      index: true,
    },
    unlockReason: {
      type: String,
      default: null,
    },
    totalProtected: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const Vault: Model<IVault> =
  mongoose.models.Vault || mongoose.model<IVault>("Vault", VaultSchema);

export default Vault;
