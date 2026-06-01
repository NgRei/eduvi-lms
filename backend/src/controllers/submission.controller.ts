import { Response } from 'express';
import { Op } from 'sequelize';
import { Submission, Assignment, QuizQuestion, User, Enrollment, LessonProgress, CourseInstructor } from '../models';
import { AuthRequest } from '../middlewares/auth.middleware';

// Helper: Check if user is instructor of the course
const isInstructorOfCourse = async (userId: string, courseId: string): Promise<boolean> => {
  const courseInstructor = await CourseInstructor.findOne({
    where: { instructor_id: userId, course_id: courseId },
  });
  return !!courseInstructor;
};

// Auto-grade quiz submission
const gradeQuizSubmission = async (submission: any, assignment: any) => {
  const questions = await QuizQuestion.findAll({
    where: { assignment_id: assignment.id },
    order: [['sort_order', 'ASC']],
  });

  const answers = submission.answers || [];
  let totalScore = 0;
  const results: any[] = [];

  for (const question of questions) {
    const studentAnswer = answers.find((a: any) => a.question_id === question.id);
    const correctOptions = question.options
      .filter((o: any) => o.is_correct)
      .map((o: any) => o.id)
      .sort();
    const selectedOptions = (studentAnswer?.selected_options || []).sort();

    const isCorrect =
      correctOptions.length === selectedOptions.length &&
      correctOptions.every((opt: string, idx: number) => opt === selectedOptions[idx]);

    if (isCorrect) {
      totalScore += question.points;
    }

    results.push({
      question_id: question.id,
      question_text: question.question_text,
      is_correct: isCorrect,
      selected: selectedOptions,
      correct: correctOptions,
      points_earned: isCorrect ? question.points : 0,
      points_possible: question.points,
      explanation: question.explanation,
    });
  }

  await submission.update({
    score: totalScore,
    status: 'graded',
  });

  return {
    score: totalScore,
    total: assignment.total_points,
    passed: totalScore >= assignment.passing_score,
    results,
  };
};

// POST /api/assignments/:id/submit - Nộp bài
export const submitAssignment = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Chưa xác thực người dùng!' });
    }

    const { id } = req.params;
    const { answers } = req.body;

    // Find assignment
    const assignment = await Assignment.findByPk(id, {
      include: [{ model: QuizQuestion, as: 'questions' }],
    });

    if (!assignment) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy bài tập!' });
    }

    // Check if published
    if (!assignment.is_published) {
      return res.status(400).json({ success: false, error: 'Bài tập chưa được xuất bản!' });
    }

    // Check due date
    if (assignment.due_date && new Date() > new Date(assignment.due_date)) {
      return res.status(400).json({ success: false, error: 'Đã quá hạn nộp bài!' });
    }

    // Check enrollment
    const enrollment = await Enrollment.findOne({
      where: { user_id: req.user.id, course_id: assignment.course_id, status: 'active' },
    });

    if (!enrollment) {
      return res.status(403).json({ success: false, error: 'Bạn chưa đăng ký khóa học này!' });
    }

    // Check attempts
    const existingSubmissions = await Submission.count({
      where: { assignment_id: id, user_id: req.user.id },
    });

    if (existingSubmissions >= assignment.attempts_allowed) {
      return res.status(400).json({ success: false, error: 'Bạn đã hết lượt nộp bài!' });
    }

    // Validate answers based on type
    if (assignment.assignment_type === 'quiz') {
      if (!answers || !Array.isArray(answers) || answers.length === 0) {
        return res.status(400).json({ success: false, error: 'Vui lòng trả lời ít nhất một câu hỏi!' });
      }
    } else if (assignment.assignment_type === 'essay') {
      if (!answers?.text || answers.text.trim().length === 0) {
        return res.status(400).json({ success: false, error: 'Vui lòng nhập nội dung bài viết!' });
      }
    } else if (assignment.assignment_type === 'upload') {
      if (!answers?.file_url) {
        return res.status(400).json({ success: false, error: 'Vui lòng upload file!' });
      }
    }

    // Create submission
    const submission = await Submission.create({
      assignment_id: id,
      user_id: req.user.id,
      attempt_number: existingSubmissions + 1,
      answers,
      status: 'submitted',
      submitted_at: new Date(),
    });

    // Auto-grade quiz
    let gradingResult = null;
    if (assignment.assignment_type === 'quiz') {
      gradingResult = await gradeQuizSubmission(submission, assignment);

      // Update LessonProgress if passed and assignment is linked to a lesson
      if (gradingResult.passed && assignment.lesson_id) {
        const progress = await LessonProgress.findOne({
          where: { user_id: req.user.id, lesson_id: assignment.lesson_id },
        });

        if (progress) {
          await progress.update({
            is_completed: true,
            quiz_score: gradingResult.score,
            completed_at: new Date(),
          });
        } else {
          await LessonProgress.create({
            user_id: req.user.id,
            lesson_id: assignment.lesson_id,
            course_id: assignment.course_id,
            is_completed: true,
            quiz_score: gradingResult.score,
            completed_at: new Date(),
          });
        }
      }
    }

    return res.status(201).json({
      success: true,
      message: assignment.assignment_type === 'quiz' ? 'Nộp bài và chấm điểm thành công!' : 'Nộp bài thành công! Chờ giảng viên chấm điểm.',
      data: {
        submission,
        grading: gradingResult,
      },
    });
  } catch (error: any) {
    console.error('submitAssignment Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra khi nộp bài!' });
  }
};

