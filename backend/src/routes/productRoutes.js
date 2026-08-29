import { Router } from "express";
import mongoose from "mongoose";
import { Product } from "../models/Product.js";
import { Category } from "../models/Category.js";
import { Vendor } from "../models/Vendor.js";

const router = Router();

// GET /api/v1/products/testers
router.get("/testers", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const products = await Product.find({ stockTester: { $gt: 0 } })
      .populate("brand")
      .populate("category")
      .limit(limit);

    res.json(products.map((p) => p.toJSON()));
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
      .populate("category");

    if (!product) {
      res.status(404).json({ detail: "Product not found" });
      return;
    }

    res.json(product.toJSON());
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// GET /api/v1/products
router.get("/", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 14;
    const search = req.query.search;
    const categoryId =
      typeof req.query.category_id === "string"
        ? req.query.category_id
        : undefined;

    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (categoryId) {
      if (!isNaN(Number(categoryId))) {
        const cat = await Category.findOne({ numericId: Number(categoryId) });
        if (cat) filter.category = cat._id;
      } else if (mongoose.Types.ObjectId.isValid(categoryId)) {
        filter.category = categoryId;
      }
    }

    const products = await Product.find(filter)
      .populate("brand")
      .populate("category")
      .limit(limit);

    res.json(products.map((p) => p.toJSON()));
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// GET /api/v1/products/store/:slug
router.get("/store/:slug", async (req, res) => {
  try {
    const slug = req.params.slug;
    // Only fetch APPROVED vendors
    const vendor = await Vendor.findOne({ slug, status: "APPROVED" }).select(
      "storeName description logo banner slug createdAt",
    );
    if (!vendor) {
      res.status(404).json({ detail: "Store not found or not active" });
      return;
    }
    // Only fetch ACTIVE products for this vendor
    const products = await Product.find({
      vendor: vendor._id,
      status: "ACTIVE",
    })
      .populate("brand")
      .populate("category");
    res.json({
      vendor: vendor.toJSON(),
      products: products.map((p) => p.toJSON()),
    });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

export default router;
