import { Router } from 'express';
import { getAuditLogs } from '../controllers/audit.controller';
import { authenticateToken, authorizeRole } from '../middlewares/auth.middleware';

const router = Router();

// Admin only — xem audit logs
router.get('/', authenticateToken as any, authorizeRole('admin') as any, getAuditLogs as any);

export default router;
