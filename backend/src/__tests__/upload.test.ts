import request from 'supertest';
import jwt from 'jsonwebtoken';
import express from 'express';
import cors from 'cors';

const mockVideoCreate = jest.fn();
const mockVideoFindByPk = jest.fn();
const mockVideoFindAll = jest.fn();
const mockVideoDestroy = jest.fn();
const mockCourseFindByPk = jest.fn();
const mockCourseInstructorFindOne = jest.fn();
const mockEnrollmentFindOne = jest.fn();
const mockLessonFindByPk = jest.fn();

jest.mock('../config/cloudinary', () => ({
  __esModule: true,
  default: {
    api: { ping: jest.fn().mockResolvedValue({ status: 'ok' }) },
    uploader: {
      upload_stream: jest.fn(),
      destroy: jest.fn().mockResolvedValue({ result: 'ok' }),
    },
    url: jest.fn().mockReturnValue('https://signed-url.cloudinary.com/video.mp4'),
  },
}));

const mockGetSignedVideoUrl = jest.fn().mockReturnValue('https://signed-url.cloudinary.com/video.mp4');
const mockUploadVideo = jest.fn().mockResolvedValue({
  public_id: 'eduvi/courses/uuid-course-1/abc123',
  secure_url: 'https://res.cloudinary.com/video.mp4',
  format: 'mp4',
  duration: 120,
  bytes: 5000000,
  width: 1920,
  height: 1080,
});

jest.mock('../services/upload.service', () => ({
  uploadVideo: mockUploadVideo,
  uploadImage: jest.fn().mockResolvedValue({
    public_id: 'eduvi/images/abc123',
    secure_url: 'https://res.cloudinary.com/image.jpg',
    format: 'jpg',
    width: 800,
    height: 600,
  }),
  getSignedVideoUrl: mockGetSignedVideoUrl,
  deleteVideo: jest.fn().mockResolvedValue(true),
  deleteImage: jest.fn().mockResolvedValue(true),
}));

jest.mock('../models', () => ({
  Video: {
    create: mockVideoCreate,
    findByPk: mockVideoFindByPk,
    findAll: mockVideoFindAll,
  },
  Course: {
    findByPk: mockCourseFindByPk,
  },
  CourseInstructor: {
    findOne: mockCourseInstructorFindOne,
  },
  Enrollment: {
    findOne: mockEnrollmentFindOne,
  },
  Lesson: {
    findByPk: mockLessonFindByPk,
  },
}));

import uploadRoutes from '../routes/upload.routes';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/uploads', uploadRoutes);

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

const mockCourse = {
  id: 'uuid-course-1',
  title: 'Node.js Basics',
};

const mockVideo = {
  id: 'uuid-video-1',
  cloudinary_id: 'eduvi/courses/uuid-course-1/abc123',
  original_name: 'lesson1.mp4',
  format: 'mp4',
  duration: 120,
  size_bytes: 5000000,
  thumbnail_url: null,
  lesson_id: null,
  course_id: 'uuid-course-1',
  uploaded_by: 'uuid-instructor-1',
  is_processed: true,
  destroy: mockVideoDestroy,
  createdAt: new Date(),
};

