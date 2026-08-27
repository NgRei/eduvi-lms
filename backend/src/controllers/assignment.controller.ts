import { Response } from 'express';
import { Op } from 'sequelize';
import { Assignment, QuizQuestion, Course, Lesson, CourseInstructor, Submission } from '../models';
import { AuthRequest } from '../middlewares/auth.middleware';

// Helper: Check if user is instructor of the course
const isInstructorOfCourse = async (userId: string, courseId: string): Promise<boolean> => {
  const courseInstructor = await CourseInstructor.findOne({
    where: { instructor_id: userId, course_id: courseId },
  });
  return !!courseInstructor;
};

// POST /api/assignments - Tạo assignment mới
export const createAssignment = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Chưa xác thực người dùng!' });
    }

    const { lesson_id, title, description, assignment_type, total_points, passing_score, time_limit_minutes, attempts_allowed, show_answer_after, due_date } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, error: 'Vui lòng cung cấp tiêu đề bài tập!' });
    }

    // Get course_id from lesson if lesson_id provided
    let course_id = req.body.course_id;
    if (lesson_id) {
      const lesson = await Lesson.findByPk(lesson_id);
      if (!lesson) {
        return res.status(404).json({ success: false, error: 'Không tìm thấy bài học!' });
      }
      course_id = lesson.course_id;
    }

    if (!course_id) {
      return res.status(400).json({ success: false, error: 'Vui lòng cung cấp course_id hoặc lesson_id!' });
    }

    // Check authorization
    if (req.user.user_type !== 'admin') {
      const isOwner = await isInstructorOfCourse(req.user.id, course_id);
      if (!isOwner) {
        return res.status(403).json({ success: false, error: 'Bạn không có quyền tạo bài tập cho khóa học này!' });
      }
    }

    const assignment = await Assignment.create({
      course_id,
      lesson_id: lesson_id || null,
      title,
      description: description || null,
      assignment_type: assignment_type || 'quiz',
      total_points: total_points || 100,
      passing_score: passing_score || 50,
      time_limit_minutes: time_limit_minutes || null,
      attempts_allowed: attempts_allowed || 1,
      show_answer_after: show_answer_after || false,
      due_date: due_date || null,
      is_published: false,
    });

    return res.status(201).json({
      success: true,
      message: 'Tạo bài tập thành công!',
      data: assignment,
    });
  } catch (error: any) {
    console.error('createAssignment Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra khi tạo bài tập!' });
  }
};

// GET /api/assignments - Lấy danh sách assignments
export const getAssignments = async (req: AuthRequest, res: Response) => {
  try {
    const { lesson_id, course_id, type, is_published, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const where: any = {};
    if (lesson_id) where.lesson_id = lesson_id;
    if (type) where.assignment_type = type;
    if (is_published !== undefined) where.is_published = is_published === 'true';

    // Students only see published assignments
    if (req.user?.user_type === 'student') {
      where.is_published = true;
      if (course_id) where.course_id = course_id;
    } else if (req.user?.user_type === 'instructor') {
      // Instructors only see assignments belonging to courses they instruct
      const myCourseInstructors = await CourseInstructor.findAll({
        where: { instructor_id: req.user.id },
        attributes: ['course_id'],
      });
      const myCourseIds = myCourseInstructors.map((ci) => ci.course_id);

      if (course_id) {
        if (!myCourseIds.includes(course_id as string)) {
          where.course_id = '00000000-0000-0000-0000-000000000000';
        } else {
          where.course_id = course_id;
        }
      } else {
        where.course_id = { [Op.in]: myCourseIds };
      }
    } else if (course_id) {
      where.course_id = course_id;
    }

    const { count, rows } = await Assignment.findAndCountAll({
      where,
      include: [
        { model: QuizQuestion, as: 'questions', attributes: ['id'] },
        { model: Course, as: 'course', attributes: ['id', 'title'] },
        { model: Lesson, as: 'lesson', attributes: ['id', 'title'] },
      ],
      order: [['created_at', 'DESC']],
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
    console.error('getAssignments Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra khi lấy danh sách bài tập!' });
  }
};

// GET /api/assignments/:id - Chi tiết assignment
export const getAssignmentById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const assignment = await Assignment.findByPk(id, {
      include: [
        {
          model: QuizQuestion,
          as: 'questions',
          order: [['sort_order', 'ASC']],
        },
        { model: Course, as: 'course', attributes: ['id', 'title'] },
        { model: Lesson, as: 'lesson', attributes: ['id', 'title'] },
      ],
    });

    if (!assignment) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy bài tập!' });
    }

    // Students can only view published assignments
    if (req.user?.user_type === 'student' && !assignment.is_published) {
      return res.status(403).json({ success: false, error: 'Bài tập chưa được xuất bản!' });
    }

    // Hide correct answers from students
    if (req.user?.user_type === 'student' && assignment.assignment_type === 'quiz') {
      const questions = (assignment as any).questions?.map((q: any) => ({
        ...q.toJSON(),
        options: q.options.map((opt: any) => ({
          id: opt.id,
          text: opt.text,
          // Don't include is_correct
        })),
        explanation: undefined, // Hide explanation until after submission
      }));
      return res.status(200).json({
        success: true,
        data: { ...assignment.toJSON(), questions },
      });
    }

    return res.status(200).json({
      success: true,
      data: assignment,
    });
  } catch (error: any) {
    console.error('getAssignmentById Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra khi lấy thông tin bài tập!' });
  }
};

