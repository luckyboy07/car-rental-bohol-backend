import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import db from '../models/db';

export interface AdminRequest extends Request {
  admin?: {
    id: string;
    email: string;
    name: string;
  };
}

export const authenticateAdmin = (req: AdminRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Authorization token required' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecret123') as any;
    const stmt = db.prepare('SELECT id, email, name FROM admins WHERE id = ?');
    const admin: any = stmt.get(decoded.id);

    if (!admin) {
      res.status(401).json({ message: 'Invalid token' });
      return;
    }

    req.admin = admin;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};
