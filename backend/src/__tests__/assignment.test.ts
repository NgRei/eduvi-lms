import request from 'supertest';
import jwt from 'jsonwebtoken';
import express from 'express';
import cors from 'cors';

jest.mock('../models', () => {
  const mockFindAll = jest.fn();
  const mockFindAndCountAll = jest.fn();
  const mockFindByPk = jest.fn();
  const mockCreate = jest.fn();
  const mockFindOne = jest.fn();
  const mockMax = jest.fn();
  const mockUpdate = jest.fn();
  const mockDestroy = jest.fn();

  const mockAssignmentInstance = {
    id: 'uuid-assignment-1',
    course_id: 'uuid-course-1',
    lesson_id: null,
    title: 'Test Quiz',
    description: null,
    assignment_type: 'quiz',
    total_points: 100,
    passing_score: 50,
    time_limit_minutes: null,
    attempts_allowed: 1,
    show_answer_after: false,
    due_date: null,
    is_published: false,
    update: mockUpdate,
    destroy: mockDestroy,
    toJSON: () => ({
      id: 'uuid-assignment-1',
      course_id: 'uuid-course-1',
      lesson_id: null,
      title: 'Test Quiz',
      description: null,
      assignment_type: 'quiz',
      total_points: 100,
      passing_score: 50,
      time_limit_minutes: null,
      attempts_allowed: 1,
      show_answer_after: false,
      due_date: null,
      is_published: false,
    }),
  };

  const mockQuestionInstance = {
    id: 'uuid-question-1',
    assignment_id: 'uuid-assignment-1',
    question_text: 'What is Node.js?',
    question_type: 'single',
    options: [
      { id: 'a', text: 'A runtime', is_correct: true },
      { id: 'b', text: 'A framework', is_correct: false },
    ],
    explanation: null,
    points: 10,
    sort_order: 1,
    update: mockUpdate,
    destroy: mockDestroy,
    toJSON: () => ({
      id: 'uuid-question-1',
      assignment_id: 'uuid-assignment-1',
      question_text: 'What is Node.js?',
      question_type: 'single',
      options: [
        { id: 'a', text: 'A runtime', is_correct: true },
        { id: 'b', text: 'A framework', is_correct: false },
      ],
      explanation: null,
      points: 10,
      sort_order: 1,
    }),
  };

  return {
    Assignment: {
      findAll: mockFindAll,
      findAndCountAll: mockFindAndCountAll,
      findByPk: mockFindByPk,
      create: mockCreate,
      _instance: mockAssignmentInstance,
    },
    QuizQuestion: {
      findAll: mockFindAll,
      findByPk: mockFindByPk,
      create: mockCreate,
      max: mockMax,
      update: jest.fn(),
      _instance: mockQuestionInstance,
    },
    Course: {
      findByPk: mockFindByPk,
    },
    Lesson: {
      findByPk: mockFindByPk,
    },
    CourseInstructor: {
      findOne: mockFindOne,
    },
    Submission: {
      count: jest.fn(),
    },
  };
});

jest.mock('../utils/email.util', () => ({
  sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
}));

import { Assignment, QuizQuestion, CourseInstructor, Lesson } from '../models';
import assignmentRoutes from '../routes/assignment.routes';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/assignments', assignmentRoutes);

const JWT_SECRET = 'test_jwt_secret_key';

const generateToken = (user: { id: string; email: string; username: string; user_type: string }) => {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '1h' });
};

const instructorToken = generateToken({
  id: 'uuid-instructor-1',
  email: 'instructor@test.com',
  username: 'instructor123',
  user_type: 'instructor',
});

const studentToken = generateToken({
  id: 'uuid-student-1',
  email: 'student@test.com',
  username: 'student123',
  user_type: 'student',
});

const adminToken = generateToken({
  id: 'uuid-admin-1',
  email: 'admin@test.com',
  username: 'admin123',
  user_type: 'admin',
});