// GET /api/assignments/:id/submissions - Lịch sử nộp bài của mình
export const getMySubmissions = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Chưa xác thực người dùng!' });
    }

    const { id } = req.params;

    const submissions = await Submission.findAll({
      where: { assignment_id: id, user_id: req.user.id },
      order: [['attempt_number', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      data: submissions,
    });
  } catch (error: any) {
    console.error('getMySubmissions Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra khi lấy lịch sử nộp bài!' });
  }
};

// GET /api/submissions/:id - Chi tiết submission
export const getSubmissionById = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Chưa xác thực người dùng!' });
    }

    const { id } = req.params;

    const submission = await Submission.findByPk(id, {
      include: [
        {
          model: Assignment,
          as: 'assignment',
          include: [{ model: QuizQuestion, as: 'questions' }],
        },
        { model: User, as: 'user', attributes: ['id', 'full_name', 'username'] },
        { model: User, as: 'grader', attributes: ['id', 'full_name'] },
      ],
    });

    if (!submission) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy bài nộp!' });
    }

    // Students can only view their own submissions
    if (req.user.user_type === 'student' && submission.user_id !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Bạn chỉ có thể xem bài nộp của mình!' });
    }

    // If quiz is graded and show_answer_after is true, include question details
    let responseData: any = submission.toJSON();
    if (
      submission.status === 'graded' &&
      (submission as any).assignment?.show_answer_after &&
      (submission as any).assignment?.assignment_type === 'quiz'
    ) {
      const questions = (submission as any).assignment?.questions || [];
      const answers = submission.answers || [];
      responseData.question_results = questions.map((q: any) => {
        const studentAnswer = answers.find((a: any) => a.question_id === q.id);
        const correctOptions = q.options.filter((o: any) => o.is_correct).map((o: any) => o.id);
        const selectedOptions = studentAnswer?.selected_options || [];
        const isCorrect =
          correctOptions.length === selectedOptions.length &&
          correctOptions.every((opt: string) => selectedOptions.includes(opt));

        return {
          question_id: q.id,
          question_text: q.question_text,
          question_type: q.question_type,
          options: q.options,
          selected_options: selectedOptions,
          is_correct: isCorrect,
          points: q.points,
          explanation: q.explanation,
        };
      });
    }

    return res.status(200).json({
      success: true,
      data: responseData,
    });
  } catch (error: any) {
    console.error('getSubmissionById Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra khi lấy thông tin bài nộp!' });
  }
};

// GET /api/assignments/:id/grading - List submissions cần chấm (instructor)
export const getSubmissionsForGrading = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Chưa xác thực người dùng!' });
    }

    const { id } = req.params;
    const { status, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    // Find assignment and check authorization
    const assignment = await Assignment.findByPk(id);
    if (!assignment) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy bài tập!' });
    }

    if (req.user.user_type !== 'admin') {
      const isOwner = await isInstructorOfCourse(req.user.id, assignment.course_id);
      if (!isOwner) {
        return res.status(403).json({ success: false, error: 'Bạn không có quyền xem bài nộp của khóa học này!' });
      }
    }

    const where: any = { assignment_id: id };
    if (status) where.status = status;

    const { count, rows } = await Submission.findAndCountAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'full_name', 'username', 'email'] },
      ],
      order: [['submitted_at', 'DESC']],
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
    console.error('getSubmissionsForGrading Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra khi lấy danh sách bài nộp!' });
  }
};

// PUT /api/submissions/:id/grade - Chấm bài (instructor)
export const gradeSubmission = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Chưa xác thực người dùng!' });
    }

    const { id } = req.params;
    const { score, feedback } = req.body;

    if (score === undefined || score === null) {
      return res.status(400).json({ success: false, error: 'Vui lòng cung cấp điểm số!' });
    }

    const submission = await Submission.findByPk(id, {
      include: [{ model: Assignment, as: 'assignment' }],
    });

    if (!submission) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy bài nộp!' });
    }

    // Check authorization
    if (req.user.user_type !== 'admin') {
      const isOwner = await isInstructorOfCourse(req.user.id, (submission as any).assignment.course_id);
      if (!isOwner) {
        return res.status(403).json({ success: false, error: 'Bạn không có quyền chấm bài nộp này!' });
      }
    }

    await submission.update({
      score,
      feedback: feedback || null,
      status: 'graded',
      graded_by: req.user.id,
      graded_at: new Date(),
    });

    // Update LessonProgress if passed
    const assignment = (submission as any).assignment;
    if (score >= assignment.passing_score && assignment.lesson_id) {
      const progress = await LessonProgress.findOne({
        where: { user_id: submission.user_id, lesson_id: assignment.lesson_id },
      });

      if (progress) {
        await progress.update({
          is_completed: true,
          quiz_score: score,
          completed_at: new Date(),
        });
      } else {
        await LessonProgress.create({
          user_id: submission.user_id,
          lesson_id: assignment.lesson_id,
          course_id: assignment.course_id,
          is_completed: true,
          quiz_score: score,
          completed_at: new Date(),
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Chấm bài thành công!',
      data: submission,
    });
  } catch (error: any) {
    console.error('gradeSubmission Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra khi chấm bài!' });
  }
};
