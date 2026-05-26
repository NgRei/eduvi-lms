import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import { User, StudentProfile, InstructorProfile } from '../models';
import { AuthRequest } from '../middlewares/auth.middleware';

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

    // Sign JWT
    const jwtSecret = process.env.JWT_SECRET || 'eduvi_lms_jwt_secret_key_2026_super_secure';
    const jwtExpires = process.env.JWT_EXPIRES_IN || '1h';

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        username: user.username,
        user_type: user.user_type,
      },
      jwtSecret,
      { expiresIn: jwtExpires } as jwt.SignOptions
    );

    return res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công!',
      token,
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

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Chưa xác thực người dùng!' });
    }

    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'email', 'username', 'full_name', 'user_type', 'is_active', 'created_at'],
      include: [
        { model: StudentProfile, as: 'studentProfile', attributes: ['grade_level', 'school_name'] },
        { model: InstructorProfile, as: 'instructorProfile', attributes: ['expertise', 'experience_years'] }
      ]
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy thông tin tài khoản!' });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    console.error('getMe Error:', error);
    return res.status(500).json({ success: false, error: 'Lỗi nạp thông tin tài khoản!' });
  }
};
