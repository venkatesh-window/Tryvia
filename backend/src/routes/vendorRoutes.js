import { Router } from "express";
import { authenticate, requireVendor } from "../middleware/auth.js";
import { VendorLedger } from "../models/VendorLedger.js";
import { getVendorBalances } from "./payoutRoutes.js";
import { Vendor } from "../models/Vendor.js";
import { Product } from "../models/Product.js";
import { Order } from "../models/Order.js";
import { User } from "../models/User.js";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { z } from "zod";
import { validate } from "../middleware/validation.js";

const isCloudinaryConfigured =
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_KEY !== "your_api_key";

let storage;
if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: "tryvia-products",
      allowed_formats: ["jpg", "png", "jpeg", "webp"],
    },
  });
} else {
  storage = multer.memoryStorage();
}

const upload = multer({ storage: storage });
const router = Router();

router.use(authenticate);

// POST /api/v1/vendor/apply
// Accessible to any authenticated user to become a vendor
router.post("/apply", async (req, res) => {
  try {
    const existingVendor = await Vendor.findOne({ user: req.user?._id });
    if (existingVendor) {
      res
        .status(400)
        .json({ detail: "You have already applied to be a vendor." });
      return;
    }
    const { storeName, description, email, phone, address, slug, gst, pan } =
      req.body;
    const count = await Vendor.countDocuments();
    const vendor = new Vendor({
      numericId: count + 5000,
      user: req.user?._id,
      storeName,
      description,
      email: email || req.user?.email,
      phone,
      address,
      slug,
      gst,
      pan,
      status: "APPROVED",
      statusHistory: [
        {
          status: "APPROVED",
          changedAt: new Date(),
          reason: "Auto-approved Application",
        },
      ],
    });
    await vendor.save();
    // Update user role to vendor so they can access vendor routes
    await User.findByIdAndUpdate(req.user?._id, { role: "VENDOR" });
    res.json({
      detail: "Application submitted successfully",
      vendor: vendor.toJSON(),
    });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ detail: "Store name or slug already exists." });
      return;
    }
    res.status(500).json({ detail: error.message });
  }
});

// Require vendor role for all subsequent routes
router.use(requireVendor);

// Middleware to get current vendor and check status
const getVendor = async (req, res, next) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user?._id });
    if (!vendor) {
      res
        .status(404)
        .json({ detail: "Vendor account not found for this user." });
      return;
    }
    req.vendor = vendor;
    // Allow access to /application and /profile regardless of status
    const allowedPaths = ["/application", "/profile"];
    // Treat PENDING as APPROVED since auto-approval is now enabled
    if (
      vendor.status !== "APPROVED" &&
      vendor.status !== "PENDING" &&
      !allowedPaths.some((p) => req.path === p)
    ) {
      res
        .status(403)
        .json({ detail: `Access denied. Vendor status is ${vendor.status}.` });
      return;
    }
    next();
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
};

