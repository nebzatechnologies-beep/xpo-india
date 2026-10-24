import mongoose from 'mongoose';

declare global {
  // eslint-disable-next-line no-var
  var _mongoConn: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } | undefined;
}

if (!global._mongoConn) {
  global._mongoConn = { conn: null, promise: null };
}

export async function connectDB(): Promise<typeof mongoose> {
  if (global._mongoConn!.conn) return global._mongoConn!.conn;
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not defined in environment variables.');
  if (!global._mongoConn!.promise) {
    global._mongoConn!.promise = mongoose.connect(process.env.MONGODB_URI, {
      bufferCommands: false,
    });
  }
  global._mongoConn!.conn = await global._mongoConn!.promise;
  return global._mongoConn!.conn;
}
