import mongoose from "mongoose";
import dotenv from "dotenv";
import { Vendor } from "./src/models/Vendor";

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/tryvia",
    );
    console.log("Connected to MongoDB");
    const result = await Vendor.updateMany(
      {},
      { $set: { status: "APPROVED" } },
    );
    console.log(`Updated ${result.modifiedCount} vendors to APPROVED.`);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

run();
