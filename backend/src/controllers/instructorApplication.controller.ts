import { Request, Response } from 'express';
import { Op } from 'sequelize';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sequelize } from '../config/database';
import {
  User,
  StudentProfile,
  InstructorProfile,
  InstructorApplication,
  AuditLog,
  RefreshToken,
} from '../models';
import { AuthRequest } from '../middlewares/auth.middleware';
import { createAuditLog, getClientIp } from '../services/audit.service';

const removeAccents = (str: string): string => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd');
};

const generateUsername = (fullName: string): string => {
  if (!fullName) return '';
  const cleanName = removeAccents(fullName).trim().toLowerCase();
  const parts = cleanName.split(/\s+/);
  if (parts.length === 0) return '';
  const firstName = parts[parts.length - 1];
  const initials = parts
    .slice(0, parts.length - 1)
    .map((part) => part.charAt(0))
    .join('');
  const randomDigits = Math.floor(100 + Math.random() * 900);
  return `${firstName}${initials}@${randomDigits}`;
};

const generateAccessToken = (user: any): string => {
  const jwtSecret = process.env.JWT_SECRET || 'eduvi_lms_jwt_secret_key_2026_super_secure';
  return jwt.sign(
    { id: user.id, email: user.email, username: user.username, user_type: user.user_type },
    jwtSecret,
    { expiresIn: '15m' } as jwt.SignOptions
  );
};

const generateRefreshToken = (): { raw: string; hash: string } => {
  const raw = crypto.randomBytes(40).toString('hex');
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  return { raw, hash };
};

/**
 * Public: Register Account & Submit Instructor Application in one step
 * POST /api/instructor-applications/register-and-apply
 */
export const registerAndApply = async (req: Request, res: Response) => {
  const t = await sequelize.transaction();
  try {
    const {
      email,
      password,
      full_name,
      phone_number,
      headline,
      bio,
      expertise,
      experience_years,
      education_degree,
      linkedin_url,
      portfolio_url,
      cv_url,
      intro_video_url,
      teaching_reason,
      course_proposal,
    } = req.body;

    if (!email || !password || !full_name || !headline || !bio || !expertise) {
      if (t) await t.rollback();
      return res.status(400).json({
        success: false,
        error: 'Vui lòng cung cấp đầy đủ thông tin bắt buộc (Email, Mật khẩu, Họ tên, Chức danh, Giới thiệu, Chuyên môn)!',
      });
    }

    if (password.length < 6) {
      if (t) await t.rollback();
      return res.status(400).json({
        success: false,
        error: 'Mật khẩu phải có độ dài tối thiểu 6 ký tự!',
      });
    }

    // Check if email already exists
    const emailExists = await User.findOne({ where: { email }, transaction: t });
    if (emailExists) {
      if (t) await t.rollback();
      return res.status(409).json({
        success: false,
        error: 'Địa chỉ Email này đã tồn tại trên hệ thống! Vui lòng đăng nhập hoặc sử dụng Email khác.',
      });
    }

    // Generate unique username
    let username = generateUsername(full_name);
    let usernameExists = await User.findOne({ where: { username }, transaction: t });
    while (usernameExists) {
      username = generateUsername(full_name);
      usernameExists = await User.findOne({ where: { username }, transaction: t });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Create User with role 'student' (pending application approval)
    const newUser = await User.create(
      {
        email,
        username,
        password_hash,
        full_name,
        user_type: 'student',
        is_active: true,
      },
      { transaction: t }
    );

    // Create StudentProfile
    await StudentProfile.create(
      {
        user_id: newUser.id,
        phone: phone_number || null,
      },
      { transaction: t }
    );

    // Create InstructorApplication
    const application = await InstructorApplication.create(
      {
        user_id: newUser.id,
        headline: headline.trim(),
        bio: bio.trim(),
        expertise: expertise.trim(),
        experience_years: experience_years ? parseInt(experience_years, 10) : 0,
        education_degree: education_degree ? education_degree.trim() : null,
        phone_number: phone_number ? phone_number.trim() : null,
        linkedin_url: linkedin_url ? linkedin_url.trim() : null,
        portfolio_url: portfolio_url ? portfolio_url.trim() : null,
        cv_url: cv_url ? cv_url.trim() : null,
        intro_video_url: intro_video_url ? intro_video_url.trim() : null,
        teaching_reason: teaching_reason ? teaching_reason.trim() : null,
        course_proposal: course_proposal ? course_proposal.trim() : null,
        status: 'pending',
      },
      { transaction: t }
    );

    // Generate JWT tokens
    const accessToken = generateAccessToken(newUser);
    const { raw: refreshToken, hash: refreshTokenHash } = generateRefreshToken();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await RefreshToken.create(
      {
        user_id: newUser.id,
        token_hash: refreshTokenHash,
        device_info: req.headers['user-agent'] || null,
        ip_address: getClientIp(req),
        expires_at: expiresAt,
      },
      { transaction: t }
    );

    // Audit log
    try {
      await AuditLog.create(
        {
          user_id: newUser.id,
          action: 'REGISTER_AND_SUBMIT_INSTRUCTOR_APPLICATION',
          entity_type: 'InstructorApplication',
          entity_id: application.id,
          detail: { email: newUser.email, headline, expertise },
          ip_address: getClientIp(req),
        },
        { transaction: t }
      );
    } catch (logErr) {
      console.warn('AuditLog creation warning:', logErr);
    }

    if (t) await t.commit();

    return res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản và nộp hồ sơ ứng tuyển giảng viên thành công! Ban Quản trị sẽ xét duyệt trong 24-48 giờ.',
      token: accessToken,
      accessToken,
      refreshToken,
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        full_name: newUser.full_name,
        user_type: newUser.user_type,
      },
      data: application,
    });
  } catch (error: any) {
    if (t) await t.rollback();
    console.error('registerAndApply Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Có lỗi xảy ra trong quá trình đăng ký và nộp hồ sơ!',
    });
  }
};

