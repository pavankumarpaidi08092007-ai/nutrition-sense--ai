import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { dbUsers } from '../utils/dbManager';

export interface AuthRequest extends Request {
  user?: any;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  let token: string | undefined;

  // Extract JWT token from Authorization header or HTTP-only cookies
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized. Access token is missing or not provided.'
    });
  }

  try {
    // Verify JWT token signature & expiration
    const secret = process.env.JWT_SECRET || 'super_secret_nutrisense_key_2026';
    const decoded: any = jwt.verify(token, secret);

    // Retrieve user record from database
    const user = await dbUsers.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized. User account associated with this token does not exist.'
      });
    }

    req.user = user;
    return next();
  } catch (error: any) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized. Token is invalid or has expired. Please sign in again.'
    });
  }
};

export const adminOnly = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Access denied. Administrator privileges required.'
  });
};
