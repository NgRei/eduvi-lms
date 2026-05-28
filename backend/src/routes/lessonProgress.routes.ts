import { Router } from 'express';
import {
  markLessonComplete,
  updateWatchPosition,
  getLessonProgress,
  unmarkLessonComplete,
} from '../controllers/lessonProgress.controller';
import { authenticateToken, authorizeRole } from '../middlewares/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticateToken as any);

// Student routes
router.post('/complete', authorizeRole('student') as any, markLessonComplete as any);
router.put('/uncomplete', authorizeRole('student') as any, unmarkLessonComplete as any);
router.put('/position', authorizeRole('student') as any, updateWatchPosition as any);
router.get('/:courseId', authorizeRole('student') as any, getLessonProgress as any);

export default router;
