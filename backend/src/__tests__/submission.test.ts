import request from 'supertest';
import jwt from 'jsonwebtoken';
import express from 'express';
import cors from 'cors';

jest.mock('../models', () => {
  return {
    Assignment: {
      findByPk: jest.fn(),
    },
    QuizQuestion: {
      findAll: jest.fn(),
    },
    Submission: {
      findByPk: jest.fn(),
      findAndCountAll: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
    User: {
      findByPk: jest.fn(),
    },
    Enrollment: {
      findOne: jest.fn(),
    },
    LessonProgress: {
      findOne: jest.fn(),
      create: jest.fn(),
    },
    CourseInstructor: {
      findOne: jest.fn(),
    },
  };
});

jest.mock('../utils/email.util', () => ({
  sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
}));

import { Assignment, QuizQuestion, Submission, Enrollment, LessonProgress, CourseInstructor, User } from '../models';
import assignmentRoutes from '../routes/assignment.routes';
import submissionRoutes from '../routes/submission.routes';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/assignments', assignmentRoutes);
app.use('/api/submissions', submissionRoutes);

const JWT_SECRET = 'test_jwt_secret_key';

const generateToken = (user: { id: string; email: string; username: string; user_type: string }) => {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '1h' });
};

const studentToken = generateToken({
  id: 'uuid-student-1',
  email: 'student@test.com',
  username: 'student123',
  user_type: 'student',
});

const instructorToken = generateToken({
  id: 'uuid-instructor-1',
  email: 'instructor@test.com',
  username: 'instructor123',
  user_type: 'instructor',
});

const mockAssignment = {
  id: 'uuid-assignment-1',
  course_id: 'uuid-course-1',
  lesson_id: 'uuid-lesson-1',
  title: 'Test Quiz',
  assignment_type: 'quiz',
  total_points: 10,
  passing_score: 5,
  attempts_allowed: 2,
  show_answer_after: true,
  due_date: null,
  is_published: true,
  questions: [
    {
      id: 'uuid-q1',
      assignment_id: 'uuid-assignment-1',
      question_text: 'Question 1',
      question_type: 'single',
      options: [
        { id: 'a', text: 'Correct', is_correct: true },
        { id: 'b', text: 'Wrong', is_correct: false },
      ],
      explanation: 'Explanation 1',
      points: 5,
      sort_order: 1,
    },
    {
      id: 'uuid-q2',
      assignment_id: 'uuid-assignment-1',
      question_text: 'Question 2',
      question_type: 'single',
      options: [
        { id: 'a', text: 'Wrong', is_correct: false },
        { id: 'b', text: 'Correct', is_correct: true },
      ],
      explanation: 'Explanation 2',
      points: 5,
      sort_order: 2,
    },
  ],
  toJSON: function () {
    return {
      id: this.id,
      course_id: this.course_id,
      lesson_id: this.lesson_id,
      title: this.title,
      assignment_type: this.assignment_type,
      total_points: this.total_points,
      passing_score: this.passing_score,
      attempts_allowed: this.attempts_allowed,
      show_answer_after: this.show_answer_after,
      due_date: this.due_date,
      is_published: this.is_published,
      questions: this.questions,
    };
  },
};

const mockSubmission = {
  id: 'uuid-submission-1',
  assignment_id: 'uuid-assignment-1',
  user_id: 'uuid-student-1',
  attempt_number: 1,
  answers: [
    { question_id: 'uuid-q1', selected_options: ['a'] },
    { question_id: 'uuid-q2', selected_options: ['b'] },
  ],
  score: null,
  status: 'submitted',
  feedback: null,
  graded_by: null,
  graded_at: null,
  submitted_at: new Date(),
  update: jest.fn().mockResolvedValue(true),
  toJSON: function () {
    return {
      id: this.id,
      assignment_id: this.assignment_id,
      user_id: this.user_id,
      attempt_number: this.attempt_number,
      answers: this.answers,
      score: this.score,
      status: this.status,
      feedback: this.feedback,
      graded_by: this.graded_by,
      graded_at: this.graded_at,
      submitted_at: this.submitted_at,
    };
  },
};

