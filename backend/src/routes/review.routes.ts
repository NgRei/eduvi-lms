import { Router } from 'express';
import { createReview, getCourseReviews, updateReview, deleteReview } from '../controllers/review.controller';
import { authenticateToken, authorizeRole } from '../middlewares/auth.middleware';

const router = Router();

// Public — xem đánh giá
router.get('/:courseId', getCourseReviews as any);

// Protected — học viên tạo/sửa/xóa đánh giá
router.post('/:courseId', authenticateToken as any, authorizeRole('student') as any, createReview as any);
router.put('/:reviewId', authenticateToken as any, updateReview as any);
router.delete('/:reviewId', authenticateToken as any, deleteReview as any);

export default router;
