import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { db, User } from '../db/database.ts';

const TOKEN_SECRET = process.env.TOKEN_SECRET || 'bank_marketing_jwt_secret_token_2026';

export interface AuthRequest extends Request {
  user?: User;
}

export function createToken(user: User): string {
  const payload = {
    userId: user.id,
    username: user.username,
    role: user.role,
    exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  };
  const str = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', TOKEN_SECRET).update(str).digest('base64url');
  return `${str}.${signature}`;
}

export function verifyToken(token: string): { userId: string; username: string; role: string } | null {
  try {
    const [str, signature] = token.split('.');
    if (!str || !signature) return null;
    const expected = crypto.createHmac('sha256', TOKEN_SECRET).update(str).digest('base64url');
    if (signature !== expected) return null;
    const payload = JSON.parse(Buffer.from(str, 'base64url').toString('utf-8'));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Chưa đăng nhập (Thiếu Token xác thực).' });
  }

  const token = authHeader.replace(/^Bearer\s+/, '');
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Phiên làm việc không hợp lệ hoặc đã hết hạn.' });
  }

  const user = db.getUserById(payload.userId);
  if (!user) {
    return res.status(401).json({ error: 'Tài khoản người dùng không tồn tại.' });
  }

  if (user.status === 'locked') {
    return res.status(403).json({ error: 'Tài khoản của bạn đã bị khóa bởi Quản trị viên.' });
  }

  req.user = user;
  next();
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Quyền truy cập bị từ chối: Chức năng này chỉ dành cho Quản trị viên (Admin).',
    });
  }
  next();
}
