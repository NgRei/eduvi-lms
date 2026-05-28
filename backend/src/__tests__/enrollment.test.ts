import request from 'supertest';
import jwt from 'jsonwebtoken';
import express from 'express';
import cors from 'cors';

const mockEnrollmentFindOne = jest.fn();
const mockEnrollmentFindByPk = jest.fn();
const mockEnrollmentCreate = jest.fn();
const mockEnrollmentFindAndCountAll = jest.fn();
const mockEnrollmentCount = jest.fn();
const mockCourseFindOne = jest.fn();
const mockCourseFindByPk = jest.fn();
const mockCourseUpdate = jest.fn();

jest.mock('../models', () => ({
  Enrollment: {
    findOne: mockEnrollmentFindOne,
    findByPk: mockEnrollmentFindByPk,
    create: mockEnrollmentCreate,
    findAndCountAll: mockEnrollmentFindAndCountAll,
    count: mockEnrollmentCount,
  },
  Course: {
    findOne: mockCourseFindOne,
    findByPk: mockCourseFindByPk,
  },
  User: {},
  Lesson: {},
  LessonProgress: {},
}));

import enrollmentRoutes from '../routes/enrollment.routes';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/enrollments', enrollmentRoutes);

const JWT_SECRET = 'test_jwt_secret_key';

const mockStudent = {
  id: 'uuid-student-1',
  email: 'student@test.com',
  username: 'student@123',
  full_name: 'Nguyen Van An',
  user_type: 'student',
};

const mockInstructor = {
  id: 'uuid-instructor-1',
  email: 'instructor@test.com',
  username: 'instructor@456',
  full_name: 'Tran Thi Bich',
  user_type: 'instructor',
};

const mockAdmin = {
  id: 'uuid-admin-1',
  email: 'admin@test.com',
  username: 'admin@789',
  full_name: 'Admin User',
  user_type: 'admin',
};

const mockCourse = {
  id: 'uuid-course-1',
  title: 'Node.js Basics',
  slug: 'nodejs-basics',
  is_published: true,
  max_students: 50,
  total_students: 10,
  update: jest.fn().mockResolvedValue(true),
};

const mockEnrollment = {
  id: 'uuid-enrollment-1',
  user_id: 'uuid-student-1',
  course_id: 'uuid-course-1',
  status: 'active',
  progress_percentage: 0,
  enrolled_at: new Date(),
  update: jest.fn().mockResolvedValue(true),
  toJSON: () => ({
    id: 'uuid-enrollment-1',
    user_id: 'uuid-student-1',
    course_id: 'uuid-course-1',
    status: 'active',
    progress_percentage: 0,
  }),
};

