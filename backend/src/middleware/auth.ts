import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User, IUser } from '../models/User';

export interface AuthRequest extends Request {
  user?: IUser;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ detail: 'Not authenticated' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const secret = process.env.JWT_SECRET || 'tryvia_secret_jwt_key_super_secure_2026';
    const decoded: any = jwt.verify(token, secret);

    const sub = decoded.sub;
    let query: any;

    if (typeof sub === 'number' || (!isNaN(Number(sub)) && Number(sub) > 0)) {
      query = { numericId: Number(sub) };
    } else if (mongoose.Types.ObjectId.isValid(sub)) {
      query = { _id: sub };
    } else {
      query = { email: sub };
    }

    const user = await User.findOne(query);

    if (!user || !user.isActive) {
      res.status(401).json({ detail: 'User not found or inactive' });
      return;
    }

    req.user = user;
    next();
  } catch (error: any) {
    res.status(401).json({ detail: 'Invalid or expired token' });
  }
};

export const requireVendor = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ detail: 'Not authenticated' });
    return;
  }
  
  if (req.user.role !== 'VENDOR' && req.user.role !== 'ADMIN') {
    res.status(403).json({ detail: 'Access denied: Vendor privileges required' });
    return;
  }
  
  next();
};
