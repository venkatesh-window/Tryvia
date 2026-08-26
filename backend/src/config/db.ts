import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer | null = null;

export const connectDB = async (): Promise<void> => {
  try {
    let mongoURI = process.env.MONGODB_URI;
    
    if (mongoURI && !mongoURI.includes('localhost')) {
      // Connect to Atlas or external DB
      const conn = await mongoose.connect(mongoURI);
      console.log(`✅ MongoDB Connected (Atlas): ${conn.connection.host}/${conn.connection.name}`);
    } else {
      // Fallback to in-memory for pure local testing without credentials
      mongoServer = await MongoMemoryServer.create();
      mongoURI = mongoServer.getUri();
      const conn = await mongoose.connect(mongoURI);
      console.log(`✅ MongoDB Connected (In-Memory Fallback): ${conn.connection.host}/${conn.connection.name}`);
    }
  } catch (error: any) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
  }
};

export const closeDB = async (): Promise<void> => {
  if (mongoServer) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  }
};
