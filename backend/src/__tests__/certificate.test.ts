import request from 'supertest';
import jwt from 'jsonwebtoken';
import express from 'express';
import cors from 'cors';

// Mocks
const mockCertificateFindOne = jest.fn();
const mockCertificateCreate = jest.fn();
const mockUserCertificateFindOne = jest.fn();
const mockUserCertificateCreate = jest.fn();
const mockUserCertificateFindAll = jest.fn();
const mockEnrollmentFindOne = jest.fn();
const mockCourseFindByPk = jest.fn();
const mockUserFindByPk = jest.fn();
const mockLessonCount = jest.fn();
const mockLessonProgressCount = jest.fn();
const mockAssignmentFindOne = jest.fn();
const mockSubmissionFindOne = jest.fn();
const mockCreateAuditLog = jest.fn();

jest.mock('../services/audit.service', () => ({
  createAuditLog: mockCreateAuditLog,
  getClientIp: jest.fn().mockReturnValue('127.0.0.1'),
}));

const mockGenerateCertificatePdf = jest.fn().mockResolvedValue('https://res.cloudinary.com/raw/upload/v12345/eduvi/certificates/cert-123.pdf');

jest.mock('../services/certificate-pdf.service', () => ({
  generateCertificatePdf: mockGenerateCertificatePdf,
}));

jest.mock('../models', () => ({
  Certificate: {
    findOne: mockCertificateFindOne,
    create: mockCertificateCreate,
  },
  UserCertificate: {
    findOne: mockUserCertificateFindOne,
    create: mockUserCertificateCreate,
    findAll: mockUserCertificateFindAll,
  },
  Enrollment: {
    findOne: mockEnrollmentFindOne,
  },
  Course: {
    findByPk: mockCourseFindByPk,
  },
  User: {
    findByPk: mockUserFindByPk,
  },
  Lesson: {
    count: mockLessonCount,
  },
  LessonProgress: {
    count: mockLessonProgressCount,
  },
  Assignment: {
    findOne: mockAssignmentFindOne,
  },
  Submission: {
    findOne: mockSubmissionFindOne,
  },
}));

import certificateRoutes from '../routes/certificate.routes';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/certificates', certificateRoutes);

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_here';

const mockStudent = {
  id: 'uuid-student-1',
  email: 'student@test.com',
  full_name: 'Nguyen Van A',
  user_type: 'student',
};

const studentToken = jwt.sign(
  { id: mockStudent.id, email: mockStudent.email, user_type: mockStudent.user_type },
  JWT_SECRET
);