/**
 * Candidate: Submit a new Instructor Application
 * POST /api/instructor-applications
 */
export const submitApplication = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Chưa xác thực người dùng!' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Người dùng không tồn tại!' });
    }

    if (user.user_type === 'instructor') {
      return res.status(400).json({ success: false, error: 'Bạn đã là Giảng viên trong hệ thống!' });
    }
    if (user.user_type === 'admin') {
      return res.status(400).json({ success: false, error: 'Tài khoản Quản trị viên không cần ứng tuyển!' });
    }

    // Check if there is already a pending application
    const existingPending = await InstructorApplication.findOne({
      where: {
        user_id: userId,
        status: 'pending',
      },
    });

    if (existingPending) {
      return res.status(400).json({
        success: false,
        error: 'Bạn đã có một hồ sơ ứng tuyển đang chờ duyệt. Vui lòng đợi Ban Quản trị xử lý!',
      });
    }

    const {
      headline,
      bio,
      expertise,
      experience_years,
      education_degree,
      phone_number,
      linkedin_url,
      portfolio_url,
      cv_url,
      intro_video_url,
      teaching_reason,
      course_proposal,
    } = req.body;

    if (!headline || !bio || !expertise) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng điền đầy đủ các thông tin bắt buộc (Tiêu đề, Giới thiệu bản thân, Chuyên môn)!',
      });
    }

    const application = await InstructorApplication.create({
      user_id: userId,
      headline: headline.trim(),
      bio: bio.trim(),
      expertise: expertise.trim(),
      experience_years: experience_years ? parseInt(experience_years, 10) : 0,
      education_degree: education_degree ? education_degree.trim() : null,
      phone_number: phone_number ? phone_number.trim() : null,
      linkedin_url: linkedin_url ? linkedin_url.trim() : null,
      portfolio_url: portfolio_url ? portfolio_url.trim() : null,
      cv_url: cv_url ? cv_url.trim() : null,
      intro_video_url: intro_video_url ? intro_video_url.trim() : null,
      teaching_reason: teaching_reason ? teaching_reason.trim() : null,
      course_proposal: course_proposal ? course_proposal.trim() : null,
      status: 'pending',
    });

    // Create Audit Log
    try {
      await AuditLog.create({
        user_id: userId,
        action: 'SUBMIT_INSTRUCTOR_APPLICATION',
        entity_type: 'InstructorApplication',
        entity_id: application.id,
        detail: { headline, expertise },
        ip_address: req.ip || null,
      });
    } catch (logErr) {
      console.warn('AuditLog creation warning:', logErr);
    }

    return res.status(201).json({
      success: true,
      message: 'Hồ sơ ứng tuyển giảng viên đã được gửi thành công. Ban Quản trị sẽ xét duyệt trong 24-48 giờ!',
      data: application,
    });
  } catch (error: any) {
    console.error('submitApplication Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra khi nộp hồ sơ ứng tuyển!' });
  }
};

