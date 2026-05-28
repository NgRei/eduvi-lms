import { Response } from 'express';
import { Lesson, Course, CourseMaterial, CourseInstructor } from '../models';
import { AuthRequest } from '../middlewares/auth.middleware';

// GET /api/courses/:courseId/lessons - Lấy danh sách bài giảng của khóa học
export const getLessons = async (req: AuthRequest, res: Response) => {
  try {
    const { courseId } = req.params;

    // Check if course exists
    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy khóa học!' });
    }

    const lessons = await Lesson.findAll({
      where: { course_id: courseId, is_published: true },
      order: [['sort_order', 'ASC']],
      attributes: ['id', 'title', 'sort_order', 'lesson_type', 'content_url', 'duration_minutes', 'is_preview'],
      include: [
        {
          model: CourseMaterial,
          as: 'materials',
          attributes: ['id', 'title', 'material_type', 'file_url', 'file_size_kb', 'is_downloadable']
        }
      ]
    });

    return res.status(200).json({
      success: true,
      data: lessons
    });
  } catch (error: any) {
    console.error('getLessons Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra khi lấy danh sách bài giảng!' });
  }
};

// GET /api/lessons/:id - Lấy chi tiết bài giảng
export const getLessonById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const lesson = await Lesson.findByPk(id, {
      include: [
        {
          model: Course,
          as: 'course',
          attributes: ['id', 'title', 'slug']
        },
        {
          model: CourseMaterial,
          as: 'materials',
          attributes: ['id', 'title', 'material_type', 'file_url', 'file_size_kb', 'is_downloadable']
        }
      ]
    });

    if (!lesson) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy bài giảng!' });
    }

    return res.status(200).json({
      success: true,
      data: lesson
    });
  } catch (error: any) {
    console.error('getLessonById Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra khi lấy thông tin bài giảng!' });
  }
};

// POST /api/courses/:courseId/lessons - Tạo bài giảng mới (instructor)
export const createLesson = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Chưa xác thực người dùng!' });
    }

    const { courseId } = req.params;
    const {
      title,
      sort_order,
      lesson_type,
      content_url,
      content_text,
      duration_minutes,
      is_preview
    } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, error: 'Vui lòng nhập tên bài giảng!' });
    }

    // Check if course exists
    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy khóa học!' });
    }

    // Check permission: instructor assigned to this course or admin
    if (req.user.user_type !== 'admin') {
      const isInstructor = await CourseInstructor.findOne({
        where: { course_id: courseId, instructor_id: req.user.id }
      });
      if (!isInstructor) {
        return res.status(403).json({ success: false, error: 'Bạn không có quyền thêm bài giảng vào khóa học này!' });
      }
    }

    // Get max sort_order if not provided
    let order = sort_order;
    if (order === undefined) {
      const maxOrder = await Lesson.max('sort_order', { where: { course_id: courseId } });
      order = (maxOrder as number || 0) + 1;
    }

    const lesson = await Lesson.create({
      course_id: courseId,
      title,
      sort_order: order,
      lesson_type: lesson_type || 'video',
      content_url: content_url || null,
      content_text: content_text || null,
      duration_minutes: duration_minutes || null,
      is_preview: is_preview || false,
      is_published: true
    });

    // Update course total_lessons
    await course.update({ 
      total_lessons: await Lesson.count({ where: { course_id: courseId, is_published: true } })
    });

    return res.status(201).json({
      success: true,
      message: 'Tạo bài giảng thành công!',
      data: lesson
    });
  } catch (error: any) {
    console.error('createLesson Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra khi tạo bài giảng!' });
  }
};

// PUT /api/lessons/:id - Cập nhật bài giảng (instructor)
export const updateLesson = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Chưa xác thực người dùng!' });
    }

    const { id } = req.params;
    const lesson = await Lesson.findByPk(id);

    if (!lesson) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy bài giảng!' });
    }

    // Check permission
    if (req.user.user_type !== 'admin') {
      const isInstructor = await CourseInstructor.findOne({
        where: { course_id: lesson.course_id, instructor_id: req.user.id }
      });
      if (!isInstructor) {
        return res.status(403).json({ success: false, error: 'Bạn không có quyền chỉnh sửa bài giảng này!' });
      }
    }

    const {
      title,
      sort_order,
      lesson_type,
      content_url,
      content_text,
      duration_minutes,
      is_preview,
      is_published
    } = req.body;

    await lesson.update({
      title: title || lesson.title,
      sort_order: sort_order !== undefined ? sort_order : lesson.sort_order,
      lesson_type: lesson_type || lesson.lesson_type,
      content_url: content_url !== undefined ? content_url : lesson.content_url,
      content_text: content_text !== undefined ? content_text : lesson.content_text,
      duration_minutes: duration_minutes !== undefined ? duration_minutes : lesson.duration_minutes,
      is_preview: is_preview !== undefined ? is_preview : lesson.is_preview,
      is_published: is_published !== undefined ? is_published : lesson.is_published
    });

    // Update course total_lessons
    const course = await Course.findByPk(lesson.course_id);
    if (course) {
      await course.update({ 
        total_lessons: await Lesson.count({ where: { course_id: lesson.course_id, is_published: true } })
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Cập nhật bài giảng thành công!',
      data: lesson
    });
  } catch (error: any) {
    console.error('updateLesson Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra khi cập nhật bài giảng!' });
  }
};

// DELETE /api/lessons/:id - Xóa bài giảng (instructor)
export const deleteLesson = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Chưa xác thực người dùng!' });
    }

    const { id } = req.params;
    const lesson = await Lesson.findByPk(id);

    if (!lesson) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy bài giảng!' });
    }

    // Check permission
    if (req.user.user_type !== 'admin') {
      const isInstructor = await CourseInstructor.findOne({
        where: { course_id: lesson.course_id, instructor_id: req.user.id }
      });
      if (!isInstructor) {
        return res.status(403).json({ success: false, error: 'Bạn không có quyền xóa bài giảng này!' });
      }
    }

    const courseId = lesson.course_id;

    // Soft delete
    await lesson.destroy();

    // Update course total_lessons
    const course = await Course.findByPk(courseId);
    if (course) {
      await course.update({ 
        total_lessons: await Lesson.count({ where: { course_id: courseId, is_published: true } })
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Xóa bài giảng thành công!'
    });
  } catch (error: any) {
    console.error('deleteLesson Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra khi xóa bài giảng!' });
  }
};

// PUT /api/courses/:courseId/lessons/reorder - Sắp xếp lại thứ tự bài giảng
export const reorderLessons = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Chưa xác thực người dùng!' });
    }

    const { courseId } = req.params;
    const { lessonIds } = req.body; // Array of lesson IDs in new order

    if (!Array.isArray(lessonIds)) {
      return res.status(400).json({ success: false, error: 'Dữ liệu không hợp lệ!' });
    }

    // Check permission
    if (req.user.user_type !== 'admin') {
      const isInstructor = await CourseInstructor.findOne({
        where: { course_id: courseId, instructor_id: req.user.id }
      });
      if (!isInstructor) {
        return res.status(403).json({ success: false, error: 'Bạn không có quyền sắp xếp bài giảng!' });
      }
    }

    // Update sort_order for each lesson
    for (let i = 0; i < lessonIds.length; i++) {
      await Lesson.update(
        { sort_order: i + 1 },
        { where: { id: lessonIds[i], course_id: courseId } }
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Sắp xếp bài giảng thành công!'
    });
  } catch (error: any) {
    console.error('reorderLessons Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra khi sắp xếp bài giảng!' });
  }
};
