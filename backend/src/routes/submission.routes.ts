import { Router } from 'express';
import {
  submitAssignment,
  getMySubmissions,
  getSubmissionById,
  getSubmissionsForGrading,
  gradeSubmission,
} from '../controllers/submission.controller';
import { authenticateToken, authorizeRole } from '../middlewares/auth.middleware';

const router = Router();

// Student routes
router.post('/assignments/:id/submit', authenticateToken as any, authorizeRole('student') as any, submitAssignment as any);
router.get('/assignments/:id/submissions', authenticateToken as any, getMySubmissions as any);

// Shared routes
router.get('/submissions/:id', authenticateToken as any, getSubmissionById as any);

// Instructor routes
router.get('/assignments/:id/grading', authenticateToken as any, authorizeRole('instructor', 'admin') as any, getSubmissionsForGrading as any);
router.put('/submissions/:id/grade', authenticateToken as any, authorizeRole('instructor', 'admin') as any, gradeSubmission as any);

export default router;
