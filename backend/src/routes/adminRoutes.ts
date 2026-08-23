import { Router, Request, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { Vendor } from '../models/Vendor';
import { Product } from '../models/Product';
import { Order } from '../models/Order';
import { getVendorBalances } from './payoutRoutes';

const router = Router();

// Middleware to check if user is admin or superuser
const requireAdmin = (req: AuthRequest, res: Response, next: any) => {
  if (req.user && (req.user.role === 'ADMIN' || req.user.isSuperuser)) {
    next();
  } else {
    res.status(403).json({ detail: 'Access denied. Admin privileges required.' });
  }
};

router.use(authenticate);
router.use(requireAdmin);

// GET /api/v1/admin/vendors
router.get('/vendors', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const vendors = await Vendor.find().populate('user', 'fullName email isActive');
    
    // We can aggregate stats per vendor here or fetch products/orders
    // For simplicity, we just return vendors. In a real app with many vendors, 
    // aggregation would be done carefully or stats cached.
    
    const formattedVendors = vendors.map(v => ({
      id: v.numericId,
      _id: v._id,
      storeName: v.storeName,
      ownerName: (v.user as any)?.fullName || 'Unknown',
      email: v.email,
      status: v.status,
      createdAt: v.createdAt
    }));
    
    res.json(formattedVendors);
  } catch (error: any) {
    res.status(500).json({ detail: error.message });
  }
});

// GET /api/v1/admin/vendors/:id
router.get('/vendors/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const vendor = await Vendor.findById(req.params.id).populate('user', 'fullName email phone');
    if (!vendor) {
      res.status(404).json({ detail: 'Vendor not found' });
      return;
    }
    
    const productsCount = await Product.countDocuments({ vendor: vendor._id });
    const activeProducts = await Product.countDocuments({ vendor: vendor._id, status: 'ACTIVE' });
    
    const products = await Product.find({ vendor: vendor._id }, '_id');
    const productIds = products.map(p => p._id);
    
    const orders = await Order.find({ 'items.product': { $in: productIds } });
    
    let totalSales = 0;
    let vendorEarnings = 0;
    let pendingFulfillment = 0;
    
    for (const order of orders) {
      const vStatus = order.vendorStatuses?.find(vs => vs.vendor.equals(vendor._id as any));
      const status = vStatus ? vStatus.status : 'PENDING';
      
      if (status === 'PENDING' || status === 'PROCESSING') {
        pendingFulfillment++;
      }
      
      for (const item of order.items) {
        if (productIds.some(id => id.equals(item.product as any))) {
          totalSales += item.totalPrice;
          vendorEarnings += (item.vendorEarnings || 0);
        }
      }
    }
    
    const balances = await getVendorBalances(vendor._id as any);
    
    res.json({
      vendor: vendor.toJSON(),
      metrics: {
        totalProducts: productsCount,
        activeProducts,
        totalOrders: orders.length,
        totalSales,
        vendorEarnings: balances.totalEarnings,
        pendingFulfillment,
        availableBalance: balances.availableBalance,
        pendingBalance: balances.pendingBalance
      }
    });
  } catch (error: any) {
    res.status(500).json({ detail: error.message });
  }
});

// PATCH /api/v1/admin/vendors/:id/status
router.patch('/vendors/:id/status', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, reason } = req.body;
    
    if (!['PENDING', 'APPROVED', 'SUSPENDED', 'REJECTED'].includes(status)) {
      res.status(400).json({ detail: 'Invalid status' });
      return;
    }
    
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) {
      res.status(404).json({ detail: 'Vendor not found' });
      return;
    }
    
    const oldStatus = vendor.status;
    vendor.status = status;
    vendor.statusHistory.push({
      status: status,
      changedBy: req.user?._id,
      reason: reason || `Status changed from ${oldStatus} to ${status}`,
      changedAt: new Date()
    });
    
    await vendor.save();
    
    res.json({ detail: 'Vendor status updated', status: vendor.status });
  } catch (error: any) {
    res.status(500).json({ detail: error.message });
  }
});

export default router;
