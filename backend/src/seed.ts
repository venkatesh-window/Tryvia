import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { Brand } from './models/Brand';
import { Category } from './models/Category';
import { Product } from './models/Product';
import { User } from './models/User';
import { WalletRule } from './models/WalletRule';

dotenv.config();

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tryvia';

export async function seed() {
  try {
    console.log('🌱 Starting seed process...');

    // Clear existing collections
    await Brand.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    await User.deleteMany({});
    await WalletRule.deleteMany({});
    console.log('🧹 Cleared existing data.');

    // 1. Seed Brands
    const brandChanel = await Brand.create({
      numericId: 1,
      name: 'Chanel',
      slug: 'chanel',
      description: 'Iconic French Haute Parfumerie & Luxury Cosmetics',
      logoUrl: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=300',
    });

    const brandDior = await Brand.create({
      numericId: 2,
      name: 'Dior',
      slug: 'dior',
      description: 'Christian Dior Haute Couture & Luxury Fragrances',
      logoUrl: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?q=80&w=300',
    });

    const brandKiehls = await Brand.create({
      numericId: 3,
      name: 'Kiehl\'s',
      slug: 'kiehls',
      description: 'Finest apothecary skincare formulations since 1851',
      logoUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=300',
    });

    const brandLeLabo = await Brand.create({
      numericId: 4,
      name: 'Le Labo',
      slug: 'le-labo',
      description: 'Artisanal slow perfumery handcrafted in New York',
      logoUrl: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=300',
    });

    // 2. Seed Categories
    const catSkincare = await Category.create({
      numericId: 1,
      name: 'Skincare',
      slug: 'skincare',
      description: 'Hydrating serums, restoring night creams, and botanical oils',
      imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=600',
    });

    const catFragrance = await Category.create({
      numericId: 2,
      name: 'Fragrance',
      slug: 'fragrance',
      description: 'Rare artisanal extrait de parfum and iconic French fragrances',
      imageUrl: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=600',
    });

    const catMakeup = await Category.create({
      numericId: 3,
      name: 'Makeup',
      slug: 'makeup',
      description: 'Satin lipsticks, glow oils, and couture cosmetic formulations',
      imageUrl: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?q=80&w=600',
    });

    const catGiftSets = await Category.create({
      numericId: 4,
      name: 'Gift Sets',
      slug: 'gift-sets',
      description: 'Curated discovery discovery sampler boxes and mini collections',
      imageUrl: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=600',
    });

    // 3. Seed Products
    const productsData = [
      {
        numericId: 1,
        name: 'Midnight Recovery Cloud Cream',
        description: 'A luxurious, lightweight cream that visibly plumps and smooths your skin while you sleep with botanical squalane and evening primrose.',
        fullPrice: 5200,
        testerPrice: 300,
        stockFull: 25,
        stockTester: 50,
        imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=800',
        brand: brandKiehls._id,
        category: catSkincare._id,
        tags: ['Hydrating Formula', 'Night Repair', 'Lightweight'],
        isFeatured: true,
      },
      {
        numericId: 2,
        name: 'Coco Noir Eau De Parfum',
        description: 'An intimate, seductive oriental fragrance with luminous bergamot, velvety May rose, and intoxicating patchouli sillage.',
        fullPrice: 14500,
        testerPrice: 350,
        stockFull: 15,
        stockTester: 40,
        imageUrl: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=800',
        brand: brandChanel._id,
        category: catFragrance._id,
        tags: ['Haute Parfumerie', 'Evening Sillage', 'Iconic'],
        isFeatured: true,
      },
      {
        numericId: 3,
        name: 'Dior Addict Lip Glow Oil',
        description: 'Nourishing glossy lip oil infused with cherry oil that enhances natural lip color with mirror-like shine and deep hydration.',
        fullPrice: 3800,
        testerPrice: 250,
        stockFull: 30,
        stockTester: 60,
        imageUrl: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?q=80&w=800',
        brand: brandDior._id,
        category: catMakeup._id,
        tags: ['Glossy Glow', 'Cherry Oil', 'Best Seller'],
        isFeatured: true,
      },
      {
        numericId: 4,
        name: 'Sauvage Eau de Parfum',
        description: 'A powerful blend of crisp Calabrian bergamot, smoky vanilla absolute, and radiant woody amber facets.',
        fullPrice: 11500,
        testerPrice: 350,
        stockFull: 20,
        stockTester: 45,
        imageUrl: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?q=80&w=800',
        brand: brandDior._id,
        category: catFragrance._id,
        tags: ['Signature Fragrance', 'Calabrian Bergamot', 'Woody Amber'],
        isFeatured: true,
      },
      {
        numericId: 5,
        name: 'Bleu De Chanel Parfum',
        description: 'The most intense expression of Bleu de Chanel. An aromatic, intensely woody fragrance with refined sandalwood.',
        fullPrice: 12800,
        testerPrice: 350,
        stockFull: 18,
        stockTester: 35,
        imageUrl: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=800',
        brand: brandChanel._id,
        category: catFragrance._id,
        tags: ['Noble Sandalwood', 'Woody Aromatic', 'Luxury Sillage'],
        isFeatured: true,
      },
      {
        numericId: 6,
        name: 'Santal 33 Eau de Parfum',
        description: 'An intoxicating icon of smoky cardamom, iris, violet, and creamy Australian sandalwood notes.',
        fullPrice: 24000,
        testerPrice: 450,
        stockFull: 10,
        stockTester: 25,
        imageUrl: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?q=80&w=800',
        brand: brandLeLabo._id,
        category: catFragrance._id,
        tags: ['Cult Classic', 'Cardamom & Sandalwood', 'Artisanal'],
        isFeatured: false,
      },
    ];

    await Product.insertMany(productsData);
    console.log(`📦 Seeded ${productsData.length} luxury products.`);

    // 4. Seed Test User
    const passwordHash = await bcrypt.hash('password123', 10);
    const testUser = await User.create({
      numericId: 1,
      email: 'test@tryvia.com',
      passwordHash,
      fullName: 'Tester User',
      walletBalance: 350,
      loyaltyTier: 'TRYVIA BLACK',
      stars: 0,
      isActive: true,
      isSuperuser: true,
    });
    console.log(`👤 Seeded test user: ${testUser.email} (password: password123)`);

    // 5. Seed Wallet Rules
    await WalletRule.create({
      minTesterPurchase: 200,
      redeemPercentage: 0.9, // 90% upgrade credit
      platformFeePercentage: 0.1, // 10% fee
      expiryDays: 30,
      isActive: true,
    });
    console.log('💳 Seeded 90% smart upgrade wallet rules.');

    console.log('✨ Seeding completed successfully!');
  } catch (error: any) {
    console.error('❌ Seeding failed:', error);
  }
}
