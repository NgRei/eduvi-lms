import { Router } from 'express';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserStatus,
  deleteUser,
  getAdminDashboard,
} from '../controllers/admin.controller';
import { authenticateToken, authorizeRole } from '../middlewares/auth.middleware';

const router = Router();

// All admin routes require authentication + admin role
router.use(authenticateToken as any);
router.use(authorizeRole('admin') as any);

// Dashboard
router.get('/dashboard', getAdminDashboard as any);

// User management
router.get('/users', getUsers as any);
router.get('/users/:id', getUserById as any);
router.post('/users', createUser as any);
router.put('/users/:id', updateUser as any);
router.put('/users/:id/status', updateUserStatus as any);
router.delete('/users/:id', deleteUser as any);

export default router;
