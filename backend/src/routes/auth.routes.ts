import { Router } from 'express';
import { register, login, getMe, changePassword, forgotPassword, resetPassword, refreshToken, logout } from '../controllers/auth.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/me', authenticateToken as any, getMe as any);
router.put('/change-password', authenticateToken as any, changePassword as any);

export default router;
