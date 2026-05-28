import { Router } from 'express';
import {
  enrollCourse,
  unenrollCourse,
  getMyEnrollments,
  checkEnrollment,
} from '../controllers/enrollment.controller';
import { authenticateToken, authorizeRole } from '../middlewares/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticateToken as any);

// Student routes
router.post('/', authorizeRole('student') as any, enrollCourse as any);
router.delete('/:id', authorizeRole('student', 'admin') as any, unenrollCourse as any);
router.get('/me', authorizeRole('student') as any, getMyEnrollments as any);
router.get('/check/:courseId', authorizeRole('student') as any, checkEnrollment as any);

export default router;
