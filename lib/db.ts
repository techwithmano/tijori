import mongoose from "mongoose";
import dns from "node:dns";

try {
  dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
} catch (e) {
  // Ignore restricted environments
}

// Direct replica set host list can optionally be specified in environment via MONGODB_DIRECT_URI
const directFallbackUri = process.env.MONGODB_DIRECT_URI;

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri && !directFallbackUri) {
    throw new Error(
      "Please define the MONGODB_URI environment variable inside .env.local or your deployment settings."
    );
  }

  const connectionTarget = uri || directFallbackUri!;

  if (!cached.promise) {
    const primaryOpts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    };

    const directOpts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
    };

    cached.promise = mongoose
      .connect(connectionTarget, primaryOpts)
      .then((instance) => {
        console.log("Connected to MongoDB Atlas cluster successfully.");
        return instance;
      })
      .catch(async (primaryErr) => {
        if (directFallbackUri && connectionTarget !== directFallbackUri) {
          console.warn("Primary MongoDB SRV failed, switching to direct replica fallback:", primaryErr.message);
          return mongoose.connect(directFallbackUri, directOpts).then((instance) => {
            console.log("Connected to MongoDB Atlas via direct replica fallback.");
            return instance;
          });
        }
        throw primaryErr;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error("All MongoDB connection attempts failed:", e);
    throw e;
  }

  return cached.conn;
}

export default connectToDatabase;
