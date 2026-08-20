import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import express from 'express';
import cors from 'cors';

jest.mock('../models', () => {
  const mockFindOne = jest.fn();
  const mockFindByPk = jest.fn();
  const mockCreate = jest.fn();

  return {
    User: {
      findOne: mockFindOne,
      findByPk: mockFindByPk,
      create: mockCreate,
    },
    StudentProfile: {
      create: jest.fn(),
    },
    InstructorProfile: {
      create: jest.fn(),
    },
    RefreshToken: {
      create: jest.fn().mockResolvedValue({}),
      destroy: jest.fn().mockResolvedValue(1),
    },
    AuditLog: {
      create: jest.fn().mockResolvedValue({}),
    },
  };
});

jest.mock('../utils/email.util', () => ({
  sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
}));

import { User, StudentProfile, InstructorProfile } from '../models';
import authRoutes from '../routes/auth.routes';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/auth', authRoutes);

const JWT_SECRET = 'test_jwt_secret_key';

const mockUser = {
  id: 'uuid-student-1',
  email: 'student@test.com',
  username: 'student@123',
  full_name: 'Nguyen Van An',
  user_type: 'student',
  password_hash: bcrypt.hashSync('password123', 10),
  is_active: true,
  createdAt: new Date(),
  update: jest.fn().mockResolvedValue(true),
  toJSON: () => ({
    id: 'uuid-student-1',
    email: 'student@test.com',
    username: 'student@123',
    full_name: 'Nguyen Van An',
    user_type: 'student',
  }),
};

const mockInstructor = {
  id: 'uuid-instructor-1',
  email: 'instructor@test.com',
  username: 'instructor@456',
  full_name: 'Tran Thi Bich',
  user_type: 'instructor',
  password_hash: bcrypt.hashSync('password123', 10),
  is_active: true,
  createdAt: new Date(),
  update: jest.fn().mockResolvedValue(true),
  toJSON: () => ({
    id: 'uuid-instructor-1',
    email: 'instructor@test.com',
    username: 'instructor@456',
    full_name: 'Tran Thi Bich',
    user_type: 'instructor',
  }),
};

