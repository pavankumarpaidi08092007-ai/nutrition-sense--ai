import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export let isUsingMockDB = false;

export const connectDB = async (): Promise<boolean> => {
  const connString = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nutrisense';
  try {
    mongoose.set('strictQuery', true);
    console.log(`Connecting to MongoDB at: ${connString}...`);
    const conn = await mongoose.connect(connString, {
      serverSelectionTimeoutMS: 3000, // Timeout after 3s instead of 30s
    });
    console.log(`MongoDB Connected successfully: ${conn.connection.host}`);
    isUsingMockDB = false;
    return true;
  } catch (error: any) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.log('------------------------------------------------------------');
    console.log('WARNING: Local MongoDB is not running or accessible.');
    console.log('Nutri Sense will automatically fall back to IN-MEMORY MOCK DB.');
    console.log('All functions (auth, profile, trackers, recommendations) will');
    console.log('work, but data will reset when the backend server restarts.');
    console.log('------------------------------------------------------------');
    isUsingMockDB = true;
    return false;
  }
};