/**
 * Candidate: Get current user's latest application
 * GET /api/instructor-applications/my-application
 */
export const getMyApplication = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Chưa xác thực người dùng!' });
    }

    const application = await InstructorApplication.findOne({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
      include: [
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'full_name', 'email'],
        },
      ],
    });

    return res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error: any) {
    console.error('getMyApplication Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra khi kiểm tra hồ sơ ứng tuyển!' });
  }
};

/**
 * Candidate: Update and resubmit an application (if rejected or need_info)
 * PUT /api/instructor-applications/my-application
 */
export const updateMyApplication = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Chưa xác thực người dùng!' });
    }

    const application = await InstructorApplication.findOne({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
    });

    if (!application) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy hồ sơ ứng tuyển nào để cập nhật!' });
    }

    if (application.status === 'approved') {
      return res.status(400).json({ success: false, error: 'Hồ sơ của bạn đã được phê duyệt thành công!' });
    }

    const {
      headline,
      bio,
      expertise,
      experience_years,
      education_degree,
      phone_number,
      linkedin_url,
      portfolio_url,
      cv_url,
      intro_video_url,
      teaching_reason,
      course_proposal,
    } = req.body;

    await application.update({
      headline: headline !== undefined ? headline.trim() : application.headline,
      bio: bio !== undefined ? bio.trim() : application.bio,
      expertise: expertise !== undefined ? expertise.trim() : application.expertise,
      experience_years: experience_years !== undefined ? parseInt(experience_years, 10) : application.experience_years,
      education_degree: education_degree !== undefined ? education_degree?.trim() : application.education_degree,
      phone_number: phone_number !== undefined ? phone_number?.trim() : application.phone_number,
      linkedin_url: linkedin_url !== undefined ? linkedin_url?.trim() : application.linkedin_url,
      portfolio_url: portfolio_url !== undefined ? portfolio_url?.trim() : application.portfolio_url,
      cv_url: cv_url !== undefined ? cv_url?.trim() : application.cv_url,
      intro_video_url: intro_video_url !== undefined ? intro_video_url?.trim() : application.intro_video_url,
      teaching_reason: teaching_reason !== undefined ? teaching_reason?.trim() : application.teaching_reason,
      course_proposal: course_proposal !== undefined ? course_proposal?.trim() : application.course_proposal,
      status: 'pending', // Reset to pending for re-review
      rejection_reason: null, // Clear past rejection reason
    });

    return res.status(200).json({
      success: true,
      message: 'Đã cập nhật và nộp lại hồ sơ thành công! Đang chờ Ban Quản trị xét duyệt.',
      data: application,
    });
  } catch (error: any) {
    console.error('updateMyApplication Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra khi cập nhật hồ sơ!' });
  }
};

/**
 * Admin: Get list of instructor applications with filters and pagination
 * GET /api/instructor-applications/admin
 */
export const getAdminApplications = async (req: AuthRequest, res: Response) => {
  try {
    const {
      page = '1',
      limit = '20',
      status,
      search,
    } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const offset = (pageNum - 1) * limitNum;

    const where: any = {};
    if (status && status !== 'all') {
      where.status = status;
    }

    const candidateWhere: any = {};
    if (search) {
      candidateWhere[Op.or] = [
        { full_name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }

    const { rows: applications, count: total } = await InstructorApplication.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'candidate',
          where: Object.keys(candidateWhere).length > 0 ? candidateWhere : undefined,
          attributes: ['id', 'full_name', 'email', 'avatar_url', 'user_type', 'created_at'],
        },
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'full_name', 'email'],
        },
      ],
      order: [['created_at', 'DESC']],
      limit: limitNum,
      offset,
      distinct: true,
    });

    return res.status(200).json({
      success: true,
      data: applications,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    console.error('getAdminApplications Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra khi lấy danh sách hồ sơ ứng tuyển!' });
  }
};

/**
 * Admin: Get single application details
 * GET /api/instructor-applications/admin/:id
 */
export const getAdminApplicationById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const application = await InstructorApplication.findByPk(id, {
      include: [
        {
          model: User,
          as: 'candidate',
          attributes: ['id', 'full_name', 'email', 'avatar_url', 'user_type', 'created_at'],
        },
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'full_name', 'email'],
        },
      ],
    });

    if (!application) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy hồ sơ ứng tuyển!' });
    }

    return res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error: any) {
    console.error('getAdminApplicationById Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra khi xem chi tiết hồ sơ!' });
  }
};

