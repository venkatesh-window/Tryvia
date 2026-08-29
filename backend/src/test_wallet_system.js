import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "./models/User.js";
import { Product } from "./models/Product.js";
import { Order } from "./models/Order.js";
import { WalletTransaction } from "./models/WalletTransaction.js";
import { WalletCredit } from "./models/WalletCredit.js";
import { fulfillOrder } from "./utils/orderHelper.js";
import { Brand } from "./models/Brand.js";
import { Category } from "./models/Category.js";

dotenv.config();

const mongoURI = process.env.MONGODB_URI || "mongodb://localhost:27017/tryvia";

async function runTests() {
  console.log("🧪 Starting Wallet & Credits System Verification Tests...");
  
  await mongoose.connect(mongoURI);
  console.log("✅ Connected to MongoDB");

  // 1. Setup temporary test data
  const testEmail = `test_wallet_user_${Date.now()}@tryvia.com`;
  const user = new User({
    numericId: Math.floor(Math.random() * 100000),
    email: testEmail,
    passwordHash: "dummyhash",
    fullName: "Wallet Test User",
    walletBalance: 0,
  });
  await user.save();

  // Create a brand and category for the products
  let brand = await Brand.findOne();
  if (!brand) {
    brand = await Brand.create({ numericId: 1, name: "Test Brand", slug: "test-brand" });
  }
  let category = await Category.findOne();
  if (!category) {
    category = await Category.create({ numericId: 1, name: "Test Category", slug: "test-cat" });
  }

  // Create a test product
  const product = new Product({
    numericId: Math.floor(Math.random() * 100000),
    name: "Luxury Perfume",
    fullPrice: 1000,
    testerPrice: 100,
    stockFull: 10,
    stockTester: 20,
    brand: brand._id,
    category: category._id,
  });
  await product.save();

  console.log("Created test user and test product.");

  // Test cases matching Section 15 validation table
  const testScenarios = [
    { price: 1000, wallet: 800, expectedUsed: 600, expectedFee: 60, expectedPays: 460, expectedRemaining: 200 },
    { price: 1000, wallet: 300, expectedUsed: 300, expectedFee: 30, expectedPays: 730, expectedRemaining: 0 },
    { price: 1000, wallet: 0,   expectedUsed: 0,   expectedFee: 0,  expectedPays: 1000, expectedRemaining: 0 },
    { price: 500,  wallet: 500, expectedUsed: 300, expectedFee: 30, expectedPays: 230, expectedRemaining: 200 },
    { price: 500,  wallet: 100, expectedUsed: 100, expectedFee: 10, expectedPays: 410, expectedRemaining: 0 },
    { price: 2000, wallet: 5000,expectedUsed: 1200,expectedFee: 120,expectedPays: 920, expectedRemaining: 3800 },
  ];

  for (const [index, scenario] of testScenarios.entries()) {
    console.log(`\n--- Scenario ${index + 1}: Price ₹${scenario.price}, Wallet Balance ₹${scenario.wallet} ---`);
    
    // Set user wallet balance
    user.walletBalance = scenario.wallet;
    await user.save();

    // Perform calculations (Backend logic check)
    const originalProductsTotal = scenario.price;
    const maximumWalletUsage = originalProductsTotal * 0.60;
    const walletUsed = Math.min(user.walletBalance, maximumWalletUsage);
    const productAmount = originalProductsTotal - walletUsed;
    const platformFee = walletUsed * 0.10;
    const customerPayment = productAmount + platformFee;
    const remainingWallet = user.walletBalance - walletUsed;

    // Assert calculations
    if (walletUsed !== scenario.expectedUsed) {
      throw new Error(`Scenario ${index + 1} failed: Expected walletUsed ${scenario.expectedUsed}, got ${walletUsed}`);
    }
    if (platformFee !== scenario.expectedFee) {
      throw new Error(`Scenario ${index + 1} failed: Expected platformFee ${scenario.expectedFee}, got ${platformFee}`);
    }
    if (customerPayment !== scenario.expectedPays) {
      throw new Error(`Scenario ${index + 1} failed: Expected customerPayment ${scenario.expectedPays}, got ${customerPayment}`);
    }
    if (remainingWallet !== scenario.expectedRemaining) {
      throw new Error(`Scenario ${index + 1} failed: Expected remainingWallet ${scenario.expectedRemaining}, got ${remainingWallet}`);
    }

    console.log(`  Calculations verified:
      Price: ${scenario.price}
      Wallet Before: ${scenario.wallet}
      Max Wallet Usage: ${maximumWalletUsage}
      Wallet Used: ${walletUsed}
      Product Amount: ${productAmount}
      Platform Fee: ${platformFee}
      Customer Pays: ${customerPayment}
      Remaining Wallet: ${remainingWallet}
    `);

    // Create a pending order
    const order = new Order({
      numericId: 20000 + index,
      user: user._id,
      items: [{
        product: product._id,
        itemType: "full",
        quantity: 1,
        unitPrice: scenario.price,
        totalPrice: scenario.price,
      }],
      subtotal: scenario.price,
      walletDiscount: walletUsed,
      platformFee,
      totalAmount: customerPayment,
      status: "PENDING",
      walletBalanceBefore: scenario.wallet,
      maximumWalletUsage,
      walletUsed,
      productAmount,
      walletBalanceAfter: remainingWallet,
    });
    await order.save();

    // Verify order fulfillment
    await fulfillOrder(order._id);

    // Fetch updated user & order details
    const updatedUser = await User.findById(user._id);
    const updatedOrder = await Order.findById(order._id);

    console.log(`  Fulfillment checks:
      Order status changed to PAID: ${updatedOrder.status === "PAID" ? "PASS" : "FAIL"}
      User wallet balance updated: ${updatedUser.walletBalance} (Expected: ${scenario.expectedRemaining})
    `);

    if (updatedUser.walletBalance !== scenario.expectedRemaining) {
      throw new Error(`Fulfillment failed: Expected user wallet balance to be ${scenario.expectedRemaining}, got ${updatedUser.walletBalance}`);
    }

    // Verify Debit Transaction History
    if (walletUsed > 0) {
      const tx = await WalletTransaction.findOne({ order: order._id, type: "DEBIT" });
      if (!tx || tx.amount !== walletUsed) {
        throw new Error(`Debit transaction record verification failed for order #${order.numericId}`);
      }
      console.log(`  Debit transaction verified: ${tx.amount} credits debited.`);
    }
  }

  // 4. Test Mini Product Purchase -> Credits
  console.log("\n--- Scenario: Mini Product Purchase -> Credits ---");
  user.walletBalance = 250;
  await user.save();

  const miniOrder = new Order({
    numericId: 30001,
    user: user._id,
    items: [{
      product: product._id,
      itemType: "tester",
      quantity: 1,
      unitPrice: 100,
      totalPrice: 100,
    }],
    subtotal: 100,
    totalAmount: 100,
    status: "PENDING",
  });
  await miniOrder.save();

  // Fulfill mini product order
  await fulfillOrder(miniOrder._id);

  const finalUser = await User.findById(user._id);
  const finalOrder = await Order.findById(miniOrder._id);
  
  console.log(`  Fulfillment checks:
    Order status changed to PAID: ${finalOrder.status === "PAID" ? "PASS" : "FAIL"}
    User wallet balance updated: ${finalUser.walletBalance} (Expected: 350)
  `);

  if (finalUser.walletBalance !== 350) {
    throw new Error(`Mini product credit failed: Expected walletBalance 350, got ${finalUser.walletBalance}`);
  }

  // Verify Credit Transaction History
  const creditTx = await WalletTransaction.findOne({ order: miniOrder._id, type: "CREDIT" });
  if (!creditTx || creditTx.amount !== 100) {
    throw new Error(`Credit transaction record verification failed for order #${miniOrder.numericId}`);
  }
  console.log(`  Credit transaction verified: ${creditTx.amount} credits added.`);

  // 5. Test Idempotency
  console.log("\n--- Scenario: Duplicate Fulfill Callback (Idempotency) ---");
  const balanceBeforeFulfill = finalUser.walletBalance;
  await fulfillOrder(miniOrder._id);
  const userAfterDupFulfill = await User.findById(user._id);
  
  if (userAfterDupFulfill.walletBalance !== balanceBeforeFulfill) {
    throw new Error("Idempotency check failed: Duplicate fulfillment changed wallet balance!");
  }
  console.log("  Idempotency verified: Duplicate callbacks do not affect wallet balance.");

  // 6. Test Credit Lot Deduction (Earliest Expiring First & Excluded Expired)
  console.log("\n--- Scenario: Credit Lot Deductions (Earliest Expiring First) ---");
  // Clean up any old credits for this user first
  await WalletCredit.deleteMany({ user: user._id });

  // Create three credit lots:
  // Lot A: ₹100, expires in 2 days (Earliest)
  // Lot B: ₹200, expires in 5 days (Middle)
  // Lot C: ₹300, expired 1 day ago (Expired, should be excluded!)
  // Lot D: ₹400, expires in 10 days (Latest)
  const expiryA = new Date(); expiryA.setDate(expiryA.getDate() + 2);
  const expiryB = new Date(); expiryB.setDate(expiryB.getDate() + 5);
  const expiryC = new Date(); expiryC.setDate(expiryC.getDate() - 1); // Expired!
  const expiryD = new Date(); expiryD.setDate(expiryD.getDate() + 10);

  const lotA = await WalletCredit.create({
    numericId: 90001,
    user: user._id,
    eligibleProduct: product._id,
    originalAmount: 100,
    redeemableAmount: 100,
    platformFee: 0,
    status: "ACTIVE",
    expiryDate: expiryA,
  });

  const lotB = await WalletCredit.create({
    numericId: 90002,
    user: user._id,
    eligibleProduct: product._id,
    originalAmount: 200,
    redeemableAmount: 200,
    platformFee: 0,
    status: "ACTIVE",
    expiryDate: expiryB,
  });

  const lotC = await WalletCredit.create({
    numericId: 90003,
    user: user._id,
    eligibleProduct: product._id,
    originalAmount: 300,
    redeemableAmount: 300,
    platformFee: 0,
    status: "ACTIVE",
    expiryDate: expiryC,
  });

  const lotD = await WalletCredit.create({
    numericId: 90004,
    user: user._id,
    eligibleProduct: product._id,
    originalAmount: 400,
    redeemableAmount: 400,
    platformFee: 0,
    status: "ACTIVE",
    expiryDate: expiryD,
  });

  // Set user wallet balance to sum of active non-expired lots: 100 + 200 + 400 = 700
  // (Lot C is expired, so its ₹300 is excluded!)
  user.walletBalance = 700;
  await user.save();

  // Create an order that uses ₹250 of wallet credit
  // This should consume:
  // - Lot A completely (₹100) -> status: USED, redeemable: 0
  // - Lot B partially (₹150) -> status: PARTIALLY_USED, redeemable: 50
  // - Lot C should be untouched because it's expired!
  // - Lot D should be untouched because we only need ₹250!
  const debitOrder = new Order({
    numericId: 30002,
    user: user._id,
    items: [{
      product: product._id,
      itemType: "full",
      quantity: 1,
      unitPrice: 1000,
      totalPrice: 1000,
    }],
    subtotal: 1000,
    walletDiscount: 250,
    totalAmount: 750, // 1000 - 250
    status: "PENDING",
    walletUsed: 250,
  });
  await debitOrder.save();

  await fulfillOrder(debitOrder._id);

  const updatedLotA = await WalletCredit.findById(lotA._id);
  const updatedLotB = await WalletCredit.findById(lotB._id);
  const updatedLotC = await WalletCredit.findById(lotC._id);
  const updatedLotD = await WalletCredit.findById(lotD._id);

  console.log(`  Lot A (Earliest, ₹100): Status = ${updatedLotA.status}, Redeemable = ${updatedLotA.redeemableAmount} (Expected: USED, 0)`);
  console.log(`  Lot B (Middle, ₹200): Status = ${updatedLotB.status}, Redeemable = ${updatedLotB.redeemableAmount} (Expected: PARTIALLY_USED, 50)`);
  console.log(`  Lot C (Expired, ₹300): Status = ${updatedLotC.status}, Redeemable = ${updatedLotC.redeemableAmount} (Expected: ACTIVE/EXPIRED, 300 - untouched)`);
  console.log(`  Lot D (Latest, ₹400): Status = ${updatedLotD.status}, Redeemable = ${updatedLotD.redeemableAmount} (Expected: ACTIVE, 400 - untouched)`);

  if (updatedLotA.status !== "USED" || updatedLotA.redeemableAmount !== 0) {
    throw new Error("Deduction error: Lot A was not completely consumed!");
  }
  if (updatedLotB.status !== "PARTIALLY_USED" || updatedLotB.redeemableAmount !== 50) {
    throw new Error("Deduction error: Lot B was not partially consumed to 50!");
  }
  if (updatedLotC.redeemableAmount !== 300) {
    throw new Error("Deduction error: Expired Lot C was incorrectly deducted!");
  }
  if (updatedLotD.redeemableAmount !== 400) {
    throw new Error("Deduction error: Lot D was incorrectly deducted!");
  }

  console.log("  Credit lot deductions and expiration checks verified successfully.");

  // Clean up
  await User.deleteOne({ _id: user._id });
  await Product.deleteOne({ _id: product._id });
  await Order.deleteMany({ user: user._id });
  await WalletTransaction.deleteMany({ user: user._id });
  await WalletCredit.deleteMany({ user: user._id });

  console.log("\n✅ ALL TESTS COMPLETED SUCCESSFULLY! No errors found.");
  mongoose.disconnect();
}

runTests().catch(err => {
  console.error("\n❌ TESTS FAILED WITH ERROR:", err);
  mongoose.disconnect();
  process.exit(1);
});
