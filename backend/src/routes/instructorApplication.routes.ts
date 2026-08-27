import { Router } from 'express';
import {
  registerAndApply,
  submitApplication,
  getMyApplication,
  updateMyApplication,
  getAdminApplications,
  getAdminApplicationById,
  approveApplication,
  rejectApplication,
} from '../controllers/instructorApplication.controller';
import { authenticateToken, authorizeRole } from '../middlewares/auth.middleware';

const router = Router();

// Public: Register account + submit application in one go
router.post('/register-and-apply', registerAndApply as any);

// Candidate (Student) routes - requires authentication
router.post('/', authenticateToken as any, submitApplication as any);
router.get('/my-application', authenticateToken as any, getMyApplication as any);
router.put('/my-application', authenticateToken as any, updateMyApplication as any);

// Admin routes - requires admin role
router.get('/admin', authenticateToken as any, authorizeRole('admin') as any, getAdminApplications as any);
router.get('/admin/:id', authenticateToken as any, authorizeRole('admin') as any, getAdminApplicationById as any);
router.post('/admin/:id/approve', authenticateToken as any, authorizeRole('admin') as any, approveApplication as any);
router.post('/admin/:id/reject', authenticateToken as any, authorizeRole('admin') as any, rejectApplication as any);

export default router;