const generateToken = (user: { id: string; email: string; username: string; user_type: string }) => {
  return jwt.sign(
    { id: user.id, email: user.email, username: user.username, user_type: user.user_type },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
};

describe('Upload API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/uploads/video/:id/signed-url', () => {
    it('should return signed url for enrolled student', async () => {
      const token = generateToken(mockStudent);
      mockVideoFindByPk.mockResolvedValue(mockVideo);
      mockEnrollmentFindOne.mockResolvedValue({ status: 'active' });
      mockGetSignedVideoUrl.mockReturnValue('https://signed-url.cloudinary.com/video.mp4');

      const res = await request(app)
        .get('/api/uploads/video/uuid-video-1/signed-url')
        .set('Authorization', `Bearer ${token}`)
        .query({ course_id: 'uuid-course-1' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('url', 'https://signed-url.cloudinary.com/video.mp4');
      expect(res.body.data).toHaveProperty('expires_in', 900);
    });

    it('should return signed url for instructor', async () => {
      const token = generateToken(mockInstructor);
      mockVideoFindByPk.mockResolvedValue(mockVideo);
      mockEnrollmentFindOne.mockResolvedValue(null);
      mockCourseInstructorFindOne.mockResolvedValue({ instructor_id: 'uuid-instructor-1' });
      mockGetSignedVideoUrl.mockReturnValue('https://signed-url.cloudinary.com/video.mp4');

      const res = await request(app)
        .get('/api/uploads/video/uuid-video-1/signed-url')
        .set('Authorization', `Bearer ${token}`)
        .query({ course_id: 'uuid-course-1' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('url');
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app)
        .get('/api/uploads/video/uuid-video-1/signed-url')
        .query({ course_id: 'uuid-course-1' });

      expect(res.status).toBe(401);
    });

    it('should return 400 if course_id missing', async () => {
      const token = generateToken(mockStudent);

      const res = await request(app)
        .get('/api/uploads/video/uuid-video-1/signed-url')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Vui lòng cung cấp course_id!');
    });

    it('should return 404 if video not found', async () => {
      const token = generateToken(mockStudent);
      mockVideoFindByPk.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/uploads/video/nonexistent-id/signed-url')
        .set('Authorization', `Bearer ${token}`)
        .query({ course_id: 'uuid-course-1' });

      expect(res.status).toBe(404);
    });

    it('should return 403 if video not belong to course', async () => {
      const token = generateToken(mockStudent);
      mockVideoFindByPk.mockResolvedValue({ ...mockVideo, course_id: 'other-course' });

      const res = await request(app)
        .get('/api/uploads/video/uuid-video-1/signed-url')
        .set('Authorization', `Bearer ${token}`)
        .query({ course_id: 'uuid-course-1' });

      expect(res.status).toBe(403);
    });

    it('should return 403 if student not enrolled', async () => {
      const token = generateToken(mockStudent);
      mockVideoFindByPk.mockResolvedValue(mockVideo);
      mockEnrollmentFindOne.mockResolvedValue(null);
      mockCourseInstructorFindOne.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/uploads/video/uuid-video-1/signed-url')
        .set('Authorization', `Bearer ${token}`)
        .query({ course_id: 'uuid-course-1' });

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/uploads/video/:id', () => {
    it('should delete video when instructor is owner', async () => {
      const token = generateToken(mockInstructor);
      mockVideoFindByPk.mockResolvedValue(mockVideo);
      mockCourseInstructorFindOne.mockResolvedValue({ instructor_id: 'uuid-instructor-1' });

      const res = await request(app)
        .delete('/api/uploads/video/uuid-video-1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Xóa video thành công!');
    });

    it('should delete video when admin', async () => {
      const token = generateToken(mockAdmin);
      mockVideoFindByPk.mockResolvedValue(mockVideo);

      const res = await request(app)
        .delete('/api/uploads/video/uuid-video-1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app)
        .delete('/api/uploads/video/uuid-video-1');

      expect(res.status).toBe(401);
    });

    it('should return 404 if video not found', async () => {
      const token = generateToken(mockAdmin);
      mockVideoFindByPk.mockResolvedValue(null);

      const res = await request(app)
        .delete('/api/uploads/video/nonexistent-id')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });

    it('should return 403 if student tries to delete', async () => {
      const token = generateToken(mockStudent);

      const res = await request(app)
        .delete('/api/uploads/video/uuid-video-1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });

    it('should return 403 if non-owner instructor tries to delete', async () => {
      const token = generateToken(mockInstructor);
      mockVideoFindByPk.mockResolvedValue(mockVideo);
      mockCourseInstructorFindOne.mockResolvedValue(null);

      const res = await request(app)
        .delete('/api/uploads/video/uuid-video-1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/uploads/video/course/:courseId', () => {
    it('should return videos by course for instructor', async () => {
      const token = generateToken(mockInstructor);
      mockVideoFindAll.mockResolvedValue([mockVideo]);

      const res = await request(app)
        .get('/api/uploads/video/course/uuid-course-1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app)
        .get('/api/uploads/video/course/uuid-course-1');

      expect(res.status).toBe(401);
    });

    it('should return 403 if student tries to access', async () => {
      const token = generateToken(mockStudent);

      const res = await request(app)
        .get('/api/uploads/video/course/uuid-course-1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/uploads/video', () => {
    it('should return 400 if no file uploaded', async () => {
      const token = generateToken(mockInstructor);

      const res = await request(app)
        .post('/api/uploads/video')
        .set('Authorization', `Bearer ${token}`)
        .field('course_id', 'uuid-course-1');

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Vui lòng chọn file video!');
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app)
        .post('/api/uploads/video');

      expect(res.status).toBe(401);
    });

    it('should return 403 if student tries to upload', async () => {
      const token = generateToken(mockStudent);

      const res = await request(app)
        .post('/api/uploads/video')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });
  });
});
