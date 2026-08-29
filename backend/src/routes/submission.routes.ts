import { Router } from 'express';
import {
  getSubmissionById,
  gradeSubmission,
} from '../controllers/submission.controller';
import { authenticateToken, authorizeRole } from '../middlewares/auth.middleware';

const router = Router();

// Mounted at /api/submissions
router.get('/:id', authenticateToken as any, getSubmissionById as any);
router.put('/:id/grade', authenticateToken as any, authorizeRole('instructor', 'admin') as any, gradeSubmission as any);

export default router;
