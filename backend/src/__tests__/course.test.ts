import request from 'supertest';
import jwt from 'jsonwebtoken';
import express from 'express';
import cors from 'cors';

const mockCourseFindAndCountAll = jest.fn();
const mockCourseFindOne = jest.fn();
const mockCourseFindByPk = jest.fn();
const mockCourseCreate = jest.fn();
const mockCategoryFindAll = jest.fn();
const mockEnrollmentFindOne = jest.fn();
const mockCourseInstructorFindOne = jest.fn();
const mockCourseInstructorCreate = jest.fn();

jest.mock('../config/database', () => ({
  sequelize: {
    query: jest.fn(),
  },
}));

jest.mock('../models', () => ({
  Course: {
    findAndCountAll: mockCourseFindAndCountAll,
    findByPk: mockCourseFindByPk,
    findOne: mockCourseFindOne,
    create: mockCourseCreate,
  },
  Category: {
    findAll: mockCategoryFindAll,
  },
  CourseInstructor: {
    findOne: mockCourseInstructorFindOne,
    create: mockCourseInstructorCreate,
  },
  User: {},
  Lesson: {},
  CourseMaterial: {},
  Enrollment: {
    findOne: mockEnrollmentFindOne,
  },
}));

import { Course, Category, CourseInstructor, Enrollment } from '../models';
import { sequelize } from '../config/database';
import courseRoutes from '../routes/course.routes';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/courses', courseRoutes);

const JWT_SECRET = 'test_jwt_secret_key';

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

const mockStudent = {
  id: 'uuid-student-1',
  email: 'student@test.com',
  username: 'student@123',
  full_name: 'Nguyen Van An',
  user_type: 'student',
};

const mockCategory = {
  id: 'uuid-category-1',
  name: 'Programming',
  slug: 'programming',
  is_active: true,
  sort_order: 1,
};

const mockCourse = {
  id: 'uuid-course-1',
  title: 'Node.js Basics',
  slug: 'nodejs-basics',
  category_id: 'uuid-category-1',
  short_description: 'Learn Node.js from scratch',
  description: 'Full Node.js course',
  price: 299000,
  sale_price: 199000,
  target_level: 'beginner',
  language: 'vi',
  is_published: true,
  published_at: new Date(),
  total_students: 10,
  rating_avg: 4.5,
  created_at: new Date(),
  update: jest.fn().mockResolvedValue(true),
  destroy: jest.fn().mockResolvedValue(true),
  toJSON: () => ({
    id: 'uuid-course-1',
    title: 'Node.js Basics',
    slug: 'nodejs-basics',
    category_id: 'uuid-category-1',
    price: 299000,
    is_published: true,
  }),
};

const mockLesson = {
  id: 'uuid-lesson-1',
  course_id: 'uuid-course-1',
  title: 'Introduction',
  sort_order: 1,
  lesson_type: 'video',
  duration_minutes: 15,
  is_preview: true,
  is_published: true,
};

