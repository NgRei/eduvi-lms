import { Router } from 'express';
import { 
  getLessonById, 
  updateLesson, 
  deleteLesson,
  addLessonMaterial,
  deleteLessonMaterial
} from '../controllers/lesson.controller';
import { authenticateToken, authorizeRole } from '../middlewares/auth.middleware';

const router = Router();

// Public routes
router.get('/:id', getLessonById as any);

// Protected routes - Instructor & Admin
router.put('/:id', authenticateToken as any, authorizeRole('instructor', 'admin') as any, updateLesson as any);
router.delete('/:id', authenticateToken as any, authorizeRole('instructor', 'admin') as any, deleteLesson as any);

// Material routes
router.post('/:lessonId/materials', authenticateToken as any, authorizeRole('instructor', 'admin') as any, addLessonMaterial as any);
router.delete('/:lessonId/materials/:materialId', authenticateToken as any, authorizeRole('instructor', 'admin') as any, deleteLessonMaterial as any);

export default router;
