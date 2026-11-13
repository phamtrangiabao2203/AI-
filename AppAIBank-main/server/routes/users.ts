import { Router, Response } from 'express';
import { db, hashPassword } from '../db/database.ts';
import { AuthRequest, authMiddleware, requireAdmin } from '../middleware/auth.ts';

export const usersRouter = Router();

usersRouter.use(authMiddleware);
usersRouter.use(requireAdmin);

usersRouter.get('/', (req: AuthRequest, res: Response) => {
  const users = db.getUsers();
  res.json({ users });
});

usersRouter.post('/', (req: AuthRequest, res: Response) => {
  const { fullName, username, email, password, role } = req.body;

  if (!fullName || !username || !email || !password || !role) {
    return res.status(400).json({ error: 'Vui lòng điền đầy đủ các thông tin bắt buộc.' });
  }

  const existing = db.getUserByUsername(username);
  if (existing) {
    return res.status(400).json({ error: 'Tên đăng nhập hoặc email này đã tồn tại trong hệ thống.' });
  }

  const newUser = db.createUser({
    fullName,
    username,
    email,
    passwordHash: hashPassword(password),
    role: role === 'admin' ? 'admin' : 'staff',
    status: 'active',
  });

  db.logAction(
    req.user!.id,
    req.user!.fullName,
    'USER_CREATED',
    'USER',
    newUser.id,
    req.ip || '127.0.0.1',
    `Tạo tài khoản mới: ${newUser.username} (${newUser.role.toUpperCase()})`
  );

  const { passwordHash, ...safeUser } = newUser;
  res.status(201).json({ user: safeUser, message: 'Tạo tài khoản thành công.' });
});

usersRouter.put('/:id', (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { fullName, email, role, status, password } = req.body;

  const user = db.getUserById(id);
  if (!user) {
    return res.status(404).json({ error: 'Không tìm thấy tài khoản người dùng.' });
  }

  const updates: any = {};
  if (fullName) updates.fullName = fullName;
  if (email) updates.email = email;
  if (role) updates.role = role;
  if (status) updates.status = status;
  if (password) updates.passwordHash = hashPassword(password);

  const updated = db.updateUser(id, updates);
  db.logAction(
    req.user!.id,
    req.user!.fullName,
    'USER_UPDATED',
    'USER',
    id,
    req.ip || '127.0.0.1',
    `Cập nhật tài khoản ${user.username}`
  );

  const { passwordHash, ...safeUser } = updated!;
  res.json({ user: safeUser, message: 'Cập nhật tài khoản thành công.' });
});

usersRouter.post('/:id/toggle-status', (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const user = db.getUserById(id);
  if (!user) {
    return res.status(404).json({ error: 'Không tìm thấy tài khoản.' });
  }

  if (user.id === req.user!.id) {
    return res.status(400).json({ error: 'Không thể tự khóa tài khoản của chính mình.' });
  }

  const newStatus = user.status === 'active' ? 'locked' : 'active';
  const updated = db.updateUser(id, { status: newStatus });

  db.logAction(
    req.user!.id,
    req.user!.fullName,
    newStatus === 'locked' ? 'USER_LOCKED' : 'USER_UNLOCKED',
    'USER',
    id,
    req.ip || '127.0.0.1',
    `${newStatus === 'locked' ? 'Khóa' : 'Mở khóa'} tài khoản ${user.username}`
  );

  const { passwordHash, ...safeUser } = updated!;
  res.json({
    user: safeUser,
    message: `Đã ${newStatus === 'locked' ? 'khóa' : 'mở khóa'} tài khoản ${user.username}.`,
  });
});

usersRouter.delete('/:id', (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  if (id === req.user!.id) {
    return res.status(400).json({ error: 'Không thể xóa tài khoản của chính mình đang đăng nhập.' });
  }

  const user = db.getUserById(id);
  if (!user) {
    return res.status(404).json({ error: 'Không tìm thấy người dùng.' });
  }

  db.deleteUser(id);
  db.logAction(
    req.user!.id,
    req.user!.fullName,
    'USER_DELETED',
    'USER',
    id,
    req.ip || '127.0.0.1',
    `Xóa tài khoản người dùng ${user.username}`
  );

  res.json({ message: 'Xóa tài khoản thành công.' });
});
