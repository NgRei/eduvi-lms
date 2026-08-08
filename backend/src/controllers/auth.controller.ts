import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Op } from 'sequelize';
import { User, StudentProfile, InstructorProfile, RefreshToken } from '../models';
import { AuthRequest } from '../middlewares/auth.middleware';
import { sendPasswordResetEmail } from '../utils/email.util';
import { createAuditLog, getClientIp } from '../services/audit.service';

// Token config
const ACCESS_TOKEN_EXPIRES = '15m';
const REFRESH_TOKEN_EXPIRES_DAYS = 7;

// Generate access token
const generateAccessToken = (user: any): string => {
  const jwtSecret = process.env.JWT_SECRET || 'eduvi_lms_jwt_secret_key_2026_super_secure';
  return jwt.sign(
    { id: user.id, email: user.email, username: user.username, user_type: user.user_type },
    jwtSecret,
    { expiresIn: ACCESS_TOKEN_EXPIRES } as jwt.SignOptions
  );
};

// Generate random refresh token, return raw token + hash
const generateRefreshToken = (): { raw: string; hash: string } => {
  const raw = crypto.randomBytes(40).toString('hex');
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  return { raw, hash };
};

// Store refresh token in DB
const storeRefreshToken = async (userId: string, tokenHash: string, req: Request): Promise<void> => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_DAYS);

  await RefreshToken.create({
    user_id: userId,
    token_hash: tokenHash,
    device_info: req.headers['user-agent'] || null,
    ip_address: getClientIp(req),
    expires_at: expiresAt,
  });
};

// Helper to remove accents from Vietnamese text
const removeAccents = (str: string): string => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd');
};

