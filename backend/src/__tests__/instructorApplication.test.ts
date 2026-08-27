import request from 'supertest';
import jwt from 'jsonwebtoken';
import express from 'express';
import cors from 'cors';

const mockTransaction = {
  commit: jest.fn().mockResolvedValue(undefined),
  rollback: jest.fn().mockResolvedValue(undefined),
};

jest.mock('../config/database', () => ({
  sequelize: {
    transaction: jest.fn(() => Promise.resolve(mockTransaction)),
    authenticate: jest.fn().mockResolvedValue(true),
  },
}));

const mockUserFindOne = jest.fn();
const mockUserFindByPk = jest.fn();
const mockUserCreate = jest.fn();

const mockProfileFindOne = jest.fn();
const mockProfileFindByPk = jest.fn();
const mockProfileCreate = jest.fn();

const mockAppFindOne = jest.fn();
const mockAppFindByPk = jest.fn();
const mockAppFindAndCountAll = jest.fn();
const mockAppCreate = jest.fn();

jest.mock('../models', () => {
  return {
    User: {
      findOne: mockUserFindOne,
      findByPk: mockUserFindByPk,
      create: mockUserCreate,
    },
    StudentProfile: {
      create: jest.fn(),
    },
    InstructorProfile: {
      findOne: mockProfileFindOne,
      findByPk: mockProfileFindByPk,
      create: mockProfileCreate,
    },
    InstructorApplication: {
      findOne: mockAppFindOne,
      findByPk: mockAppFindByPk,
      findAndCountAll: mockAppFindAndCountAll,
      create: mockAppCreate,
    },
    RefreshToken: {
      create: jest.fn().mockResolvedValue({}),
    },
    AuditLog: {
      create: jest.fn().mockResolvedValue({}),
    },
  };
});

import { sequelize } from '../config/database';
import { User, InstructorProfile, InstructorApplication } from '../models';
import instructorApplicationRoutes from '../routes/instructorApplication.routes';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/instructor-applications', instructorApplicationRoutes);

const JWT_SECRET = process.env.JWT_SECRET || 'eduvi_lms_jwt_secret_key_2026_super_secure';

const studentToken = jwt.sign(
  { id: 'uuid-student-1', email: 'student@test.com', username: 'student1', user_type: 'student' },
  JWT_SECRET
);

const adminToken = jwt.sign(
  { id: 'uuid-admin-1', email: 'admin@test.com', username: 'admin1', user_type: 'admin' },
  JWT_SECRET
);

