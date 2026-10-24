import mongoose from 'mongoose';
import { env } from './env.js';

let databaseStatus = 'mongodb-atlas-not-configured';

export async function connectDatabase() {
  if (!env.mongoUri) {
    databaseStatus = 'mongodb-atlas-not-configured';
    console.warn('[database] MONGODB_URI is not configured; data routes will return an explicit unavailable state.');
    return false;
  }

  try {
    await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 5000 });
    databaseStatus = 'mongodb-atlas-connected';
    console.log('[database] MongoDB Atlas connected');
    return true;
  } catch (error) {
    databaseStatus = 'mongodb-atlas-connection-failed';
    console.error('[database] MongoDB Atlas connection failed:', error.message);
    return false;
  }
}

export const isDatabaseReady = () => mongoose.connection.readyState === 1;
export const getDatabaseStatus = () => (isDatabaseReady() ? 'mongodb-atlas-connected' : databaseStatus);