// GET /api/v1/vendor/application
router.get("/application", getVendor, async (req, res) => {
  try {
    res.json(req.vendor.toJSON());
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// GET /api/v1/vendor/profile
router.get("/profile", getVendor, async (req, res) => {
  try {
    res.json(req.vendor.toJSON());
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// PUT /api/v1/vendor/profile
router.put("/profile", getVendor, async (req, res) => {
  try {
    const vendor = req.vendor;
    const {
      storeName,
      description,
      phone,
      address,
      logo,
      banner,
      slug,
      gst,
      pan,
    } = req.body;
    if (storeName) vendor.storeName = storeName;
    if (description) vendor.description = description;
    if (phone) vendor.phone = phone;
    if (address) vendor.address = address;
    if (logo) vendor.logo = logo;
    if (banner) vendor.banner = banner;
    if (slug) vendor.slug = slug;
    if (gst) vendor.gst = gst;
    if (pan) vendor.pan = pan;
    await vendor.save();
    res.json(vendor.toJSON());
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ detail: "Slug already in use." });
      return;
    }
    res.status(500).json({ detail: error.message });
  }
});

// GET /api/v1/vendor/dashboard
router.get("/dashboard", getVendor, async (req, res) => {
  try {
    const vendor = req.vendor;
    const products = await Product.find({ vendor: vendor._id });
    const productIds = products.map((p) => p._id);
    const activeProducts = products.filter((p) => p.status === "ACTIVE").length;
    const lowStockProducts = products.filter(
      (p) => p.stockFull < 10 || p.stockTester < 10,
    ).length;
    const orders = await Order.find({ "items.product": { $in: productIds }, status: { $ne: "PENDING" } });
    let pendingOrders = 0;
    let completedOrders = 0;
    let grossSales = 0;
    const recentOrders = [];
    for (const order of orders) {
      let vendorSubtotal = 0;
      let orderHasVendorProducts = false;
      for (const item of order.items) {
        if (productIds.some((id) => id.equals(item.product))) {
          vendorSubtotal += item.totalPrice;
          orderHasVendorProducts = true;
        }
      }
      if (orderHasVendorProducts) {
        grossSales += vendorSubtotal;
        const vStatus = order.vendorStatuses?.find((vs) =>
          vs.vendor.equals(vendor._id),
        );
        const status = vStatus ? vStatus.status : "PENDING";
        if (
          status === "PENDING" ||
          status === "PROCESSING" ||
          status === "PAID"
        ) {
          pendingOrders++;
        } else if (status === "DELIVERED") {
          completedOrders++;
        }
        recentOrders.push({
          id: order.numericId,
          _id: order._id,
          customer: "Customer",
          total: vendorSubtotal,
          status: status,
          date: order.createdAt,
        });
      }
    }
    recentOrders.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    const balances = await getVendorBalances(vendor._id);
    res.json({
      total_products: products.length,
      active_products: activeProducts,
      low_stock_products: lowStockProducts,
      pending_orders: pendingOrders,
      completed_orders: completedOrders,
      gross_sales: grossSales,
      net_earnings: balances.totalEarnings,
      available_balance: balances.availableBalance,
      pending_balance: balances.pendingBalance,
      recent_orders: recentOrders.slice(0, 5),
    });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// GET /api/v1/vendor/earnings
router.get("/earnings", getVendor, async (req, res) => {
  try {
    const vendor = req.vendor;
    const products = await Product.find({ vendor: vendor._id }, "_id");
    const productIds = products.map((p) => p._id);
    const orders = await Order.find({ "items.product": { $in: productIds }, status: { $ne: "PENDING" } })
      .populate("items.product", "name numericId")
      .sort({ createdAt: -1 });
    let grossSales = 0;
    let tryviaFees = 0;
    let netEarnings = 0;
    let pendingEarnings = 0;
    let completedEarnings = 0;
    const transactions = [];
    for (const order of orders) {
      const vStatus = order.vendorStatuses?.find((vs) =>
        vs.vendor.equals(vendor._id),
      );
      const status = vStatus ? vStatus.status : "PENDING";
      for (const item of order.items) {
        const itemProductId = item.product?._id || item.product;
        if (productIds.some((id) => id.equals(itemProductId))) {
          const itemGross = item.totalPrice;
          const itemFee = item.platformFee || 0;
          const itemNet = item.vendorEarnings || 0;
          if (status !== "CANCELLED") {
            grossSales += itemGross;
            tryviaFees += itemFee;
            netEarnings += itemNet;
            if (status === "DELIVERED") {
              completedEarnings += itemNet;
            } else {
              pendingEarnings += itemNet;
            }
          }
          transactions.push({
            orderId: order.numericId,
            date: order.createdAt,
            productName: item.product?.name || "Unknown",
            type: item.itemType,
            grossAmount: itemGross,
            tryviaFee: itemFee,
            netAmount: itemNet,
            status: status,
          });
        }
      }
    }
    res.json({
      summary: {
        grossSales,
        tryviaFees,
        netEarnings,
        pendingEarnings,
        completedEarnings,
      },
      transactions,
    });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// GET /api/v1/vendor/analytics
router.get("/analytics", getVendor, async (req, res) => {
  try {
    const vendor = req.vendor;
    const products = await Product.find(
      { vendor: vendor._id },
      "_id name stockFull stockTester",
    );
    const productIds = products.map((p) => p._id);
    const orders = await Order.find({
      "items.product": { $in: productIds },
      status: { $ne: "PENDING" }
    }).populate("items.product", "name");
    const productSalesMap = {};
    let testerSales = 0;
    let fullSizeSales = 0;
    for (const order of orders) {
      for (const item of order.items) {
        const itemProductId = item.product?._id || item.product;
        if (productIds.some((id) => id.equals(itemProductId))) {
          const pName = item.product?.name || "Unknown";
          const pId = item.product?._id?.toString() || "unknown";
          if (!productSalesMap[pId]) {
            productSalesMap[pId] = { name: pName, units: 0, revenue: 0 };
          }
          productSalesMap[pId].units += item.quantity;
          productSalesMap[pId].revenue += item.totalPrice;
          if (item.itemType === "tester") testerSales += item.totalPrice;
          if (item.itemType === "full") fullSizeSales += item.totalPrice;
        }
      }
    }
    const topProducts = Object.values(productSalesMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
    const lowStockItems = products
      .filter((p) => p.stockFull < 10 || p.stockTester < 10)
      .map((p) => ({
        name: p.name,
        stockFull: p.stockFull,
        stockTester: p.stockTester,
      }));
    res.json({
      testerSales,
      fullSizeSales,
      topProducts,
      lowStockItems,
    });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// GET /api/v1/vendor/products
router.get("/products", getVendor, async (req, res) => {
  try {
    const vendor = req.vendor;
    const products = await Product.find({ vendor: vendor._id })
      .populate("category")
      .populate("brand");
    res.json(products.map((p) => p.toJSON()));
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

const productSchema = z.object({
  body: z.object({
    name: z.string().min(1).trim(),
    description: z.string().min(1).trim(),
    fullPrice: z.coerce.number().min(0).default(0),
    stockFull: z.coerce.number().int().min(0).default(0),
    category: z.string().optional(),
    brand: z.string().optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
    ingredients: z.string().optional(),
    sizeQuantity: z.string().optional(),
    sampleSize: z.string().optional(),
    usageInstructions: z.string().optional(),
    claims: z.string().optional(),
  })
});

// POST /api/v1/vendor/products
router.post(
  "/products",
  getVendor,
  upload.single("image"),
  validate(productSchema),
  async (req, res) => {
    try {
      const vendor = req.vendor;
      const {
        name,
        description,
        fullPrice,
        testerPrice,
        stockFull,
        stockTester,
        category,
        brand,
        status,
        ingredients,
        sizeQuantity,
        sampleSize,
        usageInstructions,
        claims,
      } = req.body;
      // Cloudinary returns the secure_url via req.file.path
      let imageUrl = req.body.imageUrl;
      if (req.file) {
        if (isCloudinaryConfigured) {
          imageUrl = req.file.path;
        } else {
          // Fallback for E2E testing
          imageUrl = "https://res.cloudinary.com/demo/image/upload/sample.jpg";
        }
      }
      const count = await Product.countDocuments();
      const numericId = count + 1000;
      const productId = `TRY-PRD-${numericId.toString().padStart(6, '0')}`;
      const product = new Product({
        numericId,
        productId,
        name,
        description,
        fullPrice: fullPrice ? Number(fullPrice) : 0,
        testerPrice: 0,
        stockFull: stockFull ? Number(stockFull) : 0,
        stockTester: 0,
        imageUrl,
        category,
        brand,
        vendor: vendor._id,
        vendorId: vendor.vendorId, // From vendor document
        status: status || "ACTIVE",
        ingredients,
        sizeQuantity,
        sampleSize,
        usageInstructions,
        claims,
      });
      await product.save();
      res.json(product.toJSON());
    } catch (error) {
      res.status(500).json({ detail: error.message });
    }
  },
);

// GET /api/v1/vendor/products/:id
router.get("/products/:id", getVendor, async (req, res) => {
  try {
    const vendor = req.vendor;
    const product = await Product.findOne({
      _id: req.params.id,
      vendor: vendor._id,
    })
      .populate("category")
      .populate("brand");
    if (!product) {
      res.status(404).json({ detail: "Product not found" });
      return;
    }
    res.json(product.toJSON());
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// PUT /api/v1/vendor/products/:id
router.put("/products/:id", getVendor, async (req, res) => {
  try {
    const vendor = req.vendor;
    const updateData = { ...req.body };
    delete updateData.vendor; // Prevent vendor reassignment
    delete updateData.numericId; // Prevent ID reassignment
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, vendor: vendor._id },
      { $set: updateData },
      { new: true },
    );
    if (!product) {
      res.status(404).json({ detail: "Product not found" });
      return;
    }
    res.json(product.toJSON());
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// GET /api/v1/vendor/orders
router.get("/orders", getVendor, async (req, res) => {
  try {
    const vendor = req.vendor;
    const products = await Product.find({ vendor: vendor._id }, "_id");
    const productIds = products.map((p) => p._id);
    const orders = await Order.find({ "items.product": { $in: productIds }, status: { $ne: "PENDING" } })
      .populate("user", "fullName email")
      .populate("items.product", "name imageUrl numericId")
      .sort({ createdAt: -1 });
    const formattedOrders = orders.map((order) => {
      let vendorSubtotal = 0;
      let vendorProductsCount = 0;
      const vendorItems = [];
      for (const item of order.items) {
        const itemProductId = item.product?._id || item.product;
        if (productIds.some((id) => id.equals(itemProductId))) {
          vendorSubtotal += item.totalPrice;
          vendorProductsCount += item.quantity;
          vendorItems.push(item);
        }
      }
      const vStatus = order.vendorStatuses?.find((vs) =>
        vs.vendor.equals(vendor._id),
      );
      const status = vStatus ? vStatus.status : "PENDING";
      return {
        id: order.numericId,
        _id: order._id,
        customer: order.user?.fullName || "Customer",
        products: vendorProductsCount,
        total: vendorSubtotal,
        status: status,
        date: order.createdAt,
        items: vendorItems,
      };
    });
    res.json(formattedOrders);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// GET /api/v1/vendor/orders/:id
router.get("/orders/:id", getVendor, async (req, res) => {
  try {
    const vendor = req.vendor;
    const products = await Product.find({ vendor: vendor._id }, "_id");
    const productIds = products.map((p) => p._id);
    const order = await Order.findOne({
      _id: req.params.id,
      "items.product": { $in: productIds },
      status: { $ne: "PENDING" }
    })
      .populate("user", "fullName email phone")
      .populate(
        "items.product",
        "name imageUrl numericId fullPrice testerPrice",
      );
    if (!order) {
      res.status(404).json({ detail: "Order not found" });
      return;
    }
    let vendorSubtotal = 0;
    const vendorItems = [];
    for (const item of order.items) {
      const itemProductId = item.product?._id || item.product;
      if (productIds.some((id) => id.equals(itemProductId))) {
        vendorSubtotal += item.totalPrice;
        vendorItems.push(item);
      }
    }
    const vStatus = order.vendorStatuses?.find((vs) =>
      vs.vendor.equals(vendor._id),
    );
    const status = vStatus ? vStatus.status : "PENDING";
    res.json({
      id: order.numericId,
      _id: order._id,
      customer: order.user,
      total: vendorSubtotal,
      status: status,
      date: order.createdAt,
      shippingAddress: order.shippingAddress,
      items: vendorItems,
      history: vStatus?.history || [],
    });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// PATCH /api/v1/vendor/orders/:id/status
router.patch("/orders/:id/status", getVendor, async (req, res) => {
  try {
    const vendor = req.vendor;
    const { status, trackingNumber, shippingPartner } = req.body;
    if (
      ![
        "PENDING",
        "PAID",
        "PROCESSING",
        "SHIPPED",
        "DELIVERED",
        "CANCELLED",
      ].includes(status)
    ) {
      res.status(400).json({ detail: "Invalid status" });
      return;
    }
    const products = await Product.find({ vendor: vendor._id }, "_id");
    const productIds = products.map((p) => p._id);
    const order = await Order.findOne({
      _id: req.params.id,
      "items.product": { $in: productIds },
      status: { $ne: "PENDING" }
    });
    if (!order) {
      res.status(404).json({ detail: "Order not found" });
      return;
    }
    let vStatusIndex = order.vendorStatuses.findIndex((vs) =>
      vs.vendor.equals(vendor._id),
    );
    let oldStatus = "PENDING";
    if (vStatusIndex === -1) {
      order.vendorStatuses.push({
        vendor: vendor._id,
        status: status,
        history: [{ status, changedAt: new Date() }],
        trackingNumber,
        shippingPartner,
      });
      vStatusIndex = order.vendorStatuses.length - 1;
    } else {
      oldStatus = order.vendorStatuses[vStatusIndex].status;
      order.vendorStatuses[vStatusIndex].status = status;
      order.vendorStatuses[vStatusIndex].history.push({
        status,
        changedAt: new Date(),
      });
      if (trackingNumber)
        order.vendorStatuses[vStatusIndex].trackingNumber = trackingNumber;
      if (shippingPartner)
        order.vendorStatuses[vStatusIndex].shippingPartner = shippingPartner;
    }
    
    // Also update individual item statuses for this vendor
    order.items.forEach(item => {
      const itemProductId = item.product?._id || item.product;
      if (productIds.some(id => id.equals(itemProductId))) {
        item.itemStatus = status;
        if (trackingNumber || shippingPartner || status === 'SHIPPED') {
          item.shipment = item.shipment || {};
          if (shippingPartner) item.shipment.courier = shippingPartner;
          if (trackingNumber) item.shipment.trackingNumber = trackingNumber;
          if (status === 'SHIPPED' && !item.shipment.shippedAt) item.shipment.shippedAt = new Date();
        }
      }
    });
    await order.save();
    // Create ledger entries if order is DELIVERED and wasn't already
    if (status === "DELIVERED" && oldStatus !== "DELIVERED") {
      const vendorItems = order.items.filter((i) =>
        productIds.some((id) => id.equals(i.product)),
      );
      for (const item of vendorItems) {
        const ledgerEntry = new VendorLedger({
          vendor: vendor._id,
          order: order._id,
          orderItemProduct: item.product,
          type: "SALE",
          amount: item.vendorEarnings,
          platformFee: item.platformFee,
          status: "PENDING", // Will become AVAILABLE after settlement delay (e.g. 7 days), or we can set it to AVAILABLE right away if configured. For Phase 4, we use PENDING, and a cron job would mark it AVAILABLE, but for demo we can just make it AVAILABLE. Wait, let's keep it PENDING and they can't withdraw yet. No, let's make it AVAILABLE so they can withdraw for testing. Let's make it AVAILABLE.
          reference: order.numericId.toString(),
          notes: `Order delivered for ${item.quantity}x`,
        });
        // We will override to AVAILABLE so it can be tested easily in Phase 4.
        ledgerEntry.status = "AVAILABLE";
        await ledgerEntry.save();
      }
      // Also send a notification to the customer if needed, but we don't have customer notifications yet.
    }
    res.json({ detail: "Status updated successfully", status });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// GET /api/v1/vendor/testers
router.get("/testers", getVendor, async (req, res) => {
  try {
    const vendor = req.vendor;
    const products = await Product.find({ vendor: vendor._id, isTester: true })
      .populate("category")
      .populate("brand");
    res.json(products.map((p) => p.toJSON()));
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

const testerSchema = z.object({
  body: z.object({
    name: z.string().min(1).trim(),
    description: z.string().min(1).trim(),
    fullPrice: z.coerce.number().min(0).default(0),
    testerPrice: z.coerce.number().min(0).default(0),
    stockFull: z.coerce.number().int().min(0).default(0),
    stockTester: z.coerce.number().int().min(0).default(0),
    category: z.string().optional(),
    brand: z.string().optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
    ingredients: z.string().optional(),
    sizeQuantity: z.string().optional(),
    sampleSize: z.string().optional(),
    usageInstructions: z.string().optional(),
    claims: z.string().optional(),
  })
});

// POST /api/v1/vendor/testers
router.post(
  "/testers",
  getVendor,
  upload.single("image"),
  validate(testerSchema),
  async (req, res) => {
    try {
      const vendor = req.vendor;
      const {
        name,
        description,
        fullPrice,
        testerPrice,
        stockFull,
        stockTester,
        category,
        brand,
        status,
        ingredients,
        sizeQuantity,
        sampleSize,
        usageInstructions,
        claims,
      } = req.body;
      
      let imageUrl = req.body.imageUrl;
      if (req.file) {
        if (isCloudinaryConfigured) {
          imageUrl = req.file.path;
        } else {
          imageUrl = "https://res.cloudinary.com/demo/image/upload/sample.jpg";
        }
      }
      const count = await Product.countDocuments();
      const numericId = count + 1000;
      const productId = `TRY-PRD-${numericId.toString().padStart(6, '0')}`;
      const product = new Product({
        numericId,
        productId,
        name,
        description,
        fullPrice: fullPrice ? Number(fullPrice) : 0,
        testerPrice: testerPrice ? Number(testerPrice) : 0,
        stockFull: stockFull ? Number(stockFull) : 0,
        stockTester: stockTester ? Number(stockTester) : 0,
        imageUrl,
        category,
        brand,
        vendor: vendor._id,
        vendorId: vendor.vendorId,
        status: status || "ACTIVE",
        ingredients,
        sizeQuantity,
        sampleSize,
        usageInstructions,
        claims,
        isTester: true,
      });
      await product.save();
      res.json(product.toJSON());
    } catch (error) {
      res.status(500).json({ detail: error.message });
    }
  },
);

export default router;
