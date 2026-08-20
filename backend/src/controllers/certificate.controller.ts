import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { Certificate, UserCertificate, Enrollment, Course, User, Assignment, Submission, Lesson, LessonProgress } from '../models';
import { createAuditLog, getClientIp } from '../services/audit.service';
import { generateCertificatePdf } from '../services/certificate-pdf.service';

// Helper function to issue certificate automatically
export const autoIssueCertificateHelper = async (userId: string, courseId: string, ipAddress: string = '127.0.0.1'): Promise<any> => {
  // Kiểm tra enrollment
  const enrollment = await Enrollment.findOne({
    where: { user_id: userId, course_id: courseId }
  });

  if (!enrollment) {
    throw new Error('Bạn chưa đăng ký khóa học này!');
  }

  if (enrollment.progress_percentage < 100) {
    throw new Error('Chưa hoàn thành khóa học (tiến độ chưa đạt 100%)!');
  }

  // Kiểm tra Final Exam (nếu có)
  const finalExam = await Assignment.findOne({
    where: {
      course_id: courseId,
      lesson_id: null,
      is_published: true
    }
  });

  if (finalExam) {
    const submission = await Submission.findOne({
      where: {
        assignment_id: finalExam.id,
        user_id: userId
      },
      order: [['score', 'DESC']]
    });

    if (!submission) {
      throw new Error('Bạn phải hoàn thành bài thi cuối khóa để được cấp chứng chỉ!');
    }

    if (submission.score === null || submission.score < finalExam.passing_score) {
      throw new Error(`Điểm thi cuối khóa (${submission.score || 0}) chưa đạt điểm qua môn tối thiểu (${finalExam.passing_score}/${finalExam.total_points})!`);
    }
  }

  if (enrollment.certificate_issued) {
    const existing = await UserCertificate.findOne({
      where: { user_id: userId, course_id: courseId }
    });
    return existing;
  }

  // Kiểm tra certificate template của khóa học
  let certificate = await Certificate.findOne({ where: { course_id: courseId } });

  // Nếu khóa học chưa có certificate template, tạo mặc định
  if (!certificate) {
    const course = await Course.findByPk(courseId);
    if (!course) {
      throw new Error('Không tìm thấy khóa học!');
    }
    certificate = await Certificate.create({
      course_id: courseId,
      title: `Chứng chỉ hoàn thành: ${course.title}`,
      description: `Xác nhận đã hoàn thành khóa học "${course.title}"`,
    });
  }

  // Tạo cert_code ngẫu nhiên
  const cert_code = `CERT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  // Tính ngày hết hạn
  let expires_at = null;
  if (certificate.valid_days) {
    const exp = new Date();
    exp.setDate(exp.getDate() + certificate.valid_days);
    expires_at = exp;
  }

  // Lấy thông tin người dùng và khóa học
  const user = await User.findByPk(userId);
  const course = await Course.findByPk(courseId);

  let file_url = null;
  try {
    file_url = await generateCertificatePdf(
      user?.full_name || 'Học viên Eduvi',
      course?.title || 'Khóa học Eduvi',
      cert_code,
      new Date()
    );
  } catch (pdfErr: any) {
    console.error('Failed to generate certificate PDF:', pdfErr.message);
  }

  // Tạo user certificate
  const userCert = await UserCertificate.create({
    user_id: userId,
    certificate_id: certificate.id,
    course_id: courseId,
    cert_code,
    issued_at: new Date(),
    expires_at,
    file_url,
  });

  // Cập nhật enrollment
  await enrollment.update({ certificate_issued: true });

  // Audit log — cấp chứng chỉ
  createAuditLog({
    user_id: userId,
    action: 'cert_issued',
    entity_type: 'user_certificate',
    entity_id: userCert.id,
    detail: { course_id: courseId, cert_code },
    ip_address: ipAddress,
  });

  return userCert;
};

// POST /api/certificates/issue/:courseId — Cấp chứng chỉ khi hoàn thành khóa học
export const issueCertificate = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Chưa xác thực người dùng!' });
    }

    const { courseId } = req.params;
    const ipAddress = getClientIp(req) || '127.0.0.1';

    const userCert = await autoIssueCertificateHelper(req.user.id, courseId, ipAddress);
    return res.status(200).json({ success: true, data: userCert });
  } catch (error: any) {
    console.error('issueCertificate Error:', error);
    return res.status(400).json({ success: false, error: error.message || 'Có lỗi xảy ra khi cấp chứng chỉ!' });
  }
};

// GET /api/certificates/my — Lấy danh sách chứng chỉ của học viên
export const getMyCertificates = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Chưa xác thực người dùng!' });
    }

    const certs = await UserCertificate.findAll({
      where: { user_id: req.user.id },
      include: [
        { model: Certificate, as: 'certificate', attributes: ['title', 'description', 'template_url'] },
        { model: Course, as: 'course', attributes: ['title', 'thumbnail'] },
      ],
      order: [['issued_at', 'DESC']],
    });

    return res.status(200).json({ success: true, data: certs });
  } catch (error: any) {
    console.error('getMyCertificates Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra khi lấy danh sách chứng chỉ!' });
  }
};

// GET /api/certificates/verify/:cert_code — Xác thực chứng chỉ (public)
export const verifyCertificate = async (req: AuthRequest, res: Response) => {
  try {
    const { cert_code } = req.params;

    const userCert = await UserCertificate.findOne({
      where: { cert_code },
      include: [
        { model: User, as: 'user', attributes: ['full_name', 'email'] },
        { model: Certificate, as: 'certificate', attributes: ['title', 'description'] },
        { model: Course, as: 'course', attributes: ['title'] },
      ],
    });

    if (!userCert) {
      return res.status(404).json({ success: false, error: 'Mã chứng chỉ không hợp lệ!' });
    }

    // Kiểm tra hết hạn
    const isExpired = userCert.expires_at && new Date() > new Date(userCert.expires_at);

    return res.status(200).json({
      success: true,
      data: {
        cert_code: userCert.cert_code,
        holder_name: (userCert as any).user?.full_name,
        course_title: (userCert as any).course?.title,
        certificate_title: (userCert as any).certificate?.title,
        issued_at: userCert.issued_at,
        expires_at: userCert.expires_at,
        is_expired: isExpired,
        is_valid: !isExpired,
      },
    });
  } catch (error: any) {
    console.error('verifyCertificate Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra khi xác thực chứng chỉ!' });
  }
};

// GET /api/certificates/course/:courseId/completion-status — Lấy tiến trình hoàn thành và trạng thái chứng chỉ
export const getCourseCompletionStatus = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Chưa xác thực người dùng!' });
    }

    const { courseId } = req.params;

    // 1. Lấy thông tin Enrollment
    const enrollment = await Enrollment.findOne({
      where: { user_id: req.user.id, course_id: courseId }
    });

    if (!enrollment) {
      return res.status(404).json({ success: false, error: 'Bạn chưa đăng ký khóa học này!' });
    }

    // 2. Lấy tổng số lượng bài giảng
    const totalLessons = await Lesson.count({
      where: { course_id: courseId, is_published: true }
    });

    // 3. Lấy số bài học đã hoàn thành
    const completedLessons = await LessonProgress.count({
      where: { user_id: req.user.id, course_id: courseId, is_completed: true }
    });

    // 4. Kiểm tra bài thi cuối khóa (Final Exam)
    const finalExam = await Assignment.findOne({
      where: {
        course_id: courseId,
        lesson_id: null,
        is_published: true
      }
    });

    let finalExamData = null;
    if (finalExam) {
      const submission = await Submission.findOne({
        where: {
          assignment_id: finalExam.id,
          user_id: req.user.id
        },
        order: [['score', 'DESC']]
      });

      finalExamData = {
        exists: true,
        assignment_id: finalExam.id,
        title: finalExam.title,
        submitted: !!submission,
        passed: submission ? (submission.score !== null && submission.score >= finalExam.passing_score) : false,
        score: submission ? submission.score : null,
        passing_score: finalExam.passing_score,
        total_points: finalExam.total_points,
      };
    } else {
      finalExamData = {
        exists: false
      };
    }

    // 5. Kiểm tra tính đủ điều kiện cấp chứng chỉ
    const progressPercentage = enrollment.progress_percentage;
    const isProgressDone = progressPercentage === 100;
    const isExamDone = !finalExamData.exists || finalExamData.passed;
    const eligible = isProgressDone && isExamDone;

    const certificate = {
      eligible,
      issued: enrollment.certificate_issued,
    };

    return res.status(200).json({
      success: true,
      data: {
        progress_percentage: progressPercentage,
        lessons_completed: completedLessons,
        lessons_total: totalLessons,
        final_exam: finalExamData,
        certificate,
      }
    });
  } catch (error: any) {
    console.error('getCourseCompletionStatus Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra khi lấy trạng thái hoàn thành khóa học!' });
  }
};