describe('Certificate Controller & Service Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/certificates/course/:courseId/completion-status', () => {
    it('should return 401 if user is not authenticated', async () => {
      const res = await request(app).get('/api/certificates/course/course-123/completion-status');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 404 if enrollment is not found', async () => {
      mockEnrollmentFindOne.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/certificates/course/course-123/completion-status')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('chưa đăng ký');
    });

    it('should return completion status with Final Exam info and certificate eligibility', async () => {
      mockEnrollmentFindOne.mockResolvedValue({
        id: 'enrollment-1',
        progress_percentage: 100,
        certificate_issued: false,
      });

      mockLessonCount.mockResolvedValue(10);
      mockLessonProgressCount.mockResolvedValue(10);

      mockAssignmentFindOne.mockResolvedValue({
        id: 'final-exam-1',
        title: 'Bài thi cuối khóa ReactJS',
        passing_score: 80,
        total_points: 100,
      });

      mockSubmissionFindOne.mockResolvedValue({
        id: 'submission-1',
        score: 85,
      });

      const res = await request(app)
        .get('/api/certificates/course/course-123/completion-status')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.progress_percentage).toBe(100);
      expect(res.body.data.lessons_completed).toBe(10);
      expect(res.body.data.final_exam.exists).toBe(true);
      expect(res.body.data.final_exam.passed).toBe(true);
      expect(res.body.data.certificate.eligible).toBe(true);
    });
  });

  describe('POST /api/certificates/issue/:courseId', () => {
    it('should return 400 if student progress is < 100%', async () => {
      mockEnrollmentFindOne.mockResolvedValue({
        id: 'enrollment-1',
        progress_percentage: 80,
        certificate_issued: false,
      });

      const res = await request(app)
        .post('/api/certificates/issue/course-123')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('tiến độ chưa đạt 100%');
    });

    it('should return 400 if Final Exam exists but student failed', async () => {
      mockEnrollmentFindOne.mockResolvedValue({
        id: 'enrollment-1',
        progress_percentage: 100,
        certificate_issued: false,
      });

      mockAssignmentFindOne.mockResolvedValue({
        id: 'final-exam-1',
        passing_score: 80,
        total_points: 100,
      });

      mockSubmissionFindOne.mockResolvedValue({
        id: 'submission-1',
        score: 60, // Failed (< 80)
      });

      const res = await request(app)
        .post('/api/certificates/issue/course-123')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('chưa đạt điểm qua môn tối thiểu');
    });

    it('should issue certificate and generate PDF when all requirements are met', async () => {
      const mockEnrollment = {
        id: 'enrollment-1',
        progress_percentage: 100,
        certificate_issued: false,
        update: jest.fn().mockResolvedValue(true),
      };
      mockEnrollmentFindOne.mockResolvedValue(mockEnrollment);

      mockAssignmentFindOne.mockResolvedValue({
        id: 'final-exam-1',
        passing_score: 80,
        total_points: 100,
      });

      mockSubmissionFindOne.mockResolvedValue({
        id: 'submission-1',
        score: 90, // Passed
      });

      mockCertificateFindOne.mockResolvedValue({
        id: 'template-1',
        title: 'Chứng chỉ ReactJS',
        valid_days: null,
      });

      mockUserFindByPk.mockResolvedValue({ id: mockStudent.id, full_name: 'Nguyen Van A' });
      mockCourseFindByPk.mockResolvedValue({ id: 'course-123', title: 'Khóa học ReactJS' });

      mockUserCertificateCreate.mockResolvedValue({
        id: 'user-cert-1',
        user_id: mockStudent.id,
        course_id: 'course-123',
        cert_code: 'CERT-TEST-123',
        file_url: 'https://res.cloudinary.com/raw/upload/v12345/eduvi/certificates/cert-123.pdf',
        issued_at: new Date(),
      });

      const res = await request(app)
        .post('/api/certificates/issue/course-123')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.cert_code).toBeDefined();
      expect(mockGenerateCertificatePdf).toHaveBeenCalledWith(
        'Nguyen Van A',
        'Khóa học ReactJS',
        expect.any(String),
        expect.any(Date)
      );
      expect(mockEnrollment.update).toHaveBeenCalledWith({ certificate_issued: true });
    });
  });

  describe('GET /api/certificates/verify/:cert_code', () => {
    it('should return 404 for invalid certificate code', async () => {
      mockUserCertificateFindOne.mockResolvedValue(null);

      const res = await request(app).get('/api/certificates/verify/CERT-INVALID');

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('không hợp lệ');
    });

    it('should return verified certificate details for valid cert_code', async () => {
      mockUserCertificateFindOne.mockResolvedValue({
        cert_code: 'CERT-VALID-123',
        issued_at: new Date(),
        expires_at: null,
        user: { full_name: 'Nguyen Van A', email: 'student@test.com' },
        course: { title: 'Khóa học ReactJS' },
        certificate: { title: 'Chứng chỉ ReactJS', description: 'Hoàn thành 100%' },
      });

      const res = await request(app).get('/api/certificates/verify/CERT-VALID-123');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.cert_code).toBe('CERT-VALID-123');
      expect(res.body.data.holder_name).toBe('Nguyen Van A');
      expect(res.body.data.is_valid).toBe(true);
    });
  });
});
