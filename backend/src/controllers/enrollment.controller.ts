import { Response } from 'express';
import { Op } from 'sequelize';
import { Enrollment, Course, User, Lesson, LessonProgress } from '../models';
import { AuthRequest } from '../middlewares/auth.middleware';
import { createAuditLog, getClientIp } from '../services/audit.service';

// POST /api/enrollments - Đăng ký khóa học
export const enrollCourse = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Chưa xác thực người dùng!' });
    }

    const { course_id } = req.body;

    if (!course_id) {
      return res.status(400).json({ success: false, error: 'Vui lòng cung cấp course_id!' });
    }

    // Check if course exists and is published
    const course = await Course.findOne({
      where: { id: course_id, is_published: true, deleted_at: null }
    });

    if (!course) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy khóa học hoặc khóa học chưa được xuất bản!' });
    }

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      where: { user_id: req.user.id, course_id }
    });

    if (existingEnrollment) {
      if (existingEnrollment.status === 'dropped') {
        // Re-enroll if previously dropped
        await existingEnrollment.update({
          status: 'active',
          progress_percentage: 0,
          enrolled_at: new Date(),
          expired_at: null,
        });

        return res.status(200).json({
          success: true,
          message: 'Đăng ký lại khóa học thành công!',
          data: existingEnrollment,
        });
      }

      return res.status(409).json({ success: false, error: 'Bạn đã đăng ký khóa học này rồi!' });
    }

    // Check max_students limit
    if (course.max_students) {
      const currentStudents = await Enrollment.count({
        where: { course_id, status: 'active' }
      });

      if (currentStudents >= course.max_students) {
        return res.status(400).json({ success: false, error: 'Khóa học đã đạt số lượng học viên tối đa!' });
      }
    }

    // Create enrollment
    const enrollment = await Enrollment.create({
      user_id: req.user.id,
      course_id,
      status: 'active',
      progress_percentage: 0,
      enrolled_at: new Date(),
    });

    // Update total_students count in course
    await course.update({
      total_students: (course.total_students || 0) + 1,
    });

    // Audit log — đăng ký khóa học
    createAuditLog({
      user_id: req.user.id,
      action: 'enroll',
      entity_type: 'enrollment',
      entity_id: enrollment.id,
      detail: { course_id, course_title: course.title },
      ip_address: getClientIp(req),
    });

    return res.status(201).json({
      success: true,
      message: 'Đăng ký khóa học thành công!',
      data: enrollment,
    });
  } catch (error: any) {
    console.error('enrollCourse Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra khi đăng ký khóa học!' });
  }
};

// DELETE /api/enrollments/:id - Hủy đăng ký khóa học
export const unenrollCourse = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Chưa xác thực người dùng!' });
    }

    const { id } = req.params;

    const enrollment = await Enrollment.findByPk(id);

    if (!enrollment) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy đăng ký!' });
    }

    // Check ownership
    if (enrollment.user_id !== req.user.id && req.user.user_type !== 'admin') {
      return res.status(403).json({ success: false, error: 'Bạn không có quyền hủy đăng ký này!' });
    }

    if (enrollment.status === 'dropped') {
      return res.status(400).json({ success: false, error: 'Đăng ký này đã được hủy trước đó!' });
    }

    // Soft drop - update status
    await enrollment.update({ status: 'dropped' });

    // Decrease total_students count
    const course = await Course.findByPk(enrollment.course_id);
    if (course && course.total_students > 0) {
      await course.update({
        total_students: course.total_students - 1,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Hủy đăng ký khóa học thành công!',
    });
  } catch (error: any) {
    console.error('unenrollCourse Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra khi hủy đăng ký!' });
  }
};

// GET /api/enrollments/me - Danh sách khóa học đã đăng ký
export const getMyEnrollments = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Chưa xác thực người dùng!' });
    }

    const { page = '1', limit = '12', status } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const where: any = { user_id: req.user.id };
    if (status && ['active', 'completed', 'dropped'].includes(status as string)) {
      where.status = status;
    } else {
      // Default: exclude dropped
      where.status = { [Op.ne]: 'dropped' };
    }

    const { count, rows } = await Enrollment.findAndCountAll({
      where,
      include: [
        {
          model: Course,
          as: 'course',
          attributes: ['id', 'title', 'slug', 'thumbnail', 'price', 'sale_price', 'total_lessons', 'rating_avg'],
          include: [
            {
              model: User,
              as: 'instructors',
              attributes: ['id', 'full_name', 'username'],
              through: { attributes: [] },
            },
          ],
        },
      ],
      order: [['enrolled_at', 'DESC']],
      limit: limitNum,
      offset,
      distinct: true,
    });

    return res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count,
        totalPages: Math.ceil(count / limitNum),
      },
    });
  } catch (error: any) {
    console.error('getMyEnrollments Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra khi lấy danh sách khóa học!' });
  }
};

// GET /api/enrollments/check/:courseId - Kiểm tra trạng thái đăng ký
export const checkEnrollment = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Chưa xác thực người dùng!' });
    }

    const { courseId } = req.params;

    const enrollment = await Enrollment.findOne({
      where: { user_id: req.user.id, course_id: courseId },
    });

    return res.status(200).json({
      success: true,
      data: {
        enrolled: !!enrollment && enrollment.status !== 'dropped',
        enrollment: enrollment ? {
          id: enrollment.id,
          status: enrollment.status,
          progress_percentage: enrollment.progress_percentage,
          enrolled_at: enrollment.enrolled_at,
        } : null,
      },
    });
  } catch (error: any) {
    console.error('checkEnrollment Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra khi kiểm tra đăng ký!' });
  }
};
