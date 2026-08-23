import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

const generateToken = (numericId: number): string => {
  const secret = process.env.JWT_SECRET || 'tryvia_secret_jwt_key_super_secure_2026';
  return jwt.sign({ sub: numericId }, secret, { expiresIn: '7d' });
};

// POST /api/v1/auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const email = (req.body.username || req.body.email || '').trim().toLowerCase();
    const password = req.body.password || '';

    if (!email || !password) {
      res.status(400).json({ detail: 'Email and password are required' });
      return;
    }

    const user = await User.findOne({ email });

    if (!user) {
      res.status(400).json({ detail: 'Incorrect email or password' });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(400).json({ detail: 'Incorrect email or password' });
      return;
    }

    if (!user.isActive) {
      res.status(400).json({ detail: 'Inactive user' });
      return;
    }

    const token = generateToken(user.numericId);

    res.json({
      access_token: token,
      token_type: 'bearer',
      user: user.toJSON(),
    });
  } catch (error: any) {
    res.status(500).json({ detail: error.message });
  }
});

// POST /api/v1/auth/register
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, full_name } = req.body;

    if (!email || !password || !full_name) {
      res.status(400).json({ detail: 'Email, password, and full name are required' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      res.status(400).json({ detail: 'The user with this email already exists in the system.' });
      return;
    }

    const count = await User.countDocuments();
    const numericId = count + 1;
    const passwordHash = await bcrypt.hash(password, 10);

    const user = new User({
      numericId,
      email: normalizedEmail,
      fullName: full_name,
      passwordHash,
      walletBalance: 350,
      loyaltyTier: 'BRONZE',
      stars: 0,
    });

    await user.save();
    const token = generateToken(user.numericId);

    res.json({
      access_token: token,
      token_type: 'bearer',
      user: user.toJSON(),
    });
  } catch (error: any) {
    res.status(500).json({ detail: error.message });
  }
});

// GET /api/v1/auth/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  res.json(req.user?.toJSON());
});

export default router;
