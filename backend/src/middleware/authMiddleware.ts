import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { dbUsers } from '../utils/dbManager';

export interface AuthRequest extends Request {
  user?: any;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Extract token
      token = req.headers.authorization.split(' ')[1];

      // Support guest, google, and mock tokens
      if (token === 'guest_token' || token.startsWith('guest_') || token.startsWith('google_') || token.startsWith('mock_')) {
        const guestUser = await dbUsers.findOne({ email: 'guest@nutrisense.com' });
        req.user = guestUser || {
          _id: 'guest',
          name: 'Guest User',
          email: 'guest@nutrisense.com',
          role: 'user',
          age: 30,
          gender: 'Other',
          height: 170,
          weight: 70,
          activityLevel: 'Moderately Active',
          goal: 'Maintain Weight',
          medicalConditions: [],
          allergies: [],
          foodPreference: 'Veg',
          cuisinePreference: 'All',
          dailyWaterGoal: 2500,
          sleepHours: 7,
          favorites: [],
          notificationSettings: {
            breakfast: true, lunch: true, dinner: true, water: true, exercise: true, sleep: true
          }
        };
        return next();
      }

      // Verify token
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_nutrisense_key_2026');

      // Get user from database (using manager)
      const user = await dbUsers.findById(decoded.id);

      if (!user) {
        return res.status(401).json({ success: false, message: 'User not found' });
      }

      req.user = user;
      return next();
    } catch (error) {
      return res.status(401).json({ success: false, message: 'Not authorized, token invalid or expired' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }
};

export const adminOnly = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Access denied. Administrator privileges required.' });
  }
};
