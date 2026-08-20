import request from 'supertest';
import jwt from 'jsonwebtoken';
import express from 'express';
import cors from 'cors';
import * as uploadService from '../services/upload.service';

// Mocks
const mockLessonFindByPk = jest.fn();
const mockCourseMaterialCreate = jest.fn();
const mockCourseMaterialFindOne = jest.fn();
const mockCourseMaterialMax = jest.fn().mockResolvedValue(0);
const mockCourseInstructorFindOne = jest.fn();

jest.mock('../models', () => ({
  Lesson: {
    findByPk: mockLessonFindByPk,
  },
  CourseMaterial: {
    create: mockCourseMaterialCreate,
    findOne: mockCourseMaterialFindOne,
    max: mockCourseMaterialMax,
  },
  CourseInstructor: {
    findOne: mockCourseInstructorFindOne,
  },
}));

import uploadRoutes from '../routes/upload.routes';
import lessonRoutes from '../routes/lesson.routes';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/uploads', uploadRoutes);
app.use('/api/lessons', lessonRoutes);

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_here';

const mockInstructor = {
  id: 'uuid-instructor-1',
  email: 'instructor@test.com',
  user_type: 'instructor',
};

const instructorToken = jwt.sign(
  { id: mockInstructor.id, email: mockInstructor.email, user_type: mockInstructor.user_type },
  JWT_SECRET
);

describe('Lesson Materials & Raw File Upload Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(uploadService, 'uploadRawFile').mockResolvedValue({
      public_id: 'eduvi/raw/doc123',
      secure_url: 'https://res.cloudinary.com/raw/upload/v12345/eduvi/doc123.pdf',
      format: 'pdf',
      bytes: 1048576,
      width: 0,
      height: 0,
      resource_type: 'raw',
      created_at: new Date().toISOString(),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('POST /api/uploads/raw', () => {
    it('should return 401 if user is not authenticated', async () => {
      const res = await request(app).post('/api/uploads/raw');
      expect(res.status).toBe(401);
    });

    it('should upload raw file to Cloudinary and return secure URL', async () => {
      const res = await request(app)
        .post('/api/uploads/raw')
        .set('Authorization', `Bearer ${instructorToken}`)
        .attach('file', Buffer.from('PDF content mock'), 'document.pdf');

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.url).toBe('https://res.cloudinary.com/raw/upload/v12345/eduvi/doc123.pdf');
    });
  });

  describe('POST /api/lessons/:id/materials', () => {
    it('should return 404 if lesson is not found', async () => {
      mockLessonFindByPk.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/lessons/lesson-123/materials')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({
          title: 'Tài liệu Slide PDF',
          file_url: 'https://cloudinary.com/raw/slide.pdf',
          material_type: 'pdf',
        });

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('Không tìm thấy');
    });

    it('should create lesson material when requested by course instructor', async () => {
      mockLessonFindByPk.mockResolvedValue({
        id: 'lesson-123',
        course_id: 'course-100',
      });

      mockCourseInstructorFindOne.mockResolvedValue({
        instructor_id: mockInstructor.id,
        course_id: 'course-100',
      });

      const mockCreatedMaterial = {
        id: 'material-1',
        lesson_id: 'lesson-123',
        course_id: 'course-100',
        title: 'Tài liệu Bài giảng PDF',
        file_url: 'https://cloudinary.com/raw/slide.pdf',
        material_type: 'pdf',
      };

      mockCourseMaterialCreate.mockResolvedValue(mockCreatedMaterial);

      const res = await request(app)
        .post('/api/lessons/lesson-123/materials')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({
          title: 'Tài liệu Bài giảng PDF',
          file_url: 'https://cloudinary.com/raw/slide.pdf',
          material_type: 'pdf',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Tài liệu Bài giảng PDF');
    });
  });

  describe('DELETE /api/lessons/:lessonId/materials/:materialId', () => {
    it('should delete material when instructor requests it', async () => {
      const mockMaterial = {
        id: 'material-1',
        lesson_id: 'lesson-123',
        course_id: 'course-100',
        destroy: jest.fn().mockResolvedValue(true),
      };

      mockCourseMaterialFindOne.mockResolvedValue(mockMaterial);
      mockCourseInstructorFindOne.mockResolvedValue({
        instructor_id: mockInstructor.id,
        course_id: 'course-100',
      });

      const res = await request(app)
        .delete('/api/lessons/lesson-123/materials/material-1')
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockMaterial.destroy).toHaveBeenCalled();
    });
  });
});
