import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { CourseReview, Course, Enrollment, User } from '../models';
import { fn, col } from 'sequelize';

// Helper: Cập nhật rating_avg cho khóa học
const updateCourseRating = async (courseId: string) => {
  const result = await CourseReview.findOne({
    where: { course_id: courseId, is_visible: true },
    attributes: [[fn('AVG', col('rating')), 'avgRating']],
    raw: true,
  }) as any;

  const avgRating = result?.avgRating ? parseFloat(parseFloat(result.avgRating).toFixed(2)) : 0;
  await Course.update({ rating_avg: avgRating }, { where: { id: courseId } });
};

// POST /api/reviews/:courseId — Tạo đánh giá
export const createReview = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Chưa xác thực người dùng!' });
    }

    const { courseId } = req.params;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, error: 'Đánh giá phải từ 1 đến 5 sao!' });
    }

    // Kiểm tra đã đăng ký khóa học
    const enrollment = await Enrollment.findOne({
      where: { user_id: req.user.id, course_id: courseId }
    });

    if (!enrollment) {
      return res.status(403).json({ success: false, error: 'Bạn phải đăng ký khóa học trước khi đánh giá!' });
    }

    // Kiểm tra đã đánh giá chưa
    const existing = await CourseReview.findOne({
      where: { user_id: req.user.id, course_id: courseId }
    });

    if (existing) {
      return res.status(400).json({ success: false, error: 'Bạn đã đánh giá khóa học này rồi. Vui lòng chỉnh sửa đánh giá cũ.' });
    }

    const review = await CourseReview.create({
      course_id: courseId,
      user_id: req.user.id,
      rating: Number(rating),
      comment: comment || null,
    });

    // Cập nhật rating_avg
    await updateCourseRating(courseId);

    return res.status(201).json({ success: true, data: review });
  } catch (error: any) {
    console.error('createReview Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra khi tạo đánh giá!' });
  }
};

// GET /api/reviews/:courseId — Lấy đánh giá của khóa học
export const getCourseReviews = async (req: AuthRequest, res: Response) => {
  try {
    const { courseId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await CourseReview.findAndCountAll({
      where: { course_id: courseId, is_visible: true },
      include: [
        { model: User, as: 'user', attributes: ['id', 'full_name', 'avatar_url'] },
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    return res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error: any) {
    console.error('getCourseReviews Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra khi lấy đánh giá!' });
  }
};

// PUT /api/reviews/:reviewId — Chỉnh sửa đánh giá
export const updateReview = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Chưa xác thực người dùng!' });
    }

    const { reviewId } = req.params;
    const { rating, comment } = req.body;

    const review = await CourseReview.findByPk(reviewId);
    if (!review) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy đánh giá!' });
    }

    if (review.user_id !== req.user.id && req.user.user_type !== 'admin') {
      return res.status(403).json({ success: false, error: 'Bạn không có quyền chỉnh sửa đánh giá này!' });
    }

    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ success: false, error: 'Đánh giá phải từ 1 đến 5 sao!' });
      }
      review.rating = Number(rating);
    }

    if (comment !== undefined) {
      review.comment = comment;
    }

    await review.save();

    // Cập nhật rating_avg
    await updateCourseRating(review.course_id);

    return res.status(200).json({ success: true, data: review });
  } catch (error: any) {
    console.error('updateReview Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra khi chỉnh sửa đánh giá!' });
  }
};

// DELETE /api/reviews/:reviewId — Xóa đánh giá
export const deleteReview = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Chưa xác thực người dùng!' });
    }

    const { reviewId } = req.params;

    const review = await CourseReview.findByPk(reviewId);
    if (!review) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy đánh giá!' });
    }

    if (review.user_id !== req.user.id && req.user.user_type !== 'admin') {
      return res.status(403).json({ success: false, error: 'Bạn không có quyền xóa đánh giá này!' });
    }

    const courseId = review.course_id;
    await review.destroy();

    // Cập nhật rating_avg
    await updateCourseRating(courseId);

    return res.status(200).json({ success: true, message: 'Đã xóa đánh giá thành công!' });
  } catch (error: any) {
    console.error('deleteReview Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra khi xóa đánh giá!' });
  }
};
