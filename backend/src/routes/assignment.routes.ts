import { Router } from 'express';
import {
  createAssignment,
  getAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
  togglePublish,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  reorderQuestions,
} from '../controllers/assignment.controller';
import {
  submitAssignment,
  getMySubmissions,
  getSubmissionsForGrading,
} from '../controllers/submission.controller';
import { authenticateToken, authorizeRole } from '../middlewares/auth.middleware';

const router = Router();

// Public routes (students can view published assignments)
router.get('/', authenticateToken as any, getAssignments as any);
router.get('/:id', authenticateToken as any, getAssignmentById as any);

// Submission & Grading routes
router.post('/:id/submit', authenticateToken as any, authorizeRole('student') as any, submitAssignment as any);
router.get('/:id/submissions', authenticateToken as any, getMySubmissions as any);
router.get('/:id/grading', authenticateToken as any, authorizeRole('instructor', 'admin') as any, getSubmissionsForGrading as any);

// Protected routes - Instructor & Admin
router.post('/', authenticateToken as any, authorizeRole('instructor', 'admin') as any, createAssignment as any);
router.put('/:id', authenticateToken as any, authorizeRole('instructor', 'admin') as any, updateAssignment as any);
router.delete('/:id', authenticateToken as any, authorizeRole('instructor', 'admin') as any, deleteAssignment as any);
router.patch('/:id/publish', authenticateToken as any, authorizeRole('instructor', 'admin') as any, togglePublish as any);

// Question management
router.post('/:id/questions', authenticateToken as any, authorizeRole('instructor', 'admin') as any, addQuestion as any);
router.put('/questions/:id', authenticateToken as any, authorizeRole('instructor', 'admin') as any, updateQuestion as any);
router.delete('/questions/:id', authenticateToken as any, authorizeRole('instructor', 'admin') as any, deleteQuestion as any);
router.put('/:id/questions/reorder', authenticateToken as any, authorizeRole('instructor', 'admin') as any, reorderQuestions as any);

export default router;
