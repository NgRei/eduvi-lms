import { Router } from 'express';
import { 
  getCourses, 
  getCourseById, 
  createCourse, 
  updateCourse, 
  deleteCourse,
  getInstructorCourses,
  getCategories
} from '../controllers/course.controller';
import { 
  getLessons, 
  getLessonById, 
  createLesson, 
  updateLesson, 
  deleteLesson,
  reorderLessons
} from '../controllers/lesson.controller';
import { authenticateToken, authorizeRole, optionalAuth } from '../middlewares/auth.middleware';

const router = Router();

// Public routes
router.get('/categories', getCategories as any);
router.get('/', getCourses as any);
router.get('/:id', optionalAuth as any, getCourseById as any);

// Protected routes - Instructor & Admin
router.get('/instructor/me', authenticateToken as any, authorizeRole('instructor', 'admin') as any, getInstructorCourses as any);
router.post('/', authenticateToken as any, authorizeRole('instructor', 'admin') as any, createCourse as any);
router.put('/:id', authenticateToken as any, authorizeRole('instructor', 'admin') as any, updateCourse as any);
router.delete('/:id', authenticateToken as any, authorizeRole('admin') as any, deleteCourse as any);

// Lesson routes
router.get('/:courseId/lessons', getLessons as any);
router.post('/:courseId/lessons', authenticateToken as any, authorizeRole('instructor', 'admin') as any, createLesson as any);
router.put('/:courseId/lessons/reorder', authenticateToken as any, authorizeRole('instructor', 'admin') as any, reorderLessons as any);

export default router;
