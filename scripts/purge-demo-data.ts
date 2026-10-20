import mongoose from "mongoose";
import { connectToDatabase } from "../lib/db";
import { User } from "../models/User";
import { Vault } from "../models/Vault";

async function purgeDemoData() {
  const isApply = process.argv.includes("--apply");

  console.log("=================================================");
  console.log("       TIJORI DEMO DATA PURGE SCRIPT             ");
  console.log(`MODE: ${isApply ? ">>> APPLYING DELETIONS <<<" : "[DRY RUN] (No changes will be saved)"}`);
  console.log("=================================================\n");

  await connectToDatabase();

  // 1. Locate demo users
  const demoUsers = await User.find({
    $or: [{ email: "demo@tijori.app" }, { email: /demo.*@tijori\.app/i }],
  });

  const demoUserIds = demoUsers.map((u) => u._id);
  console.log(`Found ${demoUsers.length} demo user(s):`);
  demoUsers.forEach((u) => {
    console.log(` - User ID: ${u._id} | Name: ${u.name} | Email: ${u.email}`);
  });

  // 2. Locate seeded vaults (associated with demo user or having seed signature)
  const seededVaults = await Vault.find({
    $or: [
      { userId: { $in: demoUserIds } },
      { "keyholder.name": "Ahmed Al-Mutawa", title: "Japan Summer Trip", streakCount: 18 },
    ],
  });

  console.log(`\nFound ${seededVaults.length} seeded/demo vault(s):`);
  let totalTxCount = 0;
  seededVaults.forEach((v) => {
    const txCount = v.transactions ? v.transactions.length : 0;
    totalTxCount += txCount;
    console.log(
      ` - Vault ID: ${v._id} | Title: "${v.title}" | Balance: ${v.currentBalance} KWD | Transactions: ${txCount}`
    );
  });

  console.log(`\nTotal summary to delete:`);
  console.log(` - Demo Users: ${demoUsers.length}`);
  console.log(` - Seeded Vaults: ${seededVaults.length}`);
  console.log(` - Seeded Transactions: ${totalTxCount}`);

  if (isApply) {
    console.log("\nExecuting deletions...");
    const userDelRes = await User.deleteMany({
      _id: { $in: demoUserIds },
    });
    const vaultDelRes = await Vault.deleteMany({
      $or: [
        { userId: { $in: demoUserIds } },
        { "keyholder.name": "Ahmed Al-Mutawa", title: "Japan Summer Trip", streakCount: 18 },
      ],
    });

    console.log(`✓ Deleted ${userDelRes.deletedCount} user(s).`);
    console.log(`✓ Deleted ${vaultDelRes.deletedCount} vault(s).`);
    console.log(">>> Purge complete. DB is now clean.");
  } else {
    console.log("\n[DRY RUN COMPLETE]");
    console.log("No data was deleted. To execute actual deletion, run:");
    console.log("npx tsx scripts/purge-demo-data.ts --apply");
  }

  await mongoose.disconnect();
  process.exit(0);
}

purgeDemoData().catch((err) => {
  console.error("Purge error:", err);
  process.exit(1);
});
