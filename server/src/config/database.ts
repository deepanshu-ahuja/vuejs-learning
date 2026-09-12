import mongoose from 'mongoose'

/**
 * Opens the single MongoDB connection used by this small learning API.
 * Keeping connection setup separate from Express makes server.ts easier to
 * read without introducing a larger backend architecture.
 */
export async function connectDatabase(): Promise<void> {
  const mongoUri = process.env.MONGODB_URI

  if (!mongoUri) {
    throw new Error('MONGODB_URI is required. Copy server/.env.example to server/.env.')
  }

  await mongoose.connect(mongoUri)
}
