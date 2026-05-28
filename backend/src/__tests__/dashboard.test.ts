import request from 'supertest';
import jwt from 'jsonwebtoken';
import express from 'express';
import cors from 'cors';

const mockEnrollmentCount = jest.fn();
const mockEnrollmentFindAll = jest.fn();
const mockLessonProgressCount = jest.fn();
const mockLessonProgressSum = jest.fn();
const mockLessonProgressFindAll = jest.fn();
const mockCourseFindAll = jest.fn();
const mockCourseInstructorFindAll = jest.fn();

jest.mock('../models', () => ({
  Enrollment: {
    count: mockEnrollmentCount,
    findAll: mockEnrollmentFindAll,
  },
  LessonProgress: {
    count: mockLessonProgressCount,
    sum: mockLessonProgressSum,
    findAll: mockLessonProgressFindAll,
  },
  Course: {
    findAll: mockCourseFindAll,
  },
  CourseInstructor: {
    findAll: mockCourseInstructorFindAll,
  },
  User: {},
  Lesson: {},
}));

import dashboardRoutes from '../routes/dashboard.routes';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/dashboard', dashboardRoutes);

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

const generateToken = (user: { id: string; email: string; username: string; user_type: string }) => {
  return jwt.sign(
    { id: user.id, email: user.email, username: user.username, user_type: user.user_type },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
};

describe('Dashboard API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/dashboard/student', () => {
    it('should return student dashboard data', async () => {
      const token = generateToken(mockStudent);
      mockEnrollmentCount
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(2);
      mockEnrollmentFindAll.mockResolvedValue([
        {
          id: 'enrollment-1',
          course_id: 'course-1',
          progress_percentage: 50,
          updated_at: new Date(),
          course: {
            id: 'course-1',
            title: 'Node.js Basics',
            slug: 'nodejs-basics',
            thumbnail: null,
            total_lessons: 10,
            rating_avg: 4.5,
            instructors: [{ full_name: 'Instructor 1' }],
          },
        },
      ]);
      mockLessonProgressFindAll.mockResolvedValue([
        {
          lesson_id: 'lesson-1',
          is_completed: true,
          last_position: 0,
          updated_at: new Date(),
          lesson: {
            id: 'lesson-1',
            title: 'Introduction',
            lesson_type: 'video',
            course_id: 'course-1',
          },
        },
      ]);
      mockLessonProgressCount.mockResolvedValue(8);
      mockLessonProgressSum.mockResolvedValue(3600);

      const res = await request(app)
        .get('/api/dashboard/student')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('stats');
      expect(res.body.data).toHaveProperty('recent_courses');
      expect(res.body.data).toHaveProperty('recent_activity');
      expect(res.body.data.stats).toHaveProperty('total_enrollments', 5);
      expect(res.body.data.stats).toHaveProperty('active_courses', 3);
      expect(res.body.data.stats).toHaveProperty('completed_courses', 2);
      expect(res.body.data.stats).toHaveProperty('lessons_completed', 8);
      expect(res.body.data.stats).toHaveProperty('watch_minutes', 60);
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app).get('/api/dashboard/student');

      expect(res.status).toBe(401);
    });

    it('should return 403 if instructor tries to access', async () => {
      const token = generateToken(mockInstructor);

      const res = await request(app)
        .get('/api/dashboard/student')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });

    it('should handle zero enrollments', async () => {
      const token = generateToken(mockStudent);
      mockEnrollmentCount
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      mockEnrollmentFindAll.mockResolvedValue([]);
      mockLessonProgressFindAll.mockResolvedValue([]);
      mockLessonProgressCount.mockResolvedValue(0);
      mockLessonProgressSum.mockResolvedValue(0);

      const res = await request(app)
        .get('/api/dashboard/student')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.stats).toHaveProperty('overall_progress', 0);
    });
  });

  describe('GET /api/dashboard/instructor', () => {
    it('should return instructor dashboard data', async () => {
      const token = generateToken(mockInstructor);
      mockCourseInstructorFindAll.mockResolvedValue([
        { course_id: 'course-1' },
        { course_id: 'course-2' },
      ]);
      mockEnrollmentCount
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(40);
      mockCourseFindAll.mockResolvedValue([
        {
          id: 'course-1',
          title: 'Node.js Basics',
          slug: 'nodejs-basics',
          thumbnail: null,
          total_students: 30,
          rating_avg: 4.5,
          is_published: true,
          courseInstructors: [{ is_primary: true }],
        },
        {
          id: 'course-2',
          title: 'Express.js',
          slug: 'expressjs',
          thumbnail: null,
          total_students: 20,
          rating_avg: 4.0,
          is_published: false,
          courseInstructors: [{ is_primary: false }],
        },
      ]);
      mockEnrollmentFindAll.mockResolvedValue([
        {
          id: 'enrollment-1',
          status: 'active',
          progress_percentage: 50,
          enrolled_at: new Date(),
          user: {
            id: 'student-1',
            full_name: 'Student 1',
            email: 'student1@test.com',
            username: 'student1',
          },
          course: {
            id: 'course-1',
            title: 'Node.js Basics',
          },
        },
      ]);

      const res = await request(app)
        .get('/api/dashboard/instructor')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('stats');
      expect(res.body.data).toHaveProperty('courses');
      expect(res.body.data).toHaveProperty('recent_enrollments');
      expect(res.body.data.stats).toHaveProperty('total_courses', 2);
      expect(res.body.data.stats).toHaveProperty('published_courses', 1);
      expect(res.body.data.stats).toHaveProperty('draft_courses', 1);
      expect(res.body.data.stats).toHaveProperty('total_students', 50);
      expect(res.body.data.stats).toHaveProperty('active_students', 40);
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app).get('/api/dashboard/instructor');

      expect(res.status).toBe(401);
    });

    it('should return 403 if student tries to access', async () => {
      const token = generateToken(mockStudent);

      const res = await request(app)
        .get('/api/dashboard/instructor')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });

    it('should handle no courses', async () => {
      const token = generateToken(mockInstructor);
      mockCourseInstructorFindAll.mockResolvedValue([]);
      mockEnrollmentCount
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      mockCourseFindAll.mockResolvedValue([]);
      mockEnrollmentFindAll.mockResolvedValue([]);

      const res = await request(app)
        .get('/api/dashboard/instructor')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.stats).toHaveProperty('total_courses', 0);
      expect(res.body.data.stats).toHaveProperty('average_rating', 0);
    });
  });
});