/**
 * Admin: Approve instructor application
 * POST /api/instructor-applications/admin/:id/approve
 */
export const approveApplication = async (req: AuthRequest, res: Response) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { admin_notes } = req.body;
    const adminId = req.user?.id;

    const application = await InstructorApplication.findByPk(id, { transaction: t });
    if (!application) {
      await t.rollback();
      return res.status(404).json({ success: false, error: 'Không tìm thấy hồ sơ ứng tuyển!' });
    }

    if (application.status === 'approved') {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'Hồ sơ này đã được phê duyệt trước đó!' });
    }

    const candidateUser = await User.findByPk(application.user_id, { transaction: t });
    if (!candidateUser) {
      await t.rollback();
      return res.status(404).json({ success: false, error: 'Không tìm thấy tài khoản người dùng ứng viên!' });
    }

    // 1. Update application status
    await application.update(
      {
        status: 'approved',
        admin_notes: admin_notes || application.admin_notes,
        reviewed_by: adminId,
        reviewed_at: new Date(),
      },
      { transaction: t }
    );

    // 2. Upgrade user to instructor role
    await candidateUser.update(
      {
        user_type: 'instructor',
      },
      { transaction: t }
    );

    // 3. Upsert InstructorProfile
    const profile = await InstructorProfile.findOne({
      where: { user_id: candidateUser.id },
      transaction: t,
    });

    if (!profile) {
      await InstructorProfile.create(
        {
          user_id: candidateUser.id,
          expertise: application.expertise,
          experience_years: application.experience_years,
          degree: application.education_degree,
          linkedin_url: application.linkedin_url,
          is_active: true,
        },
        { transaction: t }
      );
    } else {
      await profile.update(
        {
          expertise: application.expertise || profile.expertise,
          experience_years: application.experience_years || profile.experience_years,
          degree: application.education_degree || profile.degree,
          linkedin_url: application.linkedin_url || profile.linkedin_url,
          is_active: true,
        },
        { transaction: t }
      );
    }

    // 4. Create Audit Log
    try {
      await AuditLog.create(
        {
          user_id: adminId,
          action: 'APPROVE_INSTRUCTOR_APPLICATION',
          entity_type: 'InstructorApplication',
          entity_id: application.id,
          detail: {
            candidate_id: candidateUser.id,
            candidate_email: candidateUser.email,
            candidate_name: candidateUser.full_name,
          },
          ip_address: req.ip || null,
        },
        { transaction: t }
      );
    } catch (logErr) {
      console.warn('Audit log creation warning:', logErr);
    }

    if (t) await t.commit();

    return res.status(200).json({
      success: true,
      message: `Đã phê duyệt hồ sơ ứng tuyển của "${candidateUser.full_name}" thành công! Tài khoản đã được nâng cấp thành Giảng viên.`,
      data: application,
    });
  } catch (error: any) {
    if (t) await t.rollback();
    console.error('approveApplication Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra khi phê duyệt hồ sơ!' });
  }
};

/**
 * Admin: Reject instructor application with reason
 * POST /api/instructor-applications/admin/:id/reject
 */
export const rejectApplication = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { rejection_reason, admin_notes } = req.body;
    const adminId = req.user?.id;

    if (!rejection_reason || !rejection_reason.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng cung cấp lý do từ chối để phản hồi cho ứng viên!',
      });
    }

    const application = await InstructorApplication.findByPk(id);
    if (!application) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy hồ sơ ứng tuyển!' });
    }

    await application.update({
      status: 'rejected',
      rejection_reason: rejection_reason.trim(),
      admin_notes: admin_notes || application.admin_notes,
      reviewed_by: adminId,
      reviewed_at: new Date(),
    });

    // Create Audit Log
    try {
      await AuditLog.create({
        user_id: adminId,
        action: 'REJECT_INSTRUCTOR_APPLICATION',
        entity_type: 'InstructorApplication',
        entity_id: application.id,
        detail: {
          candidate_id: application.user_id,
          rejection_reason: rejection_reason.trim(),
        },
        ip_address: req.ip || null,
      });
    } catch (logErr) {
      console.warn('Audit log creation warning:', logErr);
    }

    return res.status(200).json({
      success: true,
      message: 'Đã từ chối hồ sơ ứng tuyển và gửi lý do phản hồi cho ứng viên.',
      data: application,
    });
  } catch (error: any) {
    console.error('rejectApplication Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra khi từ chối hồ sơ!' });
  }
};