describe('Submission API', () => {

  describe('POST /api/assignments/:id/submit', () => {
    it('should submit quiz and auto-grade (all correct)', async () => {
      const allCorrectAnswers = [
        { question_id: 'uuid-q1', selected_options: ['a'] },
        { question_id: 'uuid-q2', selected_options: ['b'] },
      ];
      (Assignment.findByPk as jest.Mock).mockResolvedValue(mockAssignment);
      (Enrollment.findOne as jest.Mock).mockResolvedValue({ user_id: 'uuid-student-1', course_id: 'uuid-course-1', status: 'active' });
      (Submission.count as jest.Mock).mockResolvedValue(0);
      (QuizQuestion.findAll as jest.Mock).mockResolvedValue(mockAssignment.questions);
      (LessonProgress.findOne as jest.Mock).mockResolvedValue(null);
      (LessonProgress.create as jest.Mock).mockResolvedValue({});
      (Submission.create as jest.Mock).mockResolvedValue({
        ...mockSubmission,
        answers: allCorrectAnswers,
        update: jest.fn().mockResolvedValue(true),
        toJSON: () => ({ ...mockSubmission.toJSON(), answers: allCorrectAnswers }),
      });

      const res = await request(app)
        .post('/api/assignments/uuid-assignment-1/submit')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ answers: allCorrectAnswers });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.grading).toBeDefined();
      expect(res.body.data.grading.score).toBe(10);
      expect(res.body.data.grading.passed).toBe(true);
    });

    it('should submit quiz and auto-grade (partial correct)', async () => {
      const partialAnswers = [
        { question_id: 'uuid-q1', selected_options: ['a'] },
        { question_id: 'uuid-q2', selected_options: ['a'] }, // Wrong
      ];
      (Assignment.findByPk as jest.Mock).mockResolvedValue(mockAssignment);
      (Enrollment.findOne as jest.Mock).mockResolvedValue({ user_id: 'uuid-student-1', course_id: 'uuid-course-1', status: 'active' });
      (Submission.count as jest.Mock).mockResolvedValue(0);
      (QuizQuestion.findAll as jest.Mock).mockResolvedValue(mockAssignment.questions);
      (LessonProgress.findOne as jest.Mock).mockResolvedValue(null);
      (LessonProgress.create as jest.Mock).mockResolvedValue({});
      (Submission.create as jest.Mock).mockResolvedValue({
        ...mockSubmission,
        answers: partialAnswers,
        update: jest.fn().mockResolvedValue(true),
        toJSON: () => ({ ...mockSubmission.toJSON(), answers: partialAnswers }),
      });

      const res = await request(app)
        .post('/api/assignments/uuid-assignment-1/submit')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ answers: partialAnswers });

      expect(res.status).toBe(201);
      expect(res.body.data.grading.score).toBe(5);
      expect(res.body.data.grading.passed).toBe(true);
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app)
        .post('/api/assignments/uuid-assignment-1/submit')
        .send({ answers: [] });

      expect(res.status).toBe(401);
    });

    it('should return 404 if assignment not found', async () => {
      (Assignment.findByPk as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .post('/api/assignments/nonexistent/submit')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ answers: [{ question_id: 'q1', selected_options: ['a'] }] });

      expect(res.status).toBe(404);
    });

    it('should return 400 if assignment not published', async () => {
      (Assignment.findByPk as jest.Mock).mockResolvedValue({
        ...mockAssignment,
        is_published: false,
      });

      const res = await request(app)
        .post('/api/assignments/uuid-assignment-1/submit')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ answers: [{ question_id: 'q1', selected_options: ['a'] }] });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('xuất bản');
    });

    it('should return 400 if past due date', async () => {
      (Assignment.findByPk as jest.Mock).mockResolvedValue({
        ...mockAssignment,
        due_date: '2020-01-01T00:00:00.000Z',
      });

      const res = await request(app)
        .post('/api/assignments/uuid-assignment-1/submit')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ answers: [{ question_id: 'q1', selected_options: ['a'] }] });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('hạn');
    });

    it('should return 403 if not enrolled', async () => {
      (Assignment.findByPk as jest.Mock).mockResolvedValue(mockAssignment);
      (Enrollment.findOne as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .post('/api/assignments/uuid-assignment-1/submit')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ answers: [{ question_id: 'q1', selected_options: ['a'] }] });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('đăng ký');
    });

    it('should return 400 if exceeded attempts', async () => {
      (Assignment.findByPk as jest.Mock).mockResolvedValue(mockAssignment);
      (Enrollment.findOne as jest.Mock).mockResolvedValue({ user_id: 'uuid-student-1', course_id: 'uuid-course-1', status: 'active' });
      (Submission.count as jest.Mock).mockResolvedValue(2); // attempts_allowed = 2

      const res = await request(app)
        .post('/api/assignments/uuid-assignment-1/submit')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ answers: [{ question_id: 'q1', selected_options: ['a'] }] });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('hết lượt');
    });

    it('should return 400 if quiz has no answers', async () => {
      (Assignment.findByPk as jest.Mock).mockResolvedValue(mockAssignment);
      (Enrollment.findOne as jest.Mock).mockResolvedValue({ user_id: 'uuid-student-1', course_id: 'uuid-course-1', status: 'active' });
      (Submission.count as jest.Mock).mockResolvedValue(0);

      const res = await request(app)
        .post('/api/assignments/uuid-assignment-1/submit')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ answers: [] });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('trả lời');
    });

    it('should submit essay assignment', async () => {
      const essayAssignment = {
        ...mockAssignment,
        assignment_type: 'essay',
        questions: [],
        toJSON: () => ({ ...mockAssignment, assignment_type: 'essay', questions: [] }),
      };
      (Assignment.findByPk as jest.Mock).mockResolvedValue(essayAssignment);
      (Enrollment.findOne as jest.Mock).mockResolvedValue({ user_id: 'uuid-student-1', course_id: 'uuid-course-1', status: 'active' });
      (Submission.count as jest.Mock).mockResolvedValue(0);
      (Submission.create as jest.Mock).mockResolvedValue({
        ...mockSubmission,
        answers: { text: 'My essay content' },
      });

      const res = await request(app)
        .post('/api/assignments/uuid-assignment-1/submit')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ answers: { text: 'My essay content' } });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.grading).toBeNull();
    });

    it('should return 400 if essay has empty text', async () => {
      const essayAssignment = {
        ...mockAssignment,
        assignment_type: 'essay',
        questions: [],
        toJSON: () => ({ ...mockAssignment, assignment_type: 'essay', questions: [] }),
      };
      (Assignment.findByPk as jest.Mock).mockResolvedValue(essayAssignment);
      (Enrollment.findOne as jest.Mock).mockResolvedValue({ user_id: 'uuid-student-1', course_id: 'uuid-course-1', status: 'active' });
      (Submission.count as jest.Mock).mockResolvedValue(0);

      const res = await request(app)
        .post('/api/assignments/uuid-assignment-1/submit')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ answers: { text: '' } });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('bài viết');
    });

    it('should submit upload assignment', async () => {
      const uploadAssignment = {
        ...mockAssignment,
        assignment_type: 'upload',
        questions: [],
        toJSON: () => ({ ...mockAssignment, assignment_type: 'upload', questions: [] }),
      };
      (Assignment.findByPk as jest.Mock).mockResolvedValue(uploadAssignment);
      (Enrollment.findOne as jest.Mock).mockResolvedValue({ user_id: 'uuid-student-1', course_id: 'uuid-course-1', status: 'active' });
      (Submission.count as jest.Mock).mockResolvedValue(0);
      (Submission.create as jest.Mock).mockResolvedValue({
        ...mockSubmission,
        answers: { file_url: 'https://example.com/file.pdf', file_name: 'file.pdf' },
      });

      const res = await request(app)
        .post('/api/assignments/uuid-assignment-1/submit')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ answers: { file_url: 'https://example.com/file.pdf', file_name: 'file.pdf' } });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should return 400 if upload has no file_url', async () => {
      const uploadAssignment = {
        ...mockAssignment,
        assignment_type: 'upload',
        questions: [],
        toJSON: () => ({ ...mockAssignment, assignment_type: 'upload', questions: [] }),
      };
      (Assignment.findByPk as jest.Mock).mockResolvedValue(uploadAssignment);
      (Enrollment.findOne as jest.Mock).mockResolvedValue({ user_id: 'uuid-student-1', course_id: 'uuid-course-1', status: 'active' });
      (Submission.count as jest.Mock).mockResolvedValue(0);

      const res = await request(app)
        .post('/api/assignments/uuid-assignment-1/submit')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ answers: {} });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('upload');
    });
  });

  describe('GET /api/assignments/:id/submissions', () => {
    it('should return student own submissions', async () => {
      (Submission.findAll as jest.Mock).mockResolvedValue([mockSubmission]);

      const res = await request(app)
        .get('/api/assignments/uuid-assignment-1/submissions')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app)
        .get('/api/assignments/uuid-assignment-1/submissions');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/submissions/:id', () => {
    it('should return submission detail for owner', async () => {
      (Submission.findByPk as jest.Mock).mockResolvedValue({
        ...mockSubmission,
        assignment: mockAssignment,
        user: { id: 'uuid-student-1', full_name: 'Test Student', username: 'student123' },
        grader: null,
        toJSON: () => ({
          ...mockSubmission.toJSON(),
          assignment: mockAssignment.toJSON(),
          user: { id: 'uuid-student-1', full_name: 'Test Student', username: 'student123' },
          grader: null,
        }),
      });

      const res = await request(app)
        .get('/api/submissions/uuid-submission-1')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 if submission not found', async () => {
      (Submission.findByPk as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .get('/api/submissions/nonexistent')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(404);
    });

    it('should return 403 if student views other student submission', async () => {
      (Submission.findByPk as jest.Mock).mockResolvedValue({
        ...mockSubmission,
        user_id: 'uuid-other-student',
        assignment: mockAssignment,
        user: { id: 'uuid-other-student', full_name: 'Other', username: 'other' },
        toJSON: () => ({
          ...mockSubmission.toJSON(),
          user_id: 'uuid-other-student',
          assignment: mockAssignment.toJSON(),
        }),
      });

      const res = await request(app)
        .get('/api/submissions/uuid-submission-1')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
    });

    it('should include question_results for graded quiz with show_answer_after', async () => {
      (Submission.findByPk as jest.Mock).mockResolvedValue({
        ...mockSubmission,
        status: 'graded',
        score: 10,
        assignment: mockAssignment,
        user: { id: 'uuid-student-1', full_name: 'Test Student', username: 'student123' },
        grader: null,
        toJSON: () => ({
          ...mockSubmission.toJSON(),
          status: 'graded',
          score: 10,
          assignment: mockAssignment.toJSON(),
          user: { id: 'uuid-student-1', full_name: 'Test Student', username: 'student123' },
          grader: null,
        }),
      });

      const res = await request(app)
        .get('/api/submissions/uuid-submission-1')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.question_results).toBeDefined();
      expect(res.body.data.question_results.length).toBe(2);
    });
  });

  describe('GET /api/assignments/:id/grading', () => {
    it('should return submissions for grading (instructor)', async () => {
      (Assignment.findByPk as jest.Mock).mockResolvedValue(mockAssignment);
      (CourseInstructor.findOne as jest.Mock).mockResolvedValue({ instructor_id: 'uuid-instructor-1', course_id: 'uuid-course-1' });
      (Submission.findAndCountAll as jest.Mock).mockResolvedValue({
        count: 1,
        rows: [{
          ...mockSubmission,
          user: { id: 'uuid-student-1', full_name: 'Test Student', username: 'student123', email: 'student@test.com' },
        }],
      });

      const res = await request(app)
        .get('/api/assignments/uuid-assignment-1/grading')
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.pagination).toBeDefined();
    });

    it('should return 404 if assignment not found', async () => {
      (Assignment.findByPk as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .get('/api/assignments/nonexistent/grading')
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(res.status).toBe(404);
    });

    it('should return 403 if instructor is not owner', async () => {
      (Assignment.findByPk as jest.Mock).mockResolvedValue(mockAssignment);
      (CourseInstructor.findOne as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .get('/api/assignments/uuid-assignment-1/grading')
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('PUT /api/submissions/:id/grade', () => {
    it('should grade submission (instructor)', async () => {
      const essayAssignment = {
        id: 'uuid-assignment-1',
        course_id: 'uuid-course-1',
        assignment_type: 'essay',
        passing_score: 60,
        lesson_id: null,
      };
      const submissionUpdateMock = jest.fn().mockResolvedValue(true);
      const submissionWithAssignment = {
        id: 'uuid-submission-1',
        assignment_id: 'uuid-assignment-1',
        user_id: 'uuid-student-1',
        answers: { text: 'My essay' },
        score: null,
        status: 'submitted',
        assignment: essayAssignment,
        update: submissionUpdateMock,
        toJSON: () => ({
          id: 'uuid-submission-1',
          user_id: 'uuid-student-1',
          status: 'submitted',
          assignment: essayAssignment,
        }),
      };

      (Submission.findByPk as jest.Mock).mockResolvedValue(submissionWithAssignment);
      (CourseInstructor.findOne as jest.Mock).mockResolvedValue({ instructor_id: 'uuid-instructor-1', course_id: 'uuid-course-1' });
      (LessonProgress.findOne as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .put('/api/submissions/uuid-submission-1/grade')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({ score: 80, feedback: 'Good work!' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 400 if score is missing', async () => {
      (Submission.findByPk as jest.Mock).mockResolvedValue(mockSubmission);

      const res = await request(app)
        .put('/api/submissions/uuid-submission-1/grade')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({ feedback: 'Good work!' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('điểm');
    });

    it('should return 404 if submission not found', async () => {
      (Submission.findByPk as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .put('/api/submissions/nonexistent/grade')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({ score: 80 });

      expect(res.status).toBe(404);
    });

    it('should return 403 if instructor is not owner', async () => {
      (Submission.findByPk as jest.Mock).mockResolvedValue({
        ...mockSubmission,
        assignment: { ...mockAssignment, toJSON: () => mockAssignment.toJSON() },
      });
      (CourseInstructor.findOne as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .put('/api/submissions/uuid-submission-1/grade')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({ score: 80 });

      expect(res.status).toBe(403);
    });
  });
});
