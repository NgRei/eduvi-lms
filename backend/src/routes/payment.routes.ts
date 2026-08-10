import { Router } from 'express';
import {
  createPayment,
  confirmPayment,
  getPaymentStatus,
  getMyPayments,
  getAllPaymentsAdmin,
  getInstructorTransactions,
} from '../controllers/payment.controller';
import { authenticateToken, authorizeRole } from '../middlewares/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticateToken as any);

// Student & General payment routes
router.post('/create', authorizeRole('student', 'instructor', 'admin') as any, createPayment as any);
router.post('/confirm/:id', authorizeRole('student', 'instructor', 'admin') as any, confirmPayment as any);
router.get('/status/:txn_ref', authorizeRole('student', 'instructor', 'admin') as any, getPaymentStatus as any);
router.get('/me', authorizeRole('student', 'instructor', 'admin') as any, getMyPayments as any);

// Admin route - Quản lý tất cả giao dịch toàn sàn
router.get('/admin/all', authorizeRole('admin') as any, getAllPaymentsAdmin as any);

// Instructor route - Xem giao dịch & doanh thu các khóa học do mình dạy
router.get('/instructor/my-transactions', authorizeRole('instructor', 'admin') as any, getInstructorTransactions as any);

export default router;
