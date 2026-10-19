async function testCronCharge() {
  const mongoose = require("mongoose");
  const fs = require("fs");
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

  // Connect to DB directly via mongoose
  let uri = process.env.MONGODB_URI;
  if (uri && uri.includes("cluster0.sfdjb0j.mongodb.net")) {
    uri = uri.replace("mongodb+srv://", "mongodb://");
    const atIdx = uri.indexOf("@");
    const slashIdx = uri.indexOf(".mongodb.net");
    if (atIdx !== -1 && slashIdx !== -1) {
      const userPass = uri.substring(10, atIdx);
      const hosts = "ac-pfx0iut-shard-00-00.sfdjb0j.mongodb.net:27017,ac-pfx0iut-shard-00-01.sfdjb0j.mongodb.net:27017,ac-pfx0iut-shard-00-02.sfdjb0j.mongodb.net:27017";
      uri = `mongodb://${userPass}@${hosts}/tijori?ssl=true&replicaSet=atlas-135w4u-shard-0&authSource=admin&retryWrites=true&w=majority`;
    }
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB for cron test.");

  const User = mongoose.models.User || mongoose.model("User", new mongoose.Schema({}, { strict: false }));
  const Vault = mongoose.models.Vault || mongoose.model("Vault", new mongoose.Schema({}, { strict: false }));

  // Find user with defaultPaymentMethodId
  const user = await User.findOne({ defaultPaymentMethodId: { $exists: true, $ne: null } }).sort({ updatedAt: -1 });
  if (!user) {
    console.error("No user with payment method found.");
    process.exit(1);
  }
  console.log("Found user with card:", user.email, "PM:", user.defaultPaymentMethodId);

  // Find user's vault
  const vault = await Vault.findOne({ userId: user._id });
  if (!vault) {
    console.error("No vault found for user.");
    process.exit(1);
  }
  console.log("Found vault:", vault.title, "Current Balance:", vault.currentBalance);

  // Set nextPullAt to past (due)
  vault.nextPullAt = new Date(Date.now() - 3600000); // 1 hour ago
  await vault.save();
  console.log("Set vault.nextPullAt to past.");

  // Call /api/cron/pull
  const fetch = (...args) => import("node-fetch").then(({default: fetch}) => fetch(...args));
  const res = await (await import("node:http")).get ? null : null;

  // Use global fetch
  const cronRes = await globalThis.fetch("http://localhost:3000/api/cron/pull");
  const cronData = await cronRes.json();
  console.log("Cron execution result:", JSON.stringify(cronData, null, 2));

  // Verify vault updated
  const updatedVault = await Vault.findById(vault._id);
  console.log("Updated Vault Balance:", updatedVault.currentBalance, "Streak:", updatedVault.streakCount);

  await mongoose.disconnect();
}

testCronCharge().catch(console.error);