describe('Instructor Application API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (sequelize.transaction as jest.Mock).mockResolvedValue(mockTransaction);
  });

  describe('POST /api/instructor-applications/register-and-apply', () => {
    it('should register a new account and submit application seamlessly in one go', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);
      (User.create as jest.Mock).mockResolvedValue({
        id: 'uuid-new-user-1',
        email: 'newcandidate@test.com',
        username: 'candidate@123',
        full_name: 'Tran Candidate',
        user_type: 'student',
      });
      (InstructorApplication.create as jest.Mock).mockResolvedValue({
        id: 'uuid-new-app-1',
        user_id: 'uuid-new-user-1',
        headline: 'Tech Lead',
        bio: 'Over 10 years experience',
        expertise: 'Cloud & DevOps',
        experience_years: 10,
        status: 'pending',
      });

      const res = await request(app)
        .post('/api/instructor-applications/register-and-apply')
        .send({
          email: 'newcandidate@test.com',
          password: 'password123',
          full_name: 'Tran Candidate',
          headline: 'Tech Lead',
          bio: 'Over 10 years experience in cloud architecture',
          expertise: 'Cloud & DevOps',
          experience_years: 10,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('user_type', 'student');
      expect(res.body.data).toHaveProperty('status', 'pending');
      expect(User.create).toHaveBeenCalled();
      expect(InstructorApplication.create).toHaveBeenCalled();
    });
  });

  describe('POST /api/instructor-applications', () => {
    it('should submit an application successfully for a student', async () => {
      (User.findByPk as jest.Mock).mockResolvedValue({
        id: 'uuid-student-1',
        user_type: 'student',
      });
      (InstructorApplication.findOne as jest.Mock).mockResolvedValue(null);
      (InstructorApplication.create as jest.Mock).mockResolvedValue({
        id: 'uuid-app-1',
        user_id: 'uuid-student-1',
        headline: 'Senior Fullstack Engineer',
        bio: 'Over 8 years of experience in React & Node.js',
        expertise: 'Web Development',
        experience_years: 8,
        status: 'pending',
      });

      const res = await request(app)
        .post('/api/instructor-applications')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          headline: 'Senior Fullstack Engineer',
          bio: 'Over 8 years of experience in React & Node.js',
          expertise: 'Web Development',
          experience_years: 8,
          education_degree: 'B.Sc in Computer Science',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('status', 'pending');
      expect(InstructorApplication.create).toHaveBeenCalled();
    });

    it('should reject submission if already has a pending application', async () => {
      (User.findByPk as jest.Mock).mockResolvedValue({
        id: 'uuid-student-1',
        user_type: 'student',
      });
      (InstructorApplication.findOne as jest.Mock).mockResolvedValue({
        id: 'uuid-app-existing',
        status: 'pending',
      });

      const res = await request(app)
        .post('/api/instructor-applications')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          headline: 'Senior Fullstack Engineer',
          bio: 'Test bio',
          expertise: 'Web Development',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('đang chờ duyệt');
    });

    it('should return 401 if unauthenticated', async () => {
      const res = await request(app)
        .post('/api/instructor-applications')
        .send({ headline: 'Test' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/instructor-applications/my-application', () => {
    it('should return current application for logged in user', async () => {
      (InstructorApplication.findOne as jest.Mock).mockResolvedValue({
        id: 'uuid-app-1',
        user_id: 'uuid-student-1',
        status: 'pending',
      });

      const res = await request(app)
        .get('/api/instructor-applications/my-application')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id', 'uuid-app-1');
    });
  });

  describe('Admin Endpoints', () => {
    it('should block non-admin from approving application', async () => {
      const res = await request(app)
        .post('/api/instructor-applications/admin/uuid-app-1/approve')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
    });

    it('should allow admin to approve application and upgrade user to instructor', async () => {
      const mockApplication = {
        id: 'uuid-app-1',
        user_id: 'uuid-student-1',
        expertise: 'Fullstack',
        experience_years: 5,
        education_degree: 'B.S',
        linkedin_url: 'https://linkedin.com',
        status: 'pending',
        update: jest.fn().mockResolvedValue(true),
      };

      const mockCandidateUser = {
        id: 'uuid-student-1',
        full_name: 'Nguyen Van An',
        email: 'student@test.com',
        user_type: 'student',
        update: jest.fn().mockResolvedValue(true),
      };

      (InstructorApplication.findByPk as jest.Mock).mockResolvedValue(mockApplication);
      (User.findByPk as jest.Mock).mockResolvedValue(mockCandidateUser);

      const res = await request(app)
        .post('/api/instructor-applications/admin/uuid-app-1/approve')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ admin_notes: 'Approved after CV check' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockApplication.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'approved' }),
        expect.anything()
      );
      expect(mockCandidateUser.update).toHaveBeenCalledWith(
        expect.objectContaining({ user_type: 'instructor' }),
        expect.anything()
      );
    });

    it('should allow admin to reject application with a reason', async () => {
      const mockApplication = {
        id: 'uuid-app-1',
        user_id: 'uuid-student-1',
        status: 'pending',
        update: jest.fn().mockResolvedValue(true),
      };

      (InstructorApplication.findByPk as jest.Mock).mockResolvedValue(mockApplication);

      const res = await request(app)
        .post('/api/instructor-applications/admin/uuid-app-1/reject')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ rejection_reason: 'Missing teaching certificate' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockApplication.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'rejected',
          rejection_reason: 'Missing teaching certificate',
        })
      );
    });
  });
});
