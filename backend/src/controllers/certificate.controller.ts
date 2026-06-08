import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { Certificate, UserCertificate, Enrollment, Course, User } from '../models';
import { createAuditLog, getClientIp } from '../services/audit.service';

// POST /api/certificates/issue/:courseId — Cấp chứng chỉ khi hoàn thành khóa học
export const issueCertificate = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Chưa xác thực người dùng!' });
    }

    const { courseId } = req.params;

    // Kiểm tra enrollment
    const enrollment = await Enrollment.findOne({
      where: { user_id: req.user.id, course_id: courseId }
    });

    if (!enrollment) {
      return res.status(404).json({ success: false, error: 'Bạn chưa đăng ký khóa học này!' });
    }

    if (enrollment.progress_percentage < 100) {
      return res.status(400).json({ success: false, error: 'Chưa hoàn thành khóa học (tiến độ chưa đạt 100%)!' });
    }

    if (enrollment.certificate_issued) {
      // Đã có chứng chỉ, trả về
      const existing = await UserCertificate.findOne({
        where: { user_id: req.user.id, course_id: courseId }
      });
      return res.status(200).json({ success: true, data: existing, message: 'Chứng chỉ đã được cấp trước đó.' });
    }

    // Kiểm tra certificate template của khóa học
    let certificate = await Certificate.findOne({ where: { course_id: courseId } });

    // Nếu khóa học chưa có certificate template, tạo mặc định
    if (!certificate) {
      const course = await Course.findByPk(courseId);
      if (!course) {
        return res.status(404).json({ success: false, error: 'Không tìm thấy khóa học!' });
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

    // Tạo user certificate
    const userCert = await UserCertificate.create({
      user_id: req.user.id,
      certificate_id: certificate.id,
      course_id: courseId,
      cert_code,
      issued_at: new Date(),
      expires_at,
    });

    // Cập nhật enrollment
    await enrollment.update({ certificate_issued: true });

    // Audit log — cấp chứng chỉ
    createAuditLog({
      user_id: req.user.id,
      action: 'cert_issued',
      entity_type: 'user_certificate',
      entity_id: userCert.id,
      detail: { course_id: courseId, cert_code },
      ip_address: getClientIp(req),
    });

    return res.status(201).json({ success: true, data: userCert });
  } catch (error: any) {
    console.error('issueCertificate Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra khi cấp chứng chỉ!' });
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
