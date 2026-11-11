import { Router } from "express";
import mongoose from "mongoose";
import { Product } from "../models/Product.js";
import { Category } from "../models/Category.js";
import { Brand } from "../models/Brand.js";
import { Vendor } from "../models/Vendor.js";

const router = Router();

// In-memory micro-cache for high-frequency catalog reads
const memoryCache = new Map();
const getOrSetCache = async (key, ttlMs, fetchFn) => {
  const cached = memoryCache.get(key);
  if (cached && Date.now() - cached.timestamp < ttlMs) {
    return cached.data;
  }
  const data = await fetchFn();
  memoryCache.set(key, { data, timestamp: Date.now() });
  return data;
};

export const clearProductCache = () => {
  memoryCache.clear();
};

// Fast transformation helpers without heavy Mongoose Document overhead
const formatItem = (item) => {
  if (!item) return null;
  return {
    ...item,
    id: item.numericId || item._id,
  };
};

const formatProduct = (p) => {
  if (!p) return null;
  return {
    ...p,
    id: p.numericId || p._id,
    full_price: p.fullPrice,
    tester_price: p.testerPrice,
    stock_full: p.stockFull,
    stock_tester: p.stockTester,
    image_url: p.imageUrl,
    brand: p.brand ? formatItem(p.brand) : undefined,
    category: p.category ? formatItem(p.category) : undefined,
    vendor_id: p.vendor || undefined,
  };
};

// GET /api/v1/products/categories (Cached for 60 seconds)
router.get("/categories", async (req, res) => {
  try {
    const categories = await getOrSetCache("all_categories", 60000, async () => {
      const items = await Category.find().lean();
      return items.map(formatItem);
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// GET /api/v1/products/brands (Cached for 60 seconds)
router.get("/brands", async (req, res) => {
  try {
    const brands = await getOrSetCache("all_brands", 60000, async () => {
      const items = await Brand.find().lean();
      return items.map(formatItem);
    });
    res.json(brands);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// GET /api/v1/products/testers (Cached for 30 seconds)
router.get("/testers", async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
    const cacheKey = `testers_limit_${limit}`;
    const products = await getOrSetCache(cacheKey, 30000, async () => {
      const items = await Product.find({ stockTester: { $gt: 0 }, status: "ACTIVE" })
        .populate("brand")
        .populate("category")
        .limit(limit)
        .lean();
      return items.map(formatProduct);
    });

    res.json(products);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// GET /api/v1/products/store/:slug
router.get("/store/:slug", async (req, res) => {
  try {
    const slug = req.params.slug;
    const vendor = await Vendor.findOne({ slug, status: "APPROVED" })
      .select("storeName description logo banner slug createdAt")
      .lean();

    if (!vendor) {
      res.status(404).json({ detail: "Store not found or not active" });
      return;
    }

    const products = await Product.find({
      vendor: vendor._id,
      status: "ACTIVE",
    })
      .populate("brand")
      .populate("category")
      .lean();

    res.json({
      vendor: formatItem(vendor),
      products: products.map(formatProduct),
    });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// GET /api/v1/products/:id
router.get("/:id", async (req, res) => {
  try {
    const idParam = typeof req.params.id === "string" ? req.params.id : "";
    let query;

    if (!isNaN(Number(idParam))) {
      query = { numericId: Number(idParam) };
    } else if (mongoose.Types.ObjectId.isValid(idParam)) {
      query = { _id: idParam };
    } else {
      res.status(404).json({ detail: "Product not found" });
      return;
    }

    const product = await Product.findOne(query)
      .populate("brand")
      .populate("category")
      .lean();

    if (!product) {
      res.status(404).json({ detail: "Product not found" });
      return;
    }

    res.json(formatProduct(product));
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// GET /api/v1/products
router.get("/", async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 14, 1), 100);
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const categoryId = typeof req.query.category_id === "string" ? req.query.category_id : undefined;

    const filter = { status: "ACTIVE" };

    if (search) {
      const sanitizedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (sanitizedSearch.length > 0) {
        filter.$or = [
          { name: { $regex: sanitizedSearch, $options: "i" } },
          { description: { $regex: sanitizedSearch, $options: "i" } },
        ];
      }
    }

    if (categoryId) {
      if (!isNaN(Number(categoryId))) {
        const cat = await Category.findOne({ numericId: Number(categoryId) }).select("_id").lean();
        if (cat) filter.category = cat._id;
      } else if (mongoose.Types.ObjectId.isValid(categoryId)) {
        filter.category = categoryId;
      }
    }

    // Default home page query without search filters can be cached for 20s
    const cacheKey = (!search && !categoryId) ? `catalog_home_${limit}` : null;
    if (cacheKey) {
      const cachedProducts = await getOrSetCache(cacheKey, 20000, async () => {
        const items = await Product.find(filter)
          .populate("brand")
          .populate("category")
          .limit(limit)
          .lean();
        return items.map(formatProduct);
      });
      return res.json(cachedProducts);
    }

    const products = await Product.find(filter)
      .populate("brand")
      .populate("category")
      .limit(limit)
      .lean();

    res.json(products.map(formatProduct));
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

export default router;
