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
    
    const ProductSchema = new mongoose.Schema({ vendor: mongoose.Schema.Types.ObjectId, name: String }, { strict: false });
    const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);
    
    const products = await Product.find({}, { name: 1, vendor: 1 });
    console.log(`Total products remaining: ${products.length}`);
    products.forEach(p => {
        console.log(`- ${p.name}: vendor = ${p.vendor}`);
    });
    
    await mongoose.disconnect();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

run();