const mockAssignment = {
  id: 'uuid-assignment-1',
  course_id: 'uuid-course-1',
  lesson_id: null,
  title: 'Test Quiz',
  description: null,
  assignment_type: 'quiz',
  total_points: 100,
  passing_score: 50,
  time_limit_minutes: null,
  attempts_allowed: 1,
  show_answer_after: false,
  due_date: null,
  is_published: false,
  update: jest.fn().mockResolvedValue(true),
  destroy: jest.fn().mockResolvedValue(true),
  toJSON: () => ({
    id: 'uuid-assignment-1',
    course_id: 'uuid-course-1',
    lesson_id: null,
    title: 'Test Quiz',
    description: null,
    assignment_type: 'quiz',
    total_points: 100,
    passing_score: 50,
    time_limit_minutes: null,
    attempts_allowed: 1,
    show_answer_after: false,
    due_date: null,
    is_published: false,
  }),
};

const mockQuestion = {
  id: 'uuid-question-1',
  assignment_id: 'uuid-assignment-1',
  question_text: 'What is Node.js?',
  question_type: 'single',
  options: [
    { id: 'a', text: 'A runtime', is_correct: true },
    { id: 'b', text: 'A framework', is_correct: false },
  ],
  explanation: null,
  points: 10,
  sort_order: 1,
  update: jest.fn().mockResolvedValue(true),
  destroy: jest.fn().mockResolvedValue(true),
  toJSON: () => ({
    id: 'uuid-question-1',
    assignment_id: 'uuid-assignment-1',
    question_text: 'What is Node.js?',
    question_type: 'single',
    options: [
      { id: 'a', text: 'A runtime', is_correct: true },
      { id: 'b', text: 'A framework', is_correct: false },
    ],
    explanation: null,
    points: 10,
    sort_order: 1,
  }),
};

