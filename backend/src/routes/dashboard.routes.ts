import { Router } from 'express';
import { getStudentDashboard, getInstructorDashboard } from '../controllers/dashboard.controller';
import { authenticateToken, authorizeRole } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken as any);

router.get('/student', authorizeRole('student') as any, getStudentDashboard as any);
router.get('/instructor', authorizeRole('instructor') as any, getInstructorDashboard as any);

export default router;
