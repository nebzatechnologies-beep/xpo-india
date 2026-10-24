import mongoose from 'mongoose';

// Lazily evaluated inside connectDB


/** Cached connection to avoid re-connecting on every hot-reload in dev. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- global cache requires any
const globalWithMongoose = global as typeof globalThis & {
  mongoose?: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
};

const cached = globalWithMongoose.mongoose ?? { conn: null, promise: null };
globalWithMongoose.mongoose = cached;

/**
 * Connects to MongoDB and returns the cached connection.
 * Safe to call in every route handler — will reuse the existing connection.
 */
export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/xpo-india';

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 2000,
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