// PUT /api/assignments/:id - Cập nhật assignment
export const updateAssignment = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Chưa xác thực người dùng!' });
    }

    const { id } = req.params;
    const assignment = await Assignment.findByPk(id);

    if (!assignment) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy bài tập!' });
    }

    // Check authorization
    if (req.user.user_type !== 'admin') {
      const isOwner = await isInstructorOfCourse(req.user.id, assignment.course_id);
      if (!isOwner) {
        return res.status(403).json({ success: false, error: 'Bạn không có quyền chỉnh sửa bài tập này!' });
      }
    }

    const { title, description, assignment_type, total_points, passing_score, time_limit_minutes, attempts_allowed, show_answer_after, due_date } = req.body;

    await assignment.update({
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(assignment_type !== undefined && { assignment_type }),
      ...(total_points !== undefined && { total_points }),
      ...(passing_score !== undefined && { passing_score }),
      ...(time_limit_minutes !== undefined && { time_limit_minutes }),
      ...(attempts_allowed !== undefined && { attempts_allowed }),
      ...(show_answer_after !== undefined && { show_answer_after }),
      ...(due_date !== undefined && { due_date }),
    });

    return res.status(200).json({
      success: true,
      message: 'Cập nhật bài tập thành công!',
      data: assignment,
    });
  } catch (error: any) {
    console.error('updateAssignment Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra khi cập nhật bài tập!' });
  }
};

// DELETE /api/assignments/:id - Xóa assignment
export const deleteAssignment = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Chưa xác thực người dùng!' });
    }

    const { id } = req.params;
    const assignment = await Assignment.findByPk(id);

    if (!assignment) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy bài tập!' });
    }

    // Check authorization
    if (req.user.user_type !== 'admin') {
      const isOwner = await isInstructorOfCourse(req.user.id, assignment.course_id);
      if (!isOwner) {
        return res.status(403).json({ success: false, error: 'Bạn không có quyền xóa bài tập này!' });
      }
    }

    await assignment.destroy(); // Soft delete (paranoid: true)

    return res.status(200).json({
      success: true,
      message: 'Xóa bài tập thành công!',
    });
  } catch (error: any) {
    console.error('deleteAssignment Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra khi xóa bài tập!' });
  }
};

// PATCH /api/assignments/:id/publish - Publish/unpublish
export const togglePublish = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Chưa xác thực người dùng!' });
    }

    const { id } = req.params;
    const assignment = await Assignment.findByPk(id);

    if (!assignment) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy bài tập!' });
    }

    // Check authorization
    if (req.user.user_type !== 'admin') {
      const isOwner = await isInstructorOfCourse(req.user.id, assignment.course_id);
      if (!isOwner) {
        return res.status(403).json({ success: false, error: 'Bạn không có quyền thay đổi trạng thái bài tập này!' });
      }
    }

    await assignment.update({ is_published: !assignment.is_published });

    return res.status(200).json({
      success: true,
      message: assignment.is_published ? 'Đã xuất bản bài tập!' : 'Đã ẩn bài tập!',
      data: assignment,
    });
  } catch (error: any) {
    console.error('togglePublish Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra khi thay đổi trạng thái!' });
  }
};