const generateToken = (user: typeof mockUser) => {
  return jwt.sign(
    { id: user.id, email: user.email, username: user.username, user_type: user.user_type },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
};

describe('Auth API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new student successfully', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);
      (User.create as jest.Mock).mockResolvedValue({
        id: mockUser.id,
        email: mockUser.email,
        username: mockUser.username,
        full_name: mockUser.full_name,
        user_type: mockUser.user_type,
      });
      (StudentProfile.create as jest.Mock).mockResolvedValue({ user_id: mockUser.id });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'student@test.com',
          password: 'password123',
          full_name: 'Nguyen Van An',
          user_type: 'student',
          grade_level: '12',
          school_name: 'THPT Le Quy Don',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Đăng ký tài khoản thành công!');
      expect(res.body.data).toHaveProperty('id', mockUser.id);
      expect(res.body.data).toHaveProperty('email', 'student@test.com');
      expect(res.body.data).toHaveProperty('user_type', 'student');
      expect(User.create).toHaveBeenCalled();
      expect(StudentProfile.create).toHaveBeenCalled();
    });

    it('should register a new instructor successfully', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);
      (User.create as jest.Mock).mockResolvedValue({
        id: mockInstructor.id,
        email: mockInstructor.email,
        username: mockInstructor.username,
        full_name: mockInstructor.full_name,
        user_type: mockInstructor.user_type,
      });
      (InstructorProfile.create as jest.Mock).mockResolvedValue({ user_id: mockInstructor.id });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'instructor@test.com',
          password: 'password123',
          full_name: 'Tran Thi Bich',
          user_type: 'instructor',
          expertise: 'Mathematics',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('user_type', 'instructor');
      expect(InstructorProfile.create).toHaveBeenCalled();
    });

    it('should return 400 if missing required fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@test.com' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Vui lòng cung cấp đầy đủ thông tin bắt buộc!');
    });

    it('should return 400 if user_type is invalid', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@test.com',
          password: 'password123',
          full_name: 'Test User',
          user_type: 'admin',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Vai trò người dùng không hợp lệ!');
    });

    it('should return 409 if email already exists', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'student@test.com',
          password: 'password123',
          full_name: 'Nguyen Van An',
          user_type: 'student',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Địa chỉ Email này đã được đăng ký!');
    });

    it('should generate unique username based on full_name', async () => {
      (User.findOne as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      (User.create as jest.Mock).mockResolvedValue({
        id: 'uuid-new',
        email: 'new@test.com',
        username: 'annv@123',
        full_name: 'Nguyen Van An',
        user_type: 'student',
      });
      (StudentProfile.create as jest.Mock).mockResolvedValue({});

      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'new@test.com',
          password: 'password123',
          full_name: 'Nguyen Van An',
          user_type: 'student',
        });

      expect(User.create).toHaveBeenCalledWith(
        expect.objectContaining({
          username: expect.stringMatching(/^annv@\d{3}$/),
        })
      );
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with email', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          usernameOrEmail: 'student@test.com',
          password: 'password123',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Đăng nhập thành công!');
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body.user).toHaveProperty('email', 'student@test.com');
    });

    it('should login successfully with username', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          usernameOrEmail: 'student@123',
          password: 'password123',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('accessToken');
    });

    it('should return 400 if missing credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ usernameOrEmail: 'test@test.com' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Vui lòng điền tài khoản và mật khẩu!');
    });

    it('should return 401 if user not found', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          usernameOrEmail: 'nonexistent@test.com',
          password: 'password123',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Tên tài khoản hoặc Email không chính xác!');
    });

    it('should return 403 if account is locked', async () => {
      const lockedUser = { ...mockUser, is_active: false };
      (User.findOne as jest.Mock).mockResolvedValue(lockedUser);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          usernameOrEmail: 'student@test.com',
          password: 'password123',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Tài khoản này hiện đang bị khóa!');
    });

    it('should return 401 if password is incorrect', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          usernameOrEmail: 'student@test.com',
          password: 'wrongpassword',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Mật khẩu đăng nhập không chính xác!');
    });

    it('should return valid JWT token', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          usernameOrEmail: 'student@test.com',
          password: 'password123',
        });

      const decoded = jwt.verify(res.body.accessToken, JWT_SECRET) as any;
      expect(decoded).toHaveProperty('id', mockUser.id);
      expect(decoded).toHaveProperty('email', mockUser.email);
      expect(decoded).toHaveProperty('user_type', mockUser.user_type);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return user info when authenticated', async () => {
      const token = generateToken(mockUser);
      const mockProfile = {
        date_of_birth: null,
        phone: '0123456789',
        address: 'HCM',
        school_name: 'THPT Le Quy Don',
        grade_level: '12',
        toJSON: () => ({
          date_of_birth: null,
          phone: '0123456789',
          address: 'HCM',
          school_name: 'THPT Le Quy Don',
          grade_level: '12',
        }),
      };
      const userWithProfile = {
        ...mockUser,
        studentProfile: mockProfile,
        instructorProfile: null,
      };
      (User.findByPk as jest.Mock).mockResolvedValue(userWithProfile);

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('email', 'student@test.com');
      expect(res.body.data).toHaveProperty('profile');
    });

    it('should return 401 if no token provided', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 403 if token is invalid', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalidtoken');

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should return 404 if user not found in DB', async () => {
      const token = generateToken(mockUser);
      (User.findByPk as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/auth/change-password', () => {
    it('should change password successfully', async () => {
      const token = generateToken(mockUser);
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

      const res = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          old_password: 'password123',
          new_password: 'newpassword123',
          confirm_password: 'newpassword123',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Đổi mật khẩu thành công!');
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app)
        .put('/api/auth/change-password')
        .send({
          old_password: 'password123',
          new_password: 'newpassword123',
          confirm_password: 'newpassword123',
        });

      expect(res.status).toBe(401);
    });

    it('should return 400 if missing fields', async () => {
      const token = generateToken(mockUser);

      const res = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({ old_password: 'password123' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Vui lòng cung cấp đầy đủ mật khẩu cũ, mật khẩu mới và xác nhận mật khẩu!');
    });

    it('should return 400 if new password too short', async () => {
      const token = generateToken(mockUser);

      const res = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          old_password: 'password123',
          new_password: '123',
          confirm_password: '123',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Mật khẩu mới phải có tối thiểu 6 ký tự!');
    });

    it('should return 400 if new password equals old password', async () => {
      const token = generateToken(mockUser);

      const res = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          old_password: 'password123',
          new_password: 'password123',
          confirm_password: 'password123',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Mật khẩu mới phải khác mật khẩu cũ!');
    });

    it('should return 400 if confirm password does not match', async () => {
      const token = generateToken(mockUser);

      const res = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          old_password: 'password123',
          new_password: 'newpassword123',
          confirm_password: 'differentpassword',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Xác nhận mật khẩu không khớp!');
    });

    it('should return 401 if old password is incorrect', async () => {
      const token = generateToken(mockUser);
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

      const res = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          old_password: 'wrongoldpassword',
          new_password: 'newpassword123',
          confirm_password: 'newpassword123',
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Mật khẩu cũ không chính xác!');
    });
  });
});
