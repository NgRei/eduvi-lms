import { Response } from 'express';
import { Op } from 'sequelize';
import bcrypt from 'bcryptjs';
import { User, StudentProfile, InstructorProfile, Course, Enrollment } from '../models';
import { AuthRequest } from '../middlewares/auth.middleware';

// GET /api/admin/users
export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const {
      page = '1',
      limit = '20',
      user_type,
      is_active,
      search,
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const where: any = {};
    if (user_type) where.user_type = user_type;
    if (is_active !== undefined) where.is_active = is_active === 'true';
    if (search) {
      where[Op.or] = [
        { full_name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }

    const { rows: users, count: total } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password_hash', 'reset_password_token', 'reset_password_expires'] },
      include: [
        { model: StudentProfile, as: 'studentProfile', required: false },
        { model: InstructorProfile, as: 'instructorProfile', required: false },
      ],
      order: [['created_at', 'DESC']],
      limit: limitNum,
      offset,
      distinct: true,
    });

    return res.status(200).json({
      success: true,
      data: users,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (error: any) {
    console.error('getUsers Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra khi lấy danh sách người dùng!' });
  }
};

// GET /api/admin/users/:id
export const getUserById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id, {
      attributes: { exclude: ['password_hash', 'reset_password_token', 'reset_password_expires'] },
      include: [
        { model: StudentProfile, as: 'studentProfile', required: false },
        { model: InstructorProfile, as: 'instructorProfile', required: false },
      ],
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy người dùng!' });
    }

    return res.status(200).json({ success: true, data: user });
  } catch (error: any) {
    console.error('getUserById Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra!' });
  }
};

// POST /api/admin/users
export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, full_name, user_type, phone, school_name, expertise } = req.body;

    if (!email || !password || !full_name || !user_type) {
      return res.status(400).json({ success: false, error: 'Vui lòng điền đầy đủ thông tin!' });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ success: false, error: 'Email đã tồn tại!' });
    }

    // Generate username from full_name
    const words = full_name.trim().split(/\s+/);
    const lastWord = words[words.length - 1].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');
    const initials = words.slice(0, -1).map((w: string) => w[0].toLowerCase()).join('');
    const username = `${lastWord}${initials}${Math.floor(Math.random() * 1000)}`;

    const password_hash = await bcrypt.hash(password, 12);

    const user = await User.create({
      email,
      username,
      password_hash,
      full_name,
      user_type,
      is_active: true,
    });

    // Create profile
    if (user_type === 'student') {
      await StudentProfile.create({ user_id: user.id, phone, school_name });
    } else if (user_type === 'instructor') {
      await InstructorProfile.create({ user_id: user.id, expertise });
    }

    const { password_hash: _, ...userData } = user.toJSON();
    return res.status(201).json({ success: true, message: 'Tạo người dùng thành công!', data: userData });
  } catch (error: any) {
    console.error('createUser Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra khi tạo người dùng!' });
  }
};

// PUT /api/admin/users/:id
export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { full_name, email, user_type } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy người dùng!' });
    }

    await user.update({ full_name, email, user_type });

    const { password_hash: _, ...userData } = user.toJSON();
    return res.status(200).json({ success: true, data: userData });
  } catch (error: any) {
    console.error('updateUser Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra!' });
  }
};

// PUT /api/admin/users/:id/status
export const updateUserStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy người dùng!' });
    }

    await user.update({ is_active });
    return res.status(200).json({ success: true, message: 'Cập nhật trạng thái thành công!' });
  } catch (error: any) {
    console.error('updateUserStatus Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra!' });
  }
};

// DELETE /api/admin/users/:id
export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy người dùng!' });
    }

    await user.update({ is_active: false });
    return res.status(200).json({ success: true, message: 'Xóa người dùng thành công!' });
  } catch (error: any) {
    console.error('deleteUser Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra!' });
  }
};

// GET /api/admin/dashboard
export const getAdminDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const [totalStudents, totalInstructors, totalCourses, activeCourses, totalEnrollments, recentUsers] =
      await Promise.all([
        User.count({ where: { user_type: 'student' } }),
        User.count({ where: { user_type: 'instructor' } }),
        Course.count(),
        Course.count({ where: { is_published: true } }),
        Enrollment.count(),
        User.findAll({
          attributes: ['id', 'full_name', 'email', 'user_type', 'created_at'],
          order: [['created_at', 'DESC']],
          limit: 10,
        }),
      ]);

    return res.status(200).json({
      success: true,
      data: {
        totalStudents,
        totalInstructors,
        totalCourses,
        activeCourses,
        totalEnrollments,
        recentUsers,
      },
    });
  } catch (error: any) {
    console.error('getAdminDashboard Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra!' });
  }
};
