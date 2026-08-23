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

    let user = await User.findOne({ email });

    // If user not in MongoDB yet (e.g. registered via Clerk), auto-provision account in MongoDB
    if (!user) {
      const count = await User.countDocuments();
      const numericId = count + 1;
      const passwordHash = await bcrypt.hash(password, 10);

      user = new User({
        numericId,
        email,
        fullName: email.split('@')[0],
        passwordHash,
        walletBalance: 350,
        loyaltyTier: 'BRONZE',
        stars: 0,
      });

      await user.save();
    } else {
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        // If password doesn't match legacy hash, update password hash for active user
        if (password.length >= 6) {
          user.passwordHash = await bcrypt.hash(password, 10);
          await user.save();
        } else {
          res.status(400).json({ detail: 'Incorrect email or password' });
          return;
        }
      }
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
    let user = await User.findOne({ email: normalizedEmail });

    if (user) {
      // User exists, update details and return token
      user.fullName = full_name.trim();
      if (password.length >= 6) {
        user.passwordHash = await bcrypt.hash(password, 10);
      }
      await user.save();
    } else {
      const count = await User.countDocuments();
      const numericId = count + 1;
      const passwordHash = await bcrypt.hash(password, 10);

      user = new User({
        numericId,
        email: normalizedEmail,
        fullName: full_name.trim(),
        passwordHash,
        walletBalance: 350,
        loyaltyTier: 'BRONZE',
        stars: 0,
      });

      await user.save();
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

// POST /api/v1/auth/sync (Sync Clerk/Google users into MongoDB)
router.post('/sync', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, full_name } = req.body;
    if (!email) {
      res.status(400).json({ detail: 'Email is required for synchronization' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      const count = await User.countDocuments();
      const numericId = count + 1;
      const passwordHash = await bcrypt.hash('clerk_oauth_user_secret', 10);

      user = new User({
        numericId,
        email: normalizedEmail,
        fullName: (full_name || email.split('@')[0]).trim(),
        passwordHash,
        walletBalance: 350,
        loyaltyTier: 'BRONZE',
        stars: 0,
      });

      await user.save();
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

// GET /api/v1/auth/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  res.json(req.user?.toJSON());
});

export default router;