// Custom Username Logic: name + initials of middle/last names + @ + random digits (e.g. annv@123)
const generateUsername = (fullName: string): string => {
  if (!fullName) return '';
  const cleanName = removeAccents(fullName).trim().toLowerCase();
  const parts = cleanName.split(/\s+/);
  if (parts.length === 0) return '';
  
  // "Nguyễn Văn An" -> firstName: "an", initials of "Nguyễn Văn" is "nv" -> annv
  const firstName = parts[parts.length - 1]; 
  const initials = parts
    .slice(0, parts.length - 1)
    .map(part => part.charAt(0))
    .join('');
    
  const randomDigits = Math.floor(100 + Math.random() * 900); // 3 random digits
  return `${firstName}${initials}@${randomDigits}`;
};

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, full_name, user_type, grade_level, school_name, expertise } = req.body;

    if (!email || !password || !full_name || !user_type) {
      return res.status(400).json({ success: false, error: 'Vui lòng cung cấp đầy đủ thông tin bắt buộc!' });
    }

    if (!['student', 'instructor'].includes(user_type)) {
      return res.status(400).json({ success: false, error: 'Vai trò người dùng không hợp lệ!' });
    }

    // Check if email already exists
    const emailExists = await User.findOne({ where: { email } });
    if (emailExists) {
      return res.status(409).json({ success: false, error: 'Địa chỉ Email này đã được đăng ký!' });
    }

    // Generate unique username based on custom rule
    let username = generateUsername(full_name);
    let usernameExists = await User.findOne({ where: { username } });
    
    // Ensure uniqueness recursively by appending new random digits if hit
    while (usernameExists) {
      username = generateUsername(full_name);
      usernameExists = await User.findOne({ where: { username } });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Create User inside transaction
    const newUser = await User.create({
      email,
      username,
      password_hash,
      full_name,
      user_type,
      is_active: true,
    });

    // Create sub profiles based on role
    if (user_type === 'student') {
      await StudentProfile.create({
        user_id: newUser.id,
        grade_level: grade_level || null,
        school_name: school_name || null,
      });
    } else if (user_type === 'instructor') {
      await InstructorProfile.create({
        user_id: newUser.id,
        expertise: expertise || null,
        experience_years: 0,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản thành công!',
      data: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        full_name: newUser.full_name,
        user_type: newUser.user_type,
      },
    });
  } catch (error: any) {
    console.error('Registration Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra trong quá trình đăng ký!' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { usernameOrEmail, password } = req.body;

    if (!usernameOrEmail || !password) {
      return res.status(400).json({ success: false, error: 'Vui lòng điền tài khoản và mật khẩu!' });
    }

    // Find user by either email or username
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { email: usernameOrEmail },
          { username: usernameOrEmail }
        ]
      }
    });

    if (!user) {
      return res.status(401).json({ success: false, error: 'Tên tài khoản hoặc Email không chính xác!' });
    }

    if (!user.is_active) {
      return res.status(403).json({ success: false, error: 'Tài khoản này hiện đang bị khóa!' });
    }

    // Match bcrypt password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Mật khẩu đăng nhập không chính xác!' });
    }

    // Update last_login_at
    await user.update({ last_login_at: new Date() });

    // Generate access token (15 min)
    const accessToken = generateAccessToken(user);

    // Generate refresh token (7 days)
    const { raw: refreshToken, hash: refreshTokenHash } = generateRefreshToken();
    await storeRefreshToken(user.id, refreshTokenHash, req);

    // Audit log — đăng nhập thành công
    createAuditLog({
      user_id: user.id,
      action: 'login',
      entity_type: 'user',
      entity_id: user.id,
      detail: { email: user.email, user_type: user.user_type },
      ip_address: getClientIp(req),
    });

    return res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công!',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        full_name: user.full_name,
        user_type: user.user_type,
      }
    });
  } catch (error: any) {
    console.error('Login Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra trong quá trình đăng nhập!' });
  }
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Chưa xác thực người dùng!' });
    }

    const { old_password, new_password, confirm_password } = req.body;

    // Validate input
    if (!old_password || !new_password || !confirm_password) {
      return res.status(400).json({ success: false, error: 'Vui lòng cung cấp đầy đủ mật khẩu cũ, mật khẩu mới và xác nhận mật khẩu!' });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ success: false, error: 'Mật khẩu mới phải có tối thiểu 6 ký tự!' });
    }

    if (new_password === old_password) {
      return res.status(400).json({ success: false, error: 'Mật khẩu mới phải khác mật khẩu cũ!' });
    }

    if (new_password !== confirm_password) {
      return res.status(400).json({ success: false, error: 'Xác nhận mật khẩu không khớp!' });
    }

    // Find user
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy tài khoản!' });
    }

    // Verify old password
    const isMatch = await bcrypt.compare(old_password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Mật khẩu cũ không chính xác!' });
    }

    // Hash new password and update
    const salt = await bcrypt.genSalt(10);
    const new_password_hash = await bcrypt.hash(new_password, salt);

    await user.update({ password_hash: new_password_hash });

    return res.status(200).json({
      success: true,
      message: 'Đổi mật khẩu thành công!',
    });
  } catch (error: any) {
    console.error('Change Password Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra trong quá trình đổi mật khẩu!' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: 'Vui lòng cung cấp địa chỉ email!' });
    }

    const user = await User.findOne({ where: { email } });

    // Luôn trả success để tránh email enumeration attack
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được liên kết đặt lại mật khẩu.',
      });
    }

    // Generate random token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Save hashed token to DB, expires in 15 minutes
    await user.update({
      reset_password_token: hashedToken,
      reset_password_expires: new Date(Date.now() + 15 * 60 * 1000),
    });

    // Send email with raw token (not hashed)
    await sendPasswordResetEmail(user.email, user.full_name, resetToken);

    return res.status(200).json({
      success: true,
      message: 'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được liên kết đặt lại mật khẩu.',
    });
  } catch (error: any) {
    console.error('Forgot Password Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra, vui lòng thử lại!' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, new_password, confirm_password } = req.body;

    if (!token || !new_password || !confirm_password) {
      return res.status(400).json({ success: false, error: 'Vui lòng cung cấp đầy đủ thông tin!' });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ success: false, error: 'Mật khẩu mới phải có tối thiểu 6 ký tự!' });
    }

    if (new_password !== confirm_password) {
      return res.status(400).json({ success: false, error: 'Xác nhận mật khẩu không khớp!' });
    }

    // Hash the token from URL to match DB
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid token and not expired
    const user = await User.findOne({
      where: {
        reset_password_token: hashedToken,
        reset_password_expires: { [Op.gt]: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({ success: false, error: 'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn!' });
    }

    // Hash new password and update
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(new_password, salt);

    await user.update({
      password_hash,
      reset_password_token: null,
      reset_password_expires: null,
    });

    return res.status(200).json({
      success: true,
      message: 'Đặt lại mật khẩu thành công! Vui lòng đăng nhập bằng mật khẩu mới.',
    });
  } catch (error: any) {
    console.error('Reset Password Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra, vui lòng thử lại!' });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Chưa xác thực người dùng!' });
    }

    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'email', 'username', 'full_name', 'user_type', 'is_active', 'created_at'],
      include: [
        {
          model: StudentProfile,
          as: 'studentProfile',
          attributes: ['date_of_birth', 'phone', 'address', 'school_name', 'grade_level'],
        },
        {
          model: InstructorProfile,
          as: 'instructorProfile',
          attributes: ['expertise', 'experience_years', 'degree', 'linkedin_url', 'total_students', 'rating_avg'],
        },
      ],
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy thông tin tài khoản!' });
    }

    const profile = user.user_type === 'student'
      ? (user as any).studentProfile
      : user.user_type === 'instructor'
        ? (user as any).instructorProfile
        : null;

    return res.status(200).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        username: user.username,
        full_name: user.full_name,
        user_type: user.user_type,
        is_active: user.is_active,
        created_at: user.createdAt,
        profile: profile ? profile.toJSON() : null,
      },
    });
  } catch (error: any) {
    console.error('getMe Error:', error);
    return res.status(500).json({ success: false, error: 'Lỗi nạp thông tin tài khoản!' });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, error: 'Vui lòng cung cấp refresh token!' });
    }

    // Hash the submitted token to match DB
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find valid refresh token in DB
    const storedToken = await RefreshToken.findOne({
      where: {
        token_hash: tokenHash,
        revoked_at: null,
        expires_at: { [Op.gt]: new Date() },
      },
      include: [{ model: User, as: 'user' }],
    });

    if (!storedToken) {
      return res.status(401).json({ success: false, error: 'Refresh token không hợp lệ hoặc đã hết hạn!' });
    }

    const user = (storedToken as any).user;
    if (!user || !user.is_active) {
      return res.status(401).json({ success: false, error: 'Tài khoản không tồn tại hoặc đã bị khóa!' });
    }

    // Revoke old refresh token (rotate)
    await storedToken.update({ revoked_at: new Date() });

    // Generate new access token
    const newAccessToken = generateAccessToken(user);

    // Generate new refresh token
    const { raw: newRefreshToken, hash: newRefreshTokenHash } = generateRefreshToken();
    await storeRefreshToken(user.id, newRefreshTokenHash, req);

    return res.status(200).json({
      success: true,
      message: 'Làm mới token thành công!',
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error: any) {
    console.error('Refresh Token Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra khi làm mới token!' });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, error: 'Vui lòng cung cấp refresh token!' });
    }

    // Hash the submitted token to match DB
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Revoke the refresh token
    const storedToken = await RefreshToken.findOne({
      where: { token_hash: tokenHash, revoked_at: null },
    });

    if (storedToken) {
      await storedToken.update({ revoked_at: new Date() });
    }

    return res.status(200).json({
      success: true,
      message: 'Đăng xuất thành công!',
    });
  } catch (error: any) {
    console.error('Logout Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra khi đăng xuất!' });
  }
};