const generateToken = (user: { id: string; email: string; username: string; user_type: string }) => {
  return jwt.sign(
    { id: user.id, email: user.email, username: user.username, user_type: user.user_type },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
};

describe('Course API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/courses', () => {
    it('should return list of published courses', async () => {
      mockCourseFindAndCountAll.mockResolvedValue({
        count: 1,
        rows: [mockCourse],
      });

      const res = await request(app).get('/api/courses');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.pagination).toHaveProperty('total', 1);
    });

    it('should filter by category_id', async () => {
      mockCourseFindAndCountAll.mockResolvedValue({
        count: 1,
        rows: [mockCourse],
      });

      const res = await request(app)
        .get('/api/courses')
        .query({ category_id: 'uuid-category-1' });

      expect(res.status).toBe(200);
      expect(mockCourseFindAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ category_id: 'uuid-category-1' }),
        })
      );
    });

    it('should filter by target_level', async () => {
      mockCourseFindAndCountAll.mockResolvedValue({
        count: 1,
        rows: [mockCourse],
      });

      const res = await request(app)
        .get('/api/courses')
        .query({ target_level: 'beginner' });

      expect(res.status).toBe(200);
      expect(mockCourseFindAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ target_level: 'beginner' }),
        })
      );
    });

    it('should sort by newest', async () => {
      mockCourseFindAndCountAll.mockResolvedValue({
        count: 1,
        rows: [mockCourse],
      });

      const res = await request(app)
        .get('/api/courses')
        .query({ sort: 'newest' });

      expect(res.status).toBe(200);
      expect(mockCourseFindAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          order: [['created_at', 'DESC']],
        })
      );
    });

    it('should sort by price_asc', async () => {
      mockCourseFindAndCountAll.mockResolvedValue({
        count: 1,
        rows: [mockCourse],
      });

      await request(app).get('/api/courses').query({ sort: 'price_asc' });

      expect(mockCourseFindAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          order: [['price', 'ASC']],
        })
      );
    });

    it('should sort by popular', async () => {
      mockCourseFindAndCountAll.mockResolvedValue({
        count: 1,
        rows: [mockCourse],
      });

      await request(app).get('/api/courses').query({ sort: 'popular' });

      expect(mockCourseFindAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          order: [['total_students', 'DESC']],
        })
      );
    });

    it('should use FULLTEXT search when search param provided', async () => {
      const mockResults = [{ id: 'uuid-course-1', title: 'Node.js Basics' }];
      (sequelize.query as jest.Mock)
        .mockResolvedValueOnce([mockResults])
        .mockResolvedValueOnce([{ total: 1 }]);

      const res = await request(app)
        .get('/api/courses')
        .query({ search: 'nodejs' });

      expect(res.status).toBe(200);
      expect(sequelize.query).toHaveBeenCalledWith(
        expect.stringContaining('MATCH(title, short_description) AGAINST'),
        expect.objectContaining({
          replacements: expect.objectContaining({ search: 'nodejs*' }),
        })
      );
    });

    it('should handle pagination correctly', async () => {
      mockCourseFindAndCountAll.mockResolvedValue({
        count: 50,
        rows: [mockCourse],
      });

      const res = await request(app)
        .get('/api/courses')
        .query({ page: '2', limit: '10' });

      expect(res.status).toBe(200);
      expect(res.body.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 50,
        totalPages: 5,
      });
    });
  });

  describe('GET /api/courses/:id', () => {
    it('should return course details with lessons and materials', async () => {
      const courseWithIncludes = {
        ...mockCourse,
        category: mockCategory,
        instructors: [mockInstructor],
        lessons: [mockLesson],
        materials: [],
        toJSON: () => ({
          ...mockCourse.toJSON(),
          category: mockCategory,
          instructors: [mockInstructor],
          lessons: [mockLesson],
          materials: [],
        }),
      };
      mockCourseFindByPk.mockResolvedValue(courseWithIncludes);

      const res = await request(app).get('/api/courses/uuid-course-1');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id', 'uuid-course-1');
      expect(res.body.data).toHaveProperty('is_enrolled', false);
    });

    it.skip('should show enrollment status when user is authenticated', async () => {
      const token = generateToken(mockStudent);
      const courseWithIncludes = {
        ...mockCourse,
        category: mockCategory,
        instructors: [],
        lessons: [],
        materials: [],
        toJSON: () => ({
          ...mockCourse.toJSON(),
          category: mockCategory,
          instructors: [],
          lessons: [],
          materials: [],
        }),
      };
      mockCourseFindByPk.mockResolvedValue(courseWithIncludes);
      mockEnrollmentFindOne.mockResolvedValue({
        status: 'active',
        progress_percentage: 50,
      });

      const res = await request(app)
        .get('/api/courses/uuid-course-1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(mockEnrollmentFindOne).toHaveBeenCalled();
      expect(res.body.data).toHaveProperty('is_enrolled', true);
      expect(res.body.data.enrollment).toHaveProperty('progress_percentage', 50);
    });

    it('should return 404 if course not found', async () => {
      mockCourseFindByPk.mockResolvedValue(null);

      const res = await request(app).get('/api/courses/nonexistent-id');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Không tìm thấy khóa học!');
    });
  });

  describe('POST /api/courses', () => {
    it('should create a new course when instructor', async () => {
      const token = generateToken(mockInstructor);
      mockCourseFindOne.mockResolvedValue(null);
      mockCourseCreate.mockResolvedValue({
        id: 'uuid-course-1',
        title: 'Node.js Basics',
        slug: 'nodejs-basics',
      });
      mockCourseInstructorCreate.mockResolvedValue({});

      const res = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Node.js Basics',
          category_id: 'uuid-category-1',
          short_description: 'Learn Node.js',
          price: 299000,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Tạo khóa học thành công!');
      expect(mockCourseCreate).toHaveBeenCalled();
      expect(mockCourseInstructorCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          course_id: 'uuid-course-1',
          instructor_id: mockInstructor.id,
          is_primary: true,
        })
      );
    });

    it('should create a new course when admin', async () => {
      const token = generateToken(mockAdmin);
      mockCourseFindOne.mockResolvedValue(null);
      mockCourseCreate.mockResolvedValue({
        id: 'uuid-course-2',
        title: 'Admin Course',
        slug: 'admin-course',
      });
      mockCourseInstructorCreate.mockResolvedValue({});

      const res = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Admin Course' });

      expect(res.status).toBe(201);
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app)
        .post('/api/courses')
        .send({ title: 'Node.js Basics' });

      expect(res.status).toBe(401);
    });

    it('should return 403 if student tries to create', async () => {
      const token = generateToken(mockStudent);

      const res = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Node.js Basics' });

      expect(res.status).toBe(403);
    });

    it('should return 400 if title is missing', async () => {
      const token = generateToken(mockInstructor);

      const res = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${token}`)
        .send({ price: 299000 });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Vui lòng nhập tên khóa học!');
    });

    it('should generate unique slug from title', async () => {
      const token = generateToken(mockInstructor);
      mockCourseFindOne.mockResolvedValue(null);
      mockCourseCreate.mockResolvedValue({
        id: 'uuid-course-1',
        title: 'Node.js Basics',
        slug: 'nodejs-basics',
      });
      mockCourseInstructorCreate.mockResolvedValue({});

      await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Node.js Basics' });

      expect(mockCourseCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          slug: expect.stringContaining('nodejs-basics'),
        })
      );
    });
  });

  describe('PUT /api/courses/:id', () => {
    it('should update course when owner instructor', async () => {
      const token = generateToken(mockInstructor);
      mockCourseFindByPk.mockResolvedValue(mockCourse);
      mockCourseInstructorFindOne.mockResolvedValue({ instructor_id: mockInstructor.id });

      const res = await request(app)
        .put('/api/courses/uuid-course-1')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Updated Title', price: 399000 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Cập nhật khóa học thành công!');
    });

    it('should update course when admin', async () => {
      const token = generateToken(mockAdmin);
      mockCourseFindByPk.mockResolvedValue(mockCourse);

      const res = await request(app)
        .put('/api/courses/uuid-course-1')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Updated Title' });

      expect(res.status).toBe(200);
    });

    it('should return 404 if course not found', async () => {
      const token = generateToken(mockAdmin);
      mockCourseFindByPk.mockResolvedValue(null);

      const res = await request(app)
        .put('/api/courses/nonexistent-id')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Updated Title' });

      expect(res.status).toBe(404);
    });

    it('should return 403 if non-owner instructor tries to update', async () => {
      const token = generateToken(mockInstructor);
      mockCourseFindByPk.mockResolvedValue(mockCourse);
      mockCourseInstructorFindOne.mockResolvedValue(null);

      const res = await request(app)
        .put('/api/courses/uuid-course-1')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Updated Title' });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Bạn không có quyền chỉnh sửa khóa học này!');
    });
  });

  describe('DELETE /api/courses/:id', () => {
    it('should soft delete course when admin', async () => {
      const token = generateToken(mockAdmin);
      mockCourseFindByPk.mockResolvedValue(mockCourse);

      const res = await request(app)
        .delete('/api/courses/uuid-course-1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Xóa khóa học thành công!');
      expect(mockCourse.destroy).toHaveBeenCalled();
    });

    it('should return 403 if instructor tries to delete', async () => {
      const token = generateToken(mockInstructor);
      mockCourseFindByPk.mockResolvedValue(mockCourse);

      const res = await request(app)
        .delete('/api/courses/uuid-course-1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });

    it('should return 403 if student tries to delete', async () => {
      const token = generateToken(mockStudent);

      const res = await request(app)
        .delete('/api/courses/uuid-course-1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });

    it('should return 404 if course not found', async () => {
      const token = generateToken(mockAdmin);
      mockCourseFindByPk.mockResolvedValue(null);

      const res = await request(app)
        .delete('/api/courses/nonexistent-id')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/courses/instructor/me', () => {
    it('should return instructor courses', async () => {
      const token = generateToken(mockInstructor);
      mockCourseFindAndCountAll.mockResolvedValue({
        count: 1,
        rows: [mockCourse],
      });

      const res = await request(app)
        .get('/api/courses/instructor/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app).get('/api/courses/instructor/me');

      expect(res.status).toBe(401);
    });

    it('should return 403 if student tries to access', async () => {
      const token = generateToken(mockStudent);

      const res = await request(app)
        .get('/api/courses/instructor/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });

    it('should filter by status=published', async () => {
      const token = generateToken(mockInstructor);
      mockCourseFindAndCountAll.mockResolvedValue({
        count: 1,
        rows: [mockCourse],
      });

      await request(app)
        .get('/api/courses/instructor/me')
        .set('Authorization', `Bearer ${token}`)
        .query({ status: 'published' });

      expect(mockCourseFindAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ is_published: true }),
        })
      );
    });
  });

  describe('GET /api/courses/categories', () => {
    it('should return active categories', async () => {
      mockCategoryFindAll.mockResolvedValue([mockCategory]);

      const res = await request(app).get('/api/courses/categories');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
    });

    it('should include children categories', async () => {
      mockCategoryFindAll.mockResolvedValue([mockCategory]);

      await request(app).get('/api/courses/categories');

      expect(mockCategoryFindAll).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.arrayContaining([
            expect.objectContaining({
              model: Category,
              as: 'children',
            }),
          ]),
        })
      );
    });
  });
});
