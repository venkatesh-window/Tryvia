import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "dns";

try {
  dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
} catch (e) {}

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const VendorSchema = new mongoose.Schema({ storeName: String, user: mongoose.Schema.Types.ObjectId, email: String }, { strict: false });
    const Vendor = mongoose.models.Vendor || mongoose.model('Vendor', VendorSchema);
    
    const ProductSchema = new mongoose.Schema({ vendor: mongoose.Schema.Types.ObjectId, name: String }, { strict: false });
    const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);
    
    // Find test vendors
    const testVendors = await Vendor.find({
      email: { $in: ["vendor_a_test@tryvia.com", "vendor_b_test@tryvia.com", "e2e_vendor_1@example.com"] }
    });
    
    const testVendorIds = testVendors.map(v => v._id);
    
    console.log(`Found ${testVendors.length} test vendors.`);
    
    // Also delete any product where vendor is null/undefined just to be safe
    const result1 = await Product.deleteMany({
      $or: [
        { vendor: { $in: testVendorIds } },
        { vendor: { $exists: false } },
        { vendor: null }
      ]
    });
    
    console.log(`Deleted ${result1.deletedCount} test products.`);
    
    await mongoose.disconnect();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

run();
