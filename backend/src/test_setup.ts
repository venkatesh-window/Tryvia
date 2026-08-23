import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { User } from './models/User';
import { Vendor } from './models/Vendor';
import { Product } from './models/Product';

dotenv.config();

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tryvia';

export async function setup() {
  try {
    console.log('Running test data setup...');

    const passwordHash = await bcrypt.hash('password123', 10);

    // 1. Admin
    const admin = await User.findOneAndUpdate(
      { email: 'admin_test@tryvia.com' },
      {
        numericId: 100,
        email: 'admin_test@tryvia.com',
        passwordHash,
        fullName: 'Admin Test',
        isActive: true,
        isSuperuser: true,
        role: 'ADMIN'
      },
      { upsert: true, new: true }
    );
    console.log('Admin user created/updated:', admin.email);

    // 2. Customers
    const customerA = await User.findOneAndUpdate(
      { email: 'customer_a_test@tryvia.com' },
      {
        numericId: 101,
        email: 'customer_a_test@tryvia.com',
        passwordHash,
        fullName: 'Customer A Test',
        isActive: true,
        isSuperuser: false,
        walletBalance: 1000,
      },
      { upsert: true, new: true }
    );
    console.log('Customer A created/updated:', customerA.email);

    const customerB = await User.findOneAndUpdate(
      { email: 'customer_b_test@tryvia.com' },
      {
        numericId: 102,
        email: 'customer_b_test@tryvia.com',
        passwordHash,
        fullName: 'Customer B Test',
        isActive: true,
        isSuperuser: false,
        walletBalance: 1000,
      },
      { upsert: true, new: true }
    );
    console.log('Customer B created/updated:', customerB.email);

    // 3. Vendors Users and Vendor Profiles
    const vendorAUser = await User.findOneAndUpdate(
      { email: 'vendor_a_test@tryvia.com' },
      {
        numericId: 103,
        email: 'vendor_a_test@tryvia.com',
        passwordHash,
        fullName: 'Vendor A User',
        isActive: true,
        isSuperuser: false,
        role: 'VENDOR'
      },
      { upsert: true, new: true }
    );
    console.log('Vendor A User created/updated:', vendorAUser.email);

    const vendorA = await Vendor.findOneAndUpdate(
      { user: vendorAUser._id },
      {
        numericId: 201,
        user: vendorAUser._id,
        storeName: 'Vendor A Test Business',
        slug: 'vendor-a-test',
        description: 'Test vendor A',
        email: 'vendor_a_test@tryvia.com',
        status: 'APPROVED',
      },
      { upsert: true, new: true }
    );
    console.log('Vendor A Profile created/updated:', vendorA.storeName);

    const vendorBUser = await User.findOneAndUpdate(
      { email: 'vendor_b_test@tryvia.com' },
      {
        numericId: 104,
        email: 'vendor_b_test@tryvia.com',
        passwordHash,
        fullName: 'Vendor B User',
        isActive: true,
        isSuperuser: false,
        role: 'VENDOR'
      },
      { upsert: true, new: true }
    );
    console.log('Vendor B User created/updated:', vendorBUser.email);

    const vendorB = await Vendor.findOneAndUpdate(
      { user: vendorBUser._id },
      {
        numericId: 202,
        user: vendorBUser._id,
        storeName: 'Vendor B Test Business',
        slug: 'vendor-b-test',
        description: 'Test vendor B',
        email: 'vendor_b_test@tryvia.com',
        status: 'APPROVED',
      },
      { upsert: true, new: true }
    );
    console.log('Vendor B Profile created/updated:', vendorB.storeName);

    // Assign products to Vendor A
    const products = await Product.find({ vendor: { $exists: false } });
    if (products.length > 0) {
      await Product.updateMany({}, { vendor: vendorA._id });
      console.log(`Assigned ${products.length} products to Vendor A`);
    }

    console.log('Test setup complete.');
  } catch (error) {
    console.error('Setup failed:', error);
  }
};