describe('Assignment API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/assignments', () => {
    it('should create assignment when instructor is owner', async () => {
      (Lesson.findByPk as jest.Mock).mockResolvedValue(null);
      (CourseInstructor.findOne as jest.Mock).mockResolvedValue({ instructor_id: 'uuid-instructor-1', course_id: 'uuid-course-1' });
      (Assignment.create as jest.Mock).mockResolvedValue(mockAssignment);

      const res = await request(app)
        .post('/api/assignments')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({
          title: 'Test Quiz',
          course_id: 'uuid-course-1',
          assignment_type: 'quiz',
          total_points: 100,
          passing_score: 50,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Test Quiz');
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app)
        .post('/api/assignments')
        .send({ title: 'Test Quiz' });

      expect(res.status).toBe(401);
    });

    it('should return 400 if title is missing', async () => {
      const res = await request(app)
        .post('/api/assignments')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({ course_id: 'uuid-course-1' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('tiêu đề');
    });

    it('should return 400 if no course_id or lesson_id', async () => {
      (Lesson.findByPk as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .post('/api/assignments')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({ title: 'Test Quiz' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('course_id');
    });

    it('should return 403 if instructor is not owner of course', async () => {
      (Lesson.findByPk as jest.Mock).mockResolvedValue(null);
      (CourseInstructor.findOne as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .post('/api/assignments')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({
          title: 'Test Quiz',
          course_id: 'uuid-course-1',
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('không có quyền');
    });

    it('should return 403 if student tries to create', async () => {
      const res = await request(app)
        .post('/api/assignments')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: 'Test Quiz',
          course_id: 'uuid-course-1',
        });

      expect(res.status).toBe(403);
    });

    it('should allow admin to create without being instructor', async () => {
      (Lesson.findByPk as jest.Mock).mockResolvedValue(null);
      (Assignment.create as jest.Mock).mockResolvedValue(mockAssignment);

      const res = await request(app)
        .post('/api/assignments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Test Quiz',
          course_id: 'uuid-course-1',
          assignment_type: 'quiz',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/assignments', () => {
    it('should return assignments list', async () => {
      (Assignment.findAndCountAll as jest.Mock).mockResolvedValue({
        count: 1,
        rows: [{ ...mockAssignment, questions: [], course: { id: 'uuid-course-1', title: 'Test Course' }, lesson: null }],
      });

      const res = await request(app)
        .get('/api/assignments')
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.pagination).toBeDefined();
    });

    it('should filter by course_id', async () => {
      (Assignment.findAndCountAll as jest.Mock).mockResolvedValue({
        count: 0,
        rows: [],
      });

      const res = await request(app)
        .get('/api/assignments?course_id=uuid-course-1')
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(res.status).toBe(200);
      expect(Assignment.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ course_id: 'uuid-course-1' }),
        })
      );
    });

    it('should only show published assignments to students', async () => {
      (Assignment.findAndCountAll as jest.Mock).mockResolvedValue({
        count: 0,
        rows: [],
      });

      await request(app)
        .get('/api/assignments')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(Assignment.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ is_published: true }),
        })
      );
    });
  });

  describe('GET /api/assignments/:id', () => {
    it('should return assignment detail', async () => {
      (Assignment.findByPk as jest.Mock).mockResolvedValue({
        ...mockAssignment,
        questions: [mockQuestion],
        course: { id: 'uuid-course-1', title: 'Test Course' },
        lesson: null,
      });

      const res = await request(app)
        .get('/api/assignments/uuid-assignment-1')
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Test Quiz');
    });

    it('should return 404 if assignment not found', async () => {
      (Assignment.findByPk as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .get('/api/assignments/nonexistent')
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(res.status).toBe(404);
    });

    it('should hide correct answers from students for quiz', async () => {
      (Assignment.findByPk as jest.Mock).mockResolvedValue({
        ...mockAssignment,
        is_published: true,
        questions: [mockQuestion],
        course: { id: 'uuid-course-1', title: 'Test Course' },
        lesson: null,
      });

      const res = await request(app)
        .get('/api/assignments/uuid-assignment-1')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      // Check that is_correct is not in the options
      const options = res.body.data.questions[0].options;
      options.forEach((opt: any) => {
        expect(opt.is_correct).toBeUndefined();
      });
    });

    it('should return 403 if student views unpublished assignment', async () => {
      (Assignment.findByPk as jest.Mock).mockResolvedValue({
        ...mockAssignment,
        is_published: false,
      });

      const res = await request(app)
        .get('/api/assignments/uuid-assignment-1')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('PUT /api/assignments/:id', () => {
    it('should update assignment when authorized', async () => {
      (Assignment.findByPk as jest.Mock).mockResolvedValue(mockAssignment);
      (CourseInstructor.findOne as jest.Mock).mockResolvedValue({ instructor_id: 'uuid-instructor-1', course_id: 'uuid-course-1' });

      const res = await request(app)
        .put('/api/assignments/uuid-assignment-1')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({ title: 'Updated Quiz' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 if assignment not found', async () => {
      (Assignment.findByPk as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .put('/api/assignments/nonexistent')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({ title: 'Updated' });

      expect(res.status).toBe(404);
    });

    it('should return 403 if instructor is not owner', async () => {
      (Assignment.findByPk as jest.Mock).mockResolvedValue(mockAssignment);
      (CourseInstructor.findOne as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .put('/api/assignments/uuid-assignment-1')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({ title: 'Updated' });

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/assignments/:id', () => {
    it('should delete assignment when authorized', async () => {
      (Assignment.findByPk as jest.Mock).mockResolvedValue(mockAssignment);
      (CourseInstructor.findOne as jest.Mock).mockResolvedValue({ instructor_id: 'uuid-instructor-1', course_id: 'uuid-course-1' });

      const res = await request(app)
        .delete('/api/assignments/uuid-assignment-1')
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockAssignment.destroy).toHaveBeenCalled();
    });

    it('should return 404 if assignment not found', async () => {
      (Assignment.findByPk as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .delete('/api/assignments/nonexistent')
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/assignments/:id/publish', () => {
    it('should toggle publish status', async () => {
      const unpublishedAssignment = { ...mockAssignment, is_published: false, update: jest.fn().mockResolvedValue(true) };
      (Assignment.findByPk as jest.Mock).mockResolvedValue(unpublishedAssignment);
      (CourseInstructor.findOne as jest.Mock).mockResolvedValue({ instructor_id: 'uuid-instructor-1', course_id: 'uuid-course-1' });

      const res = await request(app)
        .patch('/api/assignments/uuid-assignment-1/publish')
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(unpublishedAssignment.update).toHaveBeenCalledWith({ is_published: true });
    });

    it('should return 404 if assignment not found', async () => {
      (Assignment.findByPk as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .patch('/api/assignments/nonexistent/publish')
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/assignments/:id/questions', () => {
    it('should add question to quiz assignment', async () => {
      (Assignment.findByPk as jest.Mock).mockResolvedValue(mockAssignment);
      (CourseInstructor.findOne as jest.Mock).mockResolvedValue({ instructor_id: 'uuid-instructor-1', course_id: 'uuid-course-1' });
      (QuizQuestion.max as jest.Mock).mockResolvedValue(0);
      (QuizQuestion.create as jest.Mock).mockResolvedValue(mockQuestion);

      const res = await request(app)
        .post('/api/assignments/uuid-assignment-1/questions')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({
          question_text: 'What is Node.js?',
          question_type: 'single',
          options: [
            { id: 'a', text: 'A runtime', is_correct: true },
            { id: 'b', text: 'A framework', is_correct: false },
          ],
          points: 10,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should return 400 if not quiz type', async () => {
      (Assignment.findByPk as jest.Mock).mockResolvedValue({
        ...mockAssignment,
        assignment_type: 'essay',
      });

      const res = await request(app)
        .post('/api/assignments/uuid-assignment-1/questions')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({
          question_text: 'Test?',
          options: [{ id: 'a', text: 'Yes', is_correct: true }],
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('quiz');
    });

    it('should return 400 if missing question_text or options', async () => {
      (Assignment.findByPk as jest.Mock).mockResolvedValue(mockAssignment);
      (CourseInstructor.findOne as jest.Mock).mockResolvedValue({ instructor_id: 'uuid-instructor-1', course_id: 'uuid-course-1' });

      const res = await request(app)
        .post('/api/assignments/uuid-assignment-1/questions')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({ question_text: 'Test?' });

      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/assignments/questions/:id', () => {
    it('should update question', async () => {
      (QuizQuestion.findByPk as jest.Mock).mockResolvedValue({
        ...mockQuestion,
        assignment: mockAssignment,
      });
      (CourseInstructor.findOne as jest.Mock).mockResolvedValue({ instructor_id: 'uuid-instructor-1', course_id: 'uuid-course-1' });

      const res = await request(app)
        .put('/api/assignments/questions/uuid-question-1')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({ question_text: 'Updated question?' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 if question not found', async () => {
      (QuizQuestion.findByPk as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .put('/api/assignments/questions/nonexistent')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({ question_text: 'Updated?' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/assignments/questions/:id', () => {
    it('should delete question', async () => {
      (QuizQuestion.findByPk as jest.Mock).mockResolvedValue({
        ...mockQuestion,
        assignment: mockAssignment,
      });
      (CourseInstructor.findOne as jest.Mock).mockResolvedValue({ instructor_id: 'uuid-instructor-1', course_id: 'uuid-course-1' });

      const res = await request(app)
        .delete('/api/assignments/questions/uuid-question-1')
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockQuestion.destroy).toHaveBeenCalled();
    });
  });

  describe('PUT /api/assignments/:id/questions/reorder', () => {
    it('should reorder questions', async () => {
      (Assignment.findByPk as jest.Mock).mockResolvedValue(mockAssignment);
      (CourseInstructor.findOne as jest.Mock).mockResolvedValue({ instructor_id: 'uuid-instructor-1', course_id: 'uuid-course-1' });
      (QuizQuestion.update as jest.Mock).mockResolvedValue([1]);

      const res = await request(app)
        .put('/api/assignments/uuid-assignment-1/questions/reorder')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({ order: ['uuid-question-1', 'uuid-question-2'] });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 400 if order is not an array', async () => {
      (Assignment.findByPk as jest.Mock).mockResolvedValue(mockAssignment);

      const res = await request(app)
        .put('/api/assignments/uuid-assignment-1/questions/reorder')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({ order: 'invalid' });

      expect(res.status).toBe(400);
    });
  });
});
