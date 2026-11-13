import { Router, Response } from 'express';
import { db } from '../db/database.ts';
import { AuthRequest, authMiddleware, requireAdmin } from '../middleware/auth.ts';

export const auditRouter = Router();

auditRouter.use(authMiddleware);
auditRouter.use(requireAdmin);

auditRouter.get('/', (req: AuthRequest, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
  const logs = db.getAuditLogs(limit);
  res.json({ logs });
});

auditRouter.get('/export/csv', (req: AuthRequest, res: Response) => {
  const logs = db.getAuditLogs(1000);
  const headers = ['id', 'userId', 'userName', 'action', 'entity', 'entityId', 'ipAddress', 'details', 'createdAt'];

  let csvContent = headers.join(',') + '\n';
  for (const l of logs) {
    const row = [
      l.id,
      l.userId,
      `"${l.userName}"`,
      l.action,
      l.entity,
      l.entityId || '',
      l.ipAddress,
      `"${(l.details || '').replace(/"/g, '""')}"`,
      l.createdAt,
    ];
    csvContent += row.join(',') + '\n';
  }

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename=audit_logs.csv');
  res.send(csvContent);
});

export const settingsRouter = Router();

settingsRouter.use(authMiddleware);

settingsRouter.get('/', (req: AuthRequest, res: Response) => {
  const settings = db.getSettings();
  res.json({ settings });
});

settingsRouter.put('/', requireAdmin, (req: AuthRequest, res: Response) => {
  const { thresholdHigh, thresholdMedium, thresholdLow, sessionTimeoutMinutes, bankName } = req.body;
  const updates: any = {};

  if (typeof thresholdHigh === 'number') updates.thresholdHigh = thresholdHigh;
  if (typeof thresholdMedium === 'number') updates.thresholdMedium = thresholdMedium;
  if (typeof thresholdLow === 'number') updates.thresholdLow = thresholdLow;
  if (typeof sessionTimeoutMinutes === 'number') updates.sessionTimeoutMinutes = sessionTimeoutMinutes;
  if (bankName) updates.bankName = bankName;

  const updated = db.updateSettings(updates);
  db.logAction(
    req.user!.id,
    req.user!.fullName,
    'SETTINGS_UPDATED',
    'SETTINGS',
    'SYS_CONFIG',
    req.ip || '127.0.0.1',
    'Cập nhật cấu hình ngưỡng diễn giải và thời gian phiên làm việc.'
  );

  res.json({ settings: updated, message: 'Cập nhật cấu hình hệ thống thành công.' });
});