const generateToken = (user: { id: string; email: string; username: string; user_type: string }) => {
  return jwt.sign(
    { id: user.id, email: user.email, username: user.username, user_type: user.user_type },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
};

describe('Enrollment API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/enrollments', () => {
    it('should enroll student to course successfully', async () => {
      const token = generateToken(mockStudent);
      mockCourseFindOne.mockResolvedValue(mockCourse);
      mockEnrollmentFindOne.mockResolvedValue(null);
      mockEnrollmentCreate.mockResolvedValue(mockEnrollment);
      mockEnrollmentCount.mockResolvedValue(10);

      const res = await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${token}`)
        .send({ course_id: 'uuid-course-1' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Đăng ký khóa học thành công!');
      expect(mockEnrollmentCreate).toHaveBeenCalled();
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app)
        .post('/api/enrollments')
        .send({ course_id: 'uuid-course-1' });

      expect(res.status).toBe(401);
    });

    it('should return 403 if instructor tries to enroll', async () => {
      const token = generateToken(mockInstructor);

      const res = await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${token}`)
        .send({ course_id: 'uuid-course-1' });

      expect(res.status).toBe(403);
    });

    it('should return 400 if course_id is missing', async () => {
      const token = generateToken(mockStudent);

      const res = await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Vui lòng cung cấp course_id!');
    });

    it('should return 404 if course not found or not published', async () => {
      const token = generateToken(mockStudent);
      mockCourseFindOne.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${token}`)
        .send({ course_id: 'nonexistent-id' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Không tìm thấy khóa học hoặc khóa học chưa được xuất bản!');
    });

    it('should return 409 if already enrolled', async () => {
      const token = generateToken(mockStudent);
      mockCourseFindOne.mockResolvedValue(mockCourse);
      mockEnrollmentFindOne.mockResolvedValue(mockEnrollment);

      const res = await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${token}`)
        .send({ course_id: 'uuid-course-1' });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('Bạn đã đăng ký khóa học này rồi!');
    });

    it('should re-enroll if previously dropped', async () => {
      const token = generateToken(mockStudent);
      const droppedEnrollment = {
        ...mockEnrollment,
        status: 'dropped',
        update: jest.fn().mockResolvedValue(true),
      };
      mockCourseFindOne.mockResolvedValue(mockCourse);
      mockEnrollmentFindOne.mockResolvedValue(droppedEnrollment);

      const res = await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${token}`)
        .send({ course_id: 'uuid-course-1' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Đăng ký lại khóa học thành công!');
      expect(droppedEnrollment.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'active', progress_percentage: 0 })
      );
    });

    it('should return 400 if course reached max students', async () => {
      const token = generateToken(mockStudent);
      const fullCourse = { ...mockCourse, max_students: 10 };
      mockCourseFindOne.mockResolvedValue(fullCourse);
      mockEnrollmentFindOne.mockResolvedValue(null);
      mockEnrollmentCount.mockResolvedValue(10);

      const res = await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${token}`)
        .send({ course_id: 'uuid-course-1' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Khóa học đã đạt số lượng học viên tối đa!');
    });

    it('should update total_students count after enrollment', async () => {
      const token = generateToken(mockStudent);
      const courseWithUpdate = { ...mockCourse, update: jest.fn().mockResolvedValue(true) };
      mockCourseFindOne.mockResolvedValue(courseWithUpdate);
      mockEnrollmentFindOne.mockResolvedValue(null);
      mockEnrollmentCreate.mockResolvedValue(mockEnrollment);
      mockEnrollmentCount.mockResolvedValue(10);

      await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${token}`)
        .send({ course_id: 'uuid-course-1' });

      expect(courseWithUpdate.update).toHaveBeenCalledWith(
        expect.objectContaining({ total_students: 11 })
      );
    });
  });

  describe('DELETE /api/enrollments/:id', () => {
    it('should unenroll successfully', async () => {
      const token = generateToken(mockStudent);
      mockEnrollmentFindByPk.mockResolvedValue(mockEnrollment);
      mockCourseFindByPk.mockResolvedValue(mockCourse);

      const res = await request(app)
        .delete('/api/enrollments/uuid-enrollment-1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Hủy đăng ký khóa học thành công!');
      expect(mockEnrollment.update).toHaveBeenCalledWith({ status: 'dropped' });
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app)
        .delete('/api/enrollments/uuid-enrollment-1');

      expect(res.status).toBe(401);
    });

    it('should return 404 if enrollment not found', async () => {
      const token = generateToken(mockStudent);
      mockEnrollmentFindByPk.mockResolvedValue(null);

      const res = await request(app)
        .delete('/api/enrollments/nonexistent-id')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });

    it('should return 403 if not owner and not admin', async () => {
      const token = generateToken(mockStudent);
      const otherEnrollment = { ...mockEnrollment, user_id: 'other-user-id' };
      mockEnrollmentFindByPk.mockResolvedValue(otherEnrollment);

      const res = await request(app)
        .delete('/api/enrollments/uuid-enrollment-1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });

    it('should allow admin to unenroll', async () => {
      const token = generateToken(mockAdmin);
      mockEnrollmentFindByPk.mockResolvedValue(mockEnrollment);
      mockCourseFindByPk.mockResolvedValue(mockCourse);

      const res = await request(app)
        .delete('/api/enrollments/uuid-enrollment-1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });

    it('should return 400 if already dropped', async () => {
      const token = generateToken(mockStudent);
      const droppedEnrollment = { ...mockEnrollment, status: 'dropped' };
      mockEnrollmentFindByPk.mockResolvedValue(droppedEnrollment);

      const res = await request(app)
        .delete('/api/enrollments/uuid-enrollment-1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Đăng ký này đã được hủy trước đó!');
    });

    it('should decrease total_students after unenroll', async () => {
      const token = generateToken(mockStudent);
      const courseWithUpdate = { ...mockCourse, total_students: 10, update: jest.fn().mockResolvedValue(true) };
      mockEnrollmentFindByPk.mockResolvedValue(mockEnrollment);
      mockCourseFindByPk.mockResolvedValue(courseWithUpdate);

      await request(app)
        .delete('/api/enrollments/uuid-enrollment-1')
        .set('Authorization', `Bearer ${token}`);

      expect(courseWithUpdate.update).toHaveBeenCalledWith(
        expect.objectContaining({ total_students: 9 })
      );
    });
  });

  describe('GET /api/enrollments/me', () => {
    it('should return student enrollments', async () => {
      const token = generateToken(mockStudent);
      mockEnrollmentFindAndCountAll.mockResolvedValue({
        count: 1,
        rows: [mockEnrollment],
      });

      const res = await request(app)
        .get('/api/enrollments/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.pagination).toHaveProperty('total', 1);
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app).get('/api/enrollments/me');

      expect(res.status).toBe(401);
    });

    it('should return 403 if instructor tries to access', async () => {
      const token = generateToken(mockInstructor);

      const res = await request(app)
        .get('/api/enrollments/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });

    it('should exclude dropped enrollments by default', async () => {
      const token = generateToken(mockStudent);
      mockEnrollmentFindAndCountAll.mockResolvedValue({
        count: 1,
        rows: [mockEnrollment],
      });

      await request(app)
        .get('/api/enrollments/me')
        .set('Authorization', `Bearer ${token}`);

      expect(mockEnrollmentFindAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { [Symbol.for('ne')]: 'dropped' },
          }),
        })
      );
    });

    it('should filter by status if provided', async () => {
      const token = generateToken(mockStudent);
      mockEnrollmentFindAndCountAll.mockResolvedValue({
        count: 0,
        rows: [],
      });

      await request(app)
        .get('/api/enrollments/me')
        .set('Authorization', `Bearer ${token}`)
        .query({ status: 'completed' });

      expect(mockEnrollmentFindAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'completed' }),
        })
      );
    });

    it('should handle pagination', async () => {
      const token = generateToken(mockStudent);
      mockEnrollmentFindAndCountAll.mockResolvedValue({
        count: 25,
        rows: [mockEnrollment],
      });

      const res = await request(app)
        .get('/api/enrollments/me')
        .set('Authorization', `Bearer ${token}`)
        .query({ page: '2', limit: '10' });

      expect(res.status).toBe(200);
      expect(res.body.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3,
      });
    });
  });

  describe('GET /api/enrollments/check/:courseId', () => {
    it('should return enrolled status', async () => {
      const token = generateToken(mockStudent);
      mockEnrollmentFindOne.mockResolvedValue(mockEnrollment);

      const res = await request(app)
        .get('/api/enrollments/check/uuid-course-1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.enrolled).toBe(true);
      expect(res.body.data.enrollment).toHaveProperty('status', 'active');
    });

    it('should return not enrolled if no enrollment found', async () => {
      const token = generateToken(mockStudent);
      mockEnrollmentFindOne.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/enrollments/check/uuid-course-1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.enrolled).toBe(false);
      expect(res.body.data.enrollment).toBeNull();
    });

    it('should return not enrolled if status is dropped', async () => {
      const token = generateToken(mockStudent);
      const droppedEnrollment = { ...mockEnrollment, status: 'dropped' };
      mockEnrollmentFindOne.mockResolvedValue(droppedEnrollment);

      const res = await request(app)
        .get('/api/enrollments/check/uuid-course-1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.enrolled).toBe(false);
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app)
        .get('/api/enrollments/check/uuid-course-1');

      expect(res.status).toBe(401);
    });
  });
});