// POST /api/assignments/:id/questions - Thêm câu hỏi
export const addQuestion = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Chưa xác thực người dùng!' });
    }

    const { id } = req.params;
    const assignment = await Assignment.findByPk(id);

    if (!assignment) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy bài tập!' });
    }

    if (assignment.assignment_type !== 'quiz') {
      return res.status(400).json({ success: false, error: 'Chỉ bài tập loại quiz mới có câu hỏi!' });
    }

    // Check authorization
    if (req.user.user_type !== 'admin') {
      const isOwner = await isInstructorOfCourse(req.user.id, assignment.course_id);
      if (!isOwner) {
        return res.status(403).json({ success: false, error: 'Bạn không có quyền thêm câu hỏi!' });
      }
    }

    const { question_text, question_type, options, explanation, points, sort_order } = req.body;

    if (!question_text || !options || !Array.isArray(options)) {
      return res.status(400).json({ success: false, error: 'Vui lòng cung cấp đầy đủ thông tin câu hỏi!' });
    }

    // Get max sort_order
    const maxOrder = (await QuizQuestion.max('sort_order', {
      where: { assignment_id: id },
    }) as number) || 0;

    const question = await QuizQuestion.create({
      assignment_id: id,
      question_text,
      question_type: question_type || 'single',
      options,
      explanation: explanation || null,
      points: points || 1,
      sort_order: sort_order !== undefined ? sort_order : maxOrder + 1,
    });

    return res.status(201).json({
      success: true,
      message: 'Thêm câu hỏi thành công!',
      data: question,
    });
  } catch (error: any) {
    console.error('addQuestion Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra khi thêm câu hỏi!' });
  }
};

// PUT /api/questions/:id - Sửa câu hỏi
export const updateQuestion = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Chưa xác thực người dùng!' });
    }

    const { id } = req.params;
    const question = await QuizQuestion.findByPk(id, {
      include: [{ model: Assignment, as: 'assignment' }],
    });

    if (!question) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy câu hỏi!' });
    }

    // Check authorization
    if (req.user.user_type !== 'admin') {
      const isOwner = await isInstructorOfCourse(req.user.id, (question as any).assignment.course_id);
      if (!isOwner) {
        return res.status(403).json({ success: false, error: 'Bạn không có quyền sửa câu hỏi!' });
      }
    }

    const { question_text, question_type, options, explanation, points, sort_order } = req.body;

    await question.update({
      ...(question_text !== undefined && { question_text }),
      ...(question_type !== undefined && { question_type }),
      ...(options !== undefined && { options }),
      ...(explanation !== undefined && { explanation }),
      ...(points !== undefined && { points }),
      ...(sort_order !== undefined && { sort_order }),
    });

    return res.status(200).json({
      success: true,
      message: 'Cập nhật câu hỏi thành công!',
      data: question,
    });
  } catch (error: any) {
    console.error('updateQuestion Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra khi cập nhật câu hỏi!' });
  }
};

// DELETE /api/questions/:id - Xóa câu hỏi
export const deleteQuestion = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Chưa xác thực người dùng!' });
    }

    const { id } = req.params;
    const question = await QuizQuestion.findByPk(id, {
      include: [{ model: Assignment, as: 'assignment' }],
    });

    if (!question) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy câu hỏi!' });
    }

    // Check authorization
    if (req.user.user_type !== 'admin') {
      const isOwner = await isInstructorOfCourse(req.user.id, (question as any).assignment.course_id);
      if (!isOwner) {
        return res.status(403).json({ success: false, error: 'Bạn không có quyền xóa câu hỏi!' });
      }
    }

    await question.destroy();

    return res.status(200).json({
      success: true,
      message: 'Xóa câu hỏi thành công!',
    });
  } catch (error: any) {
    console.error('deleteQuestion Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra khi xóa câu hỏi!' });
  }
};

// PUT /api/assignments/:id/questions/reorder - Sắp xếp câu hỏi
export const reorderQuestions = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Chưa xác thực người dùng!' });
    }

    const { id } = req.params;
    const { order } = req.body; // Array of question IDs in new order

    if (!order || !Array.isArray(order)) {
      return res.status(400).json({ success: false, error: 'Vui lòng cung cấp thứ tự sắp xếp!' });
    }

    const assignment = await Assignment.findByPk(id);
    if (!assignment) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy bài tập!' });
    }

    // Check authorization
    if (req.user.user_type !== 'admin') {
      const isOwner = await isInstructorOfCourse(req.user.id, assignment.course_id);
      if (!isOwner) {
        return res.status(403).json({ success: false, error: 'Bạn không có quyền sắp xếp câu hỏi!' });
      }
    }

    // Update sort_order for each question
    for (let i = 0; i < order.length; i++) {
      await QuizQuestion.update(
        { sort_order: i + 1 },
        { where: { id: order[i], assignment_id: id } }
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Sắp xếp câu hỏi thành công!',
    });
  } catch (error: any) {
    console.error('reorderQuestions Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra khi sắp xếp câu hỏi!' });
  }
};
