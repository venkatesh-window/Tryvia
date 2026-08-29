import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import dns from "dns";

// Ensure standard public DNS servers are used for MongoDB SRV resolution
try {
  dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
} catch (e) {
  // Ignore in environments where custom DNS servers cannot be set
}
let mongoServer = null;

export const connectDB = async () => {
  try {
    if (process.env.NODE_ENV === "test" && process.env.USE_IN_MEMORY_DB === "true") {
      mongoServer = await MongoMemoryServer.create();
      const mongoURI = mongoServer.getUri();
      const conn = await mongoose.connect(mongoURI);
      console.log(
        `✅ MongoDB Connected (Test In-Memory): ${conn.connection.host}/${conn.connection.name}`,
      );
      return conn;
    }

    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      throw new Error("MONGODB_URI environment variable is not defined");
    }

    const conn = await mongoose.connect(mongoURI);
    console.log(
      `✅ MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`,
    );
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    throw error;
  }
};

export const closeDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
};
