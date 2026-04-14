import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../models/db';

export const loginAdmin = (req: Request, res: Response): void => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ message: 'Email and password are required' });
    return;
  }

  const stmt = db.prepare('SELECT * FROM admins WHERE email = ?');
  const admin: any = stmt.get(email);

  if (!admin) {
    res.status(401).json({ message: 'Invalid credentials' });
    return;
  }

  const isPasswordValid = bcrypt.compareSync(password, admin.password_hash);
  if (!isPasswordValid) {
    res.status(401).json({ message: 'Invalid credentials' });
    return;
  }

  const token = jwt.sign(
    { id: admin.id, email: admin.email, name: admin.name },
    process.env.JWT_SECRET || 'supersecret123',
    { expiresIn: '8h' }
  );

  res.json({
    token,
    admin: {
      id: admin.id,
      email: admin.email,
      name: admin.name
    }
  });
};
