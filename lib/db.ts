import mongoose from "mongoose";
import dns from "node:dns";

try {
  dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
} catch (e) {
  // Ignore restricted environments
}

const MONGODB_URI = process.env.MONGODB_URI;

// Direct replica set seedlist (bypasses Windows/ISP DNS SRV querySrv EBADRESP limitations)
const DIRECT_FALLBACK_URI =
  "mongodb://abdukhogali1_db_user:aaFC6cPgRd4hxOqq@ac-ahiop6y-shard-00-00.sfdjb0j.mongodb.net:27017,ac-ahiop6y-shard-00-01.sfdjb0j.mongodb.net:27017,ac-ahiop6y-shard-00-02.sfdjb0j.mongodb.net:27017/tijori?ssl=true&replicaSet=atlas-dychyr-shard-0&authSource=admin&retryWrites=true&w=majority";

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env.local"
  );
}

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

  if (!cached.promise) {
    const primaryOpts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 4000,
    };

    const directOpts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
    };

    // Attempt primary connection with rapid fallback to direct replica set on DNS SRV failure
    cached.promise = mongoose
      .connect(MONGODB_URI as string, primaryOpts)
      .then((instance) => {
        console.log("Connected to MongoDB Atlas cluster successfully.");
        return instance;
      })
      .catch(async (primaryErr) => {
        console.warn("Primary MongoDB SRV failed, switching immediately to direct replica fallback:", primaryErr.message);
        return mongoose.connect(DIRECT_FALLBACK_URI, directOpts).then((instance) => {
          console.log("Connected to MongoDB Atlas via direct replica fallback.");
          return instance;
        });
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
