import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { Product } from '../models/Product';
import { Category } from '../models/Category';
import { Brand } from '../models/Brand';

const router = Router();

// GET /api/v1/products/testers
router.get('/testers', async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const products = await Product.find({ stockTester: { $gt: 0 } })
      .populate('brand')
      .populate('category')
      .limit(limit);

    res.json(products.map(p => p.toJSON()));
  } catch (error: any) {
    res.status(500).json({ detail: error.message });
  }
});

// GET /api/v1/products/:id
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const idParam = typeof req.params.id === 'string' ? req.params.id : '';
    let query: any;

    if (!isNaN(Number(idParam))) {
      query = { numericId: Number(idParam) };
    } else if (mongoose.Types.ObjectId.isValid(idParam)) {
      query = { _id: idParam };
    } else {
      res.status(404).json({ detail: 'Product not found' });
      return;
    }

    const product = await Product.findOne(query).populate('brand').populate('category');

    if (!product) {
      res.status(404).json({ detail: 'Product not found' });
      return;
    }

    res.json(product.toJSON());
  } catch (error: any) {
    res.status(500).json({ detail: error.message });
  }
});

// GET /api/v1/products
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 14;
    const search = req.query.search as string;
    const categoryId = typeof req.query.category_id === 'string' ? req.query.category_id : undefined;

    const filter: any = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
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
      .populate('brand')
      .populate('category')
      .limit(limit);

    res.json(products.map(p => p.toJSON()));
  } catch (error: any) {
    res.status(500).json({ detail: error.message });
  }
});

export default router;
