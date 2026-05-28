import { Response } from 'express';
import { LessonProgress, Lesson, Enrollment } from '../models';
import { AuthRequest } from '../middlewares/auth.middleware';

// POST /api/lesson-progress/complete - Đánh dấu hoàn thành bài học
export const markLessonComplete = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Chưa xác thực người dùng!' });
    }

    const { lesson_id, course_id } = req.body;

    if (!lesson_id || !course_id) {
      return res.status(400).json({ success: false, error: 'Vui lòng cung cấp lesson_id và course_id!' });
    }

    // Check if lesson exists
    const lesson = await Lesson.findOne({
      where: { id: lesson_id, course_id, is_published: true }
    });

    if (!lesson) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy bài học!' });
    }

    // Check if enrolled
    const enrollment = await Enrollment.findOne({
      where: { user_id: req.user.id, course_id, status: 'active' }
    });

    if (!enrollment) {
      return res.status(403).json({ success: false, error: 'Bạn chưa đăng ký khóa học này!' });
    }

    // Find or create lesson progress
    const [progress, created] = await LessonProgress.findOrCreate({
      where: { user_id: req.user.id, lesson_id },
      defaults: {
        user_id: req.user.id,
        lesson_id,
        course_id,
        is_completed: true,
        completed_at: new Date(),
      },
    });

    if (!created && !progress.is_completed) {
      await progress.update({
        is_completed: true,
        completed_at: new Date(),
      });
    }

    // Update enrollment progress percentage
    await updateEnrollmentProgress(req.user.id, course_id);

    return res.status(200).json({
      success: true,
      message: 'Đánh dấu hoàn thành bài học thành công!',
      data: progress,
    });
  } catch (error: any) {
    console.error('markLessonComplete Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra!' });
  }
};

// PUT /api/lesson-progress/position - Lưu vị trí xem video
export const updateWatchPosition = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Chưa xác thực người dùng!' });
    }

    const { lesson_id, course_id, last_position, watch_duration } = req.body;

    if (!lesson_id || !course_id) {
      return res.status(400).json({ success: false, error: 'Vui lòng cung cấp lesson_id và course_id!' });
    }

    // Check if lesson exists
    const lesson = await Lesson.findOne({
      where: { id: lesson_id, course_id, is_published: true }
    });

    if (!lesson) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy bài học!' });
    }

    // Find or create lesson progress
    const [progress, created] = await LessonProgress.findOrCreate({
      where: { user_id: req.user.id, lesson_id },
      defaults: {
        user_id: req.user.id,
        lesson_id,
        course_id,
        last_position: last_position || 0,
        watch_duration: watch_duration || 0,
      },
    });

    if (!created) {
      await progress.update({
        last_position: last_position !== undefined ? last_position : progress.last_position,
        watch_duration: watch_duration !== undefined ? watch_duration : progress.watch_duration,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Cập nhật vị trí xem thành công!',
      data: progress,
    });
  } catch (error: any) {
    console.error('updateWatchPosition Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra!' });
  }
};

// GET /api/lesson-progress/:courseId - Lấy tiến độ bài học trong khóa
export const getLessonProgress = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Chưa xác thực người dùng!' });
    }

    const { courseId } = req.params;

    // Get all progress for this course
    const progressList = await LessonProgress.findAll({
      where: { user_id: req.user.id, course_id: courseId },
      attributes: ['lesson_id', 'is_completed', 'watch_duration', 'last_position', 'completed_at'],
    });

    // Convert to map for easy lookup
    const progressMap: Record<string, any> = {};
    progressList.forEach((p) => {
      progressMap[p.lesson_id] = {
        is_completed: p.is_completed,
        watch_duration: p.watch_duration,
        last_position: p.last_position,
        completed_at: p.completed_at,
      };
    });

    return res.status(200).json({
      success: true,
      data: progressMap,
    });
  } catch (error: any) {
    console.error('getLessonProgress Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra!' });
  }
};

// PUT /api/lesson-progress/uncomplete - Bỏ đánh dấu hoàn thành
export const unmarkLessonComplete = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Chưa xác thực người dùng!' });
    }

    const { lesson_id, course_id } = req.body;

    if (!lesson_id || !course_id) {
      return res.status(400).json({ success: false, error: 'Vui lòng cung cấp lesson_id và course_id!' });
    }

    const progress = await LessonProgress.findOne({
      where: { user_id: req.user.id, lesson_id, course_id }
    });

    if (!progress) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy tiến độ bài học!' });
    }

    await progress.update({
      is_completed: false,
      completed_at: null,
    });

    // Update enrollment progress percentage
    await updateEnrollmentProgress(req.user.id, course_id);

    return res.status(200).json({
      success: true,
      message: 'Bỏ đánh dấu hoàn thành thành công!',
      data: progress,
    });
  } catch (error: any) {
    console.error('unmarkLessonComplete Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra!' });
  }
};

// Helper: Update enrollment progress percentage
async function updateEnrollmentProgress(userId: string, courseId: string) {
  try {
    // Count total lessons in course
    const totalLessons = await Lesson.count({
      where: { course_id: courseId, is_published: true }
    });

    if (totalLessons === 0) return;

    // Count completed lessons
    const completedLessons = await LessonProgress.count({
      where: { user_id: userId, course_id: courseId, is_completed: true }
    });

    // Calculate percentage
    const progressPercentage = Math.round((completedLessons / totalLessons) * 100);

    // Update enrollment
    const enrollment = await Enrollment.findOne({
      where: { user_id: userId, course_id: courseId }
    });

    if (enrollment) {
      const updateData: any = { progress_percentage: progressPercentage };

      // Mark as completed if 100%
      if (progressPercentage === 100 && enrollment.status !== 'completed') {
        updateData.status = 'completed';
        updateData.completed_at = new Date();
      }

      await enrollment.update(updateData);
    }
  } catch (error) {
    console.error('updateEnrollmentProgress Error:', error);
  }
}
