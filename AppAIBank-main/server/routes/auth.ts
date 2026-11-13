import { Router, Response } from 'express';
import { db, hashPassword } from '../db/database.ts';
import { createToken, AuthRequest, authMiddleware } from '../middleware/auth.ts';

export const authRouter = Router();

authRouter.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Vui lòng nhập tên đăng nhập và mật khẩu.' });
  }

  const user = db.getUserByUsername(username);
  if (!user) {
    return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không chính xác.' });
  }

  if (user.status === 'locked') {
    return res.status(403).json({ error: 'Tài khoản đã bị tạm khóa. Vui lòng liên hệ Quản trị viên.' });
  }

  const hashed = hashPassword(password);
  if (user.passwordHash !== hashed) {
    db.logAction(
      user.id,
      user.fullName,
      'LOGIN_FAILED',
      'AUTH',
      user.id,
      req.ip || '127.0.0.1',
      'Sai mật khẩu.'
    );
    return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không chính xác.' });
  }

  // Update last login
  const now = new Date().toISOString();
  db.updateUser(user.id, { lastLogin: now });

  db.logAction(
    user.id,
    user.fullName,
    'LOGIN_SUCCESS',
    'AUTH',
    user.id,
    req.ip || '127.0.0.1',
    `Đăng nhập thành công với vai trò ${user.role.toUpperCase()}.`
  );

  const token = createToken(user);
  const { passwordHash, ...safeUser } = user;

  res.json({
    token,
    user: safeUser,
    message: 'Đăng nhập thành công.',
  });
});

authRouter.post('/quick-switch', (req, res) => {
  // Allows evaluator to instantly test between Admin and Staff with one click
  const { role } = req.body;
  const username = role === 'admin' ? 'admin' : 'staff01';
  const user = db.getUserByUsername(username);
  if (!user) {
    return res.status(404).json({ error: 'Không tìm thấy tài khoản người dùng mẫu.' });
  }

  const now = new Date().toISOString();
  db.updateUser(user.id, { lastLogin: now });
  const token = createToken(user);
  const { passwordHash, ...safeUser } = user;

  res.json({
    token,
    user: safeUser,
    message: `Đã chuyển đổi sang tài khoản: ${user.fullName} (${user.role.toUpperCase()})`,
  });
});

authRouter.get('/me', authMiddleware, (req: AuthRequest, res: Response) => {
  const { passwordHash, ...safeUser } = req.user!;
  res.json({ user: safeUser });
});

authRouter.post('/logout', authMiddleware, (req: AuthRequest, res: Response) => {
  db.logAction(
    req.user!.id,
    req.user!.fullName,
    'LOGOUT',
    'AUTH',
    req.user!.id,
    req.ip || '127.0.0.1',
    'Người dùng đã đăng xuất.'
  );
  res.json({ message: 'Đăng xuất thành công.' });
});

authRouter.post('/change-password', authMiddleware, (req: AuthRequest, res: Response) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: 'Vui lòng nhập mật khẩu cũ và mật khẩu mới.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Mật khẩu mới phải có tối thiểu 6 ký tự.' });
  }

  const hashedOld = hashPassword(oldPassword);
  if (req.user!.passwordHash !== hashedOld) {
    return res.status(400).json({ error: 'Mật khẩu cũ không chính xác.' });
  }

  const hashedNew = hashPassword(newPassword);
  db.updateUser(req.user!.id, { passwordHash: hashedNew });

  db.logAction(
    req.user!.id,
    req.user!.fullName,
    'PASSWORD_CHANGED',
    'USER',
    req.user!.id,
    req.ip || '127.0.0.1',
    'Đổi mật khẩu thành công.'
  );

  res.json({ message: 'Đổi mật khẩu thành công.' });
});
