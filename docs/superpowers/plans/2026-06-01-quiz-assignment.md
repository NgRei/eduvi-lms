# Quiz & Assignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Build a complete assignment system with Quiz (auto-grade), Essay (manual grade), and Upload (manual grade) types, integrated with the lesson flow.

**Architecture:** Two backend modules (assignment + submission) following existing controller/route patterns. Frontend uses ProTable for instructor management and plain antd forms for student quiz/essay/upload interfaces. Quiz auto-grades on submission; essay/upload await instructor grading.

**Tech Stack:** Express.js, Sequelize, MySQL, React 19, Ant Design Pro (UmiJS), ProComponents

**Spec:** `docs/superpowers/specs/2026-06-01-quiz-assignment-design.md`

---

## File Structure

### New Files

| File | Responsibility |
|------|----------------|
| `backend/src/models/Submission.model.ts` | Submission Sequelize model |
| `backend/src/controllers/assignment.controller.ts` | CRUD assignments + questions |
| `backend/src/controllers/submission.controller.ts` | Submit, grade, view results |
| `backend/src/routes/assignment.routes.ts` | Assignment API routes |
| `backend/src/routes/submission.routes.ts` | Submission API routes |
| `backend/src/tests/assignment.test.ts` | Assignment CRUD tests |
| `backend/src/tests/submission.test.ts` | Submission + grading tests |
| `frontend/src/services/ant-design-pro/assignments.ts` | Frontend API service |
| `frontend/src/pages/instructor/assignments/index.tsx` | Assignment list (ProTable) |
| `frontend/src/pages/instructor/assignments/create/index.tsx` | Create assignment form |
| `frontend/src/pages/instructor/assignments/edit/index.tsx` | Edit assignment form |
| `frontend/src/pages/instructor/assignments/submissions/index.tsx` | View & grade submissions |
| `frontend/src/pages/student/assignments/take/index.tsx` | Take assignment (quiz/essay/upload) |
| `frontend/src/pages/student/assignments/result/index.tsx` | View results |

### Modified Files

| File | Change |
|------|--------|
| `backend/src/models/index.ts` | Add Submission associations |
| `backend/src/app.ts` | Register assignment + submission routes |
| `backend/src/seeders/course-seeder.ts` | Add essay/upload assignments + sample submissions |
| `database/eduvi_lms.sql` | Add submissions table + seed data |
| `frontend/config/routes.ts` | Add assignment routes |

---

## Task 1: Create Submission Model

**Files:**
- Create: `backend/src/models/Submission.model.ts`

- [x] **Step 1: Create Submission model file**

```typescript
// backend/src/models/Submission.model.ts
import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export class Submission extends Model {
  declare id: string;
  declare assignment_id: string;
  declare user_id: string;
  declare attempt_number: number;
  declare answers: any;
  declare score: number | null;
  declare status: 'in_progress' | 'submitted' | 'graded';
  declare feedback: string | null;
  declare graded_by: string | null;
  declare graded_at: Date | null;
  declare submitted_at: Date;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Submission.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    assignment_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'assignments', key: 'id' },
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    attempt_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    answers: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    score: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: null,
    },
    status: {
      type: DataTypes.ENUM('in_progress', 'submitted', 'graded'),
      allowNull: false,
      defaultValue: 'submitted',
    },
    feedback: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    graded_by: {
      type: DataTypes.UUID,
      allowNull: true,
      defaultValue: null,
      references: { model: 'users', key: 'id' },
    },
    graded_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    submitted_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'submissions',
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['assignment_id', 'user_id', 'attempt_number'],
        name: 'uk_assignment_user_attempt',
      },
      { fields: ['assignment_id'], name: 'idx_submission_assignment' },
      { fields: ['user_id'], name: 'idx_submission_user' },
    ],
  }
);
```

- [x] **Step 2: Verify model compiles**

Run: `cd backend && npx tsc --noEmit`
Expected: No errors related to Submission.model.ts

- [x] **Step 3: Commit**

```bash
git add backend/src/models/Submission.model.ts
git commit -m "feat(backend): add Submission model for quiz/essay/upload assignments"
```

---

## Task 2: Update Model Associations

**Files:**
- Modify: `backend/src/models/index.ts`

- [x] **Step 1: Add Submission import and associations**

Add to imports (after QuizQuestion import):
```typescript
import { Submission } from './Submission.model';
```

Add associations (after QuizQuestion associations):
```typescript
// Assignment 1-to-many Submission
Assignment.hasMany(Submission, { foreignKey: 'assignment_id', as: 'submissions', onDelete: 'CASCADE' });
Submission.belongsTo(Assignment, { foreignKey: 'assignment_id', as: 'assignment' });

// User 1-to-many Submission
User.hasMany(Submission, { foreignKey: 'user_id', as: 'submissions', onDelete: 'CASCADE' });
Submission.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User (grader) 1-to-many Submission
User.hasMany(Submission, { foreignKey: 'graded_by', as: 'graded_submissions' });
Submission.belongsTo(User, { foreignKey: 'graded_by', as: 'grader' });
```

Add to exports:
```typescript
export {
  // ... existing exports
  Submission
};
```

- [x] **Step 2: Verify compilation**

Run: `cd backend && npx tsc --noEmit`
Expected: No errors

- [x] **Step 3: Commit**

```bash
git add backend/src/models/index.ts
git commit -m "feat(backend): add Submission associations to models index"
```

---

## Task 3: Create Assignment Controller

**Files:**
- Create: `backend/src/controllers/assignment.controller.ts`

- [x] **Step 1: Create assignment controller with CRUD operations**

```typescript
// backend/src/controllers/assignment.controller.ts
import { Response } from 'express';
import { Assignment, QuizQuestion, Course, Lesson, CourseInstructor, Submission } from '../models';
import { AuthRequest } from '../middlewares/auth.middleware';

// Helper: Check if user is instructor of the course
const isInstructorOfCourse = async (userId: string, courseId: string): Promise<boolean> => {
  const courseInstructor = await CourseInstructor.findOne({
    where: { instructor_id: userId, course_id: courseId },
  });
  return !!courseInstructor;
};

// POST /api/assignments - Tạo assignment mới
export const createAssignment = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Chưa xác thực người dùng!' });
    }

    const { lesson_id, title, description, assignment_type, total_points, passing_score, time_limit_minutes, attempts_allowed, show_answer_after, due_date } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, error: 'Vui lòng cung cấp tiêu đề bài tập!' });
    }

    // Get course_id from lesson if lesson_id provided
    let course_id = req.body.course_id;
    if (lesson_id) {
      const lesson = await Lesson.findByPk(lesson_id);
      if (!lesson) {
        return res.status(404).json({ success: false, error: 'Không tìm thấy bài học!' });
      }
      course_id = lesson.course_id;
    }

    if (!course_id) {
      return res.status(400).json({ success: false, error: 'Vui lòng cung cấp course_id hoặc lesson_id!' });
    }

    // Check authorization
    if (req.user.user_type !== 'admin') {
      const isOwner = await isInstructorOfCourse(req.user.id, course_id);
      if (!isOwner) {
        return res.status(403).json({ success: false, error: 'Bạn không có quyền tạo bài tập cho khóa học này!' });
      }
    }

    const assignment = await Assignment.create({
      course_id,
      lesson_id: lesson_id || null,
      title,
      description: description || null,
      assignment_type: assignment_type || 'quiz',
      total_points: total_points || 100,
      passing_score: passing_score || 50,
      time_limit_minutes: time_limit_minutes || null,
      attempts_allowed: attempts_allowed || 1,
      show_answer_after: show_answer_after || false,
      due_date: due_date || null,
      is_published: false,
    });

    return res.status(201).json({
      success: true,
      message: 'Tạo bài tập thành công!',
      data: assignment,
    });
  } catch (error: any) {
    console.error('createAssignment Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra khi tạo bài tập!' });
  }
};

// GET /api/assignments - Lấy danh sách assignments
export const getAssignments = async (req: AuthRequest, res: Response) => {
  try {
    const { lesson_id, course_id, type, is_published, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const where: any = {};
    if (lesson_id) where.lesson_id = lesson_id;
    if (course_id) where.course_id = course_id;
    if (type) where.assignment_type = type;
    if (is_published !== undefined) where.is_published = is_published === 'true';

    // Students only see published assignments
    if (req.user?.user_type === 'student') {
      where.is_published = true;
    }

    const { count, rows } = await Assignment.findAndCountAll({
      where,
      include: [
        { model: QuizQuestion, as: 'questions', attributes: ['id'] },
        { model: Course, as: 'course', attributes: ['id', 'title'] },
        { model: Lesson, as: 'lesson', attributes: ['id', 'title'] },
      ],
      order: [['created_at', 'DESC']],
      limit: limitNum,
      offset,
      distinct: true,
    });

    return res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count,
        totalPages: Math.ceil(count / limitNum),
      },
    });
  } catch (error: any) {
    console.error('getAssignments Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra khi lấy danh sách bài tập!' });
  }
};

// GET /api/assignments/:id - Chi tiết assignment
export const getAssignmentById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const assignment = await Assignment.findByPk(id, {
      include: [
        {
          model: QuizQuestion,
          as: 'questions',
          order: [['sort_order', 'ASC']],
        },
        { model: Course, as: 'course', attributes: ['id', 'title'] },
        { model: Lesson, as: 'lesson', attributes: ['id', 'title'] },
      ],
    });

    if (!assignment) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy bài tập!' });
    }

    // Students can only view published assignments
    if (req.user?.user_type === 'student' && !assignment.is_published) {
      return res.status(403).json({ success: false, error: 'Bài tập chưa được xuất bản!' });
    }

    // Hide correct answers from students
    if (req.user?.user_type === 'student' && assignment.assignment_type === 'quiz') {
      const questions = (assignment as any).questions?.map((q: any) => ({
        ...q.toJSON(),
        options: q.options.map((opt: any) => ({
          id: opt.id,
          text: opt.text,
          // Don't include is_correct
        })),
        explanation: undefined, // Hide explanation until after submission
      }));
      return res.status(200).json({
        success: true,
        data: { ...assignment.toJSON(), questions },
      });
    }

    return res.status(200).json({
      success: true,
      data: assignment,
    });
  } catch (error: any) {
    console.error('getAssignmentById Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra khi lấy thông tin bài tập!' });
  }
};

// PUT /api/assignments/:id - Cập nhật assignment
export const updateAssignment = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Chưa xác thực người dùng!' });
    }

    const { id } = req.params;
    const assignment = await Assignment.findByPk(id);

    if (!assignment) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy bài tập!' });
    }

    // Check authorization
    if (req.user.user_type !== 'admin') {
      const isOwner = await isInstructorOfCourse(req.user.id, assignment.course_id);
      if (!isOwner) {
        return res.status(403).json({ success: false, error: 'Bạn không có quyền chỉnh sửa bài tập này!' });
      }
    }

    const { title, description, assignment_type, total_points, passing_score, time_limit_minutes, attempts_allowed, show_answer_after, due_date } = req.body;

    await assignment.update({
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(assignment_type !== undefined && { assignment_type }),
      ...(total_points !== undefined && { total_points }),
      ...(passing_score !== undefined && { passing_score }),
      ...(time_limit_minutes !== undefined && { time_limit_minutes }),
      ...(attempts_allowed !== undefined && { attempts_allowed }),
      ...(show_answer_after !== undefined && { show_answer_after }),
      ...(due_date !== undefined && { due_date }),
    });

    return res.status(200).json({
      success: true,
      message: 'Cập nhật bài tập thành công!',
      data: assignment,
    });
  } catch (error: any) {
    console.error('updateAssignment Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra khi cập nhật bài tập!' });
  }
};

// DELETE /api/assignments/:id - Xóa assignment
export const deleteAssignment = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Chưa xác thực người dùng!' });
    }

    const { id } = req.params;
    const assignment = await Assignment.findByPk(id);

    if (!assignment) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy bài tập!' });
    }

    // Check authorization
    if (req.user.user_type !== 'admin') {
      const isOwner = await isInstructorOfCourse(req.user.id, assignment.course_id);
      if (!isOwner) {
        return res.status(403).json({ success: false, error: 'Bạn không có quyền xóa bài tập này!' });
      }
    }

    await assignment.destroy(); // Soft delete (paranoid: true)

    return res.status(200).json({
      success: true,
      message: 'Xóa bài tập thành công!',
    });
  } catch (error: any) {
    console.error('deleteAssignment Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra khi xóa bài tập!' });
  }
};

// PATCH /api/assignments/:id/publish - Publish/unpublish
export const togglePublish = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Chưa xác thực người dùng!' });
    }

    const { id } = req.params;
    const assignment = await Assignment.findByPk(id);

    if (!assignment) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy bài tập!' });
    }

    // Check authorization
    if (req.user.user_type !== 'admin') {
      const isOwner = await isInstructorOfCourse(req.user.id, assignment.course_id);
      if (!isOwner) {
        return res.status(403).json({ success: false, error: 'Bạn không có quyền thay đổi trạng thái bài tập này!' });
      }
    }

    await assignment.update({ is_published: !assignment.is_published });

    return res.status(200).json({
      success: true,
      message: assignment.is_published ? 'Đã xuất bản bài tập!' : 'Đã ẩn bài tập!',
      data: assignment,
    });
  } catch (error: any) {
    console.error('togglePublish Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra khi thay đổi trạng thái!' });
  }
};

// POST /api/assignments/:id/questions - Thêm câu hỏi
export const addQuestion = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Chưa xác thực người dùng!' });
    }

    const { id } = req.params;
    const assignment = await Assignment.findByPk(id);

    if (!assignment) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy bài tập!' });
    }

    if (assignment.assignment_type !== 'quiz') {
      return res.status(400).json({ success: false, error: 'Chỉ bài tập loại quiz mới có câu hỏi!' });
    }

    // Check authorization
    if (req.user.user_type !== 'admin') {
      const isOwner = await isInstructorOfCourse(req.user.id, assignment.course_id);
      if (!isOwner) {
        return res.status(403).json({ success: false, error: 'Bạn không có quyền thêm câu hỏi!' });
      }
    }

    const { question_text, question_type, options, explanation, points, sort_order } = req.body;

    if (!question_text || !options || !Array.isArray(options)) {
      return res.status(400).json({ success: false, error: 'Vui lòng cung cấp đầy đủ thông tin câu hỏi!' });
    }

    // Get max sort_order
    const maxOrder = await QuizQuestion.max('sort_order', {
      where: { assignment_id: id },
    }) || 0;

    const question = await QuizQuestion.create({
      assignment_id: id,
      question_text,
      question_type: question_type || 'single',
      options,
      explanation: explanation || null,
      points: points || 1,
      sort_order: sort_order !== undefined ? sort_order : maxOrder + 1,
    });

    return res.status(201).json({
      success: true,
      message: 'Thêm câu hỏi thành công!',
      data: question,
    });
  } catch (error: any) {
    console.error('addQuestion Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra khi thêm câu hỏi!' });
  }
};

// PUT /api/questions/:id - Sửa câu hỏi
export const updateQuestion = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Chưa xác thực người dùng!' });
    }

    const { id } = req.params;
    const question = await QuizQuestion.findByPk(id, {
      include: [{ model: Assignment, as: 'assignment' }],
    });

    if (!question) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy câu hỏi!' });
    }

    // Check authorization
    if (req.user.user_type !== 'admin') {
      const isOwner = await isInstructorOfCourse(req.user.id, (question as any).assignment.course_id);
      if (!isOwner) {
        return res.status(403).json({ success: false, error: 'Bạn không có quyền sửa câu hỏi!' });
      }
    }

    const { question_text, question_type, options, explanation, points, sort_order } = req.body;

    await question.update({
      ...(question_text !== undefined && { question_text }),
      ...(question_type !== undefined && { question_type }),
      ...(options !== undefined && { options }),
      ...(explanation !== undefined && { explanation }),
      ...(points !== undefined && { points }),
      ...(sort_order !== undefined && { sort_order }),
    });

    return res.status(200).json({
      success: true,
      message: 'Cập nhật câu hỏi thành công!',
      data: question,
    });
  } catch (error: any) {
    console.error('updateQuestion Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra khi cập nhật câu hỏi!' });
  }
};

// DELETE /api/questions/:id - Xóa câu hỏi
export const deleteQuestion = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Chưa xác thực người dùng!' });
    }

    const { id } = req.params;
    const question = await QuizQuestion.findByPk(id, {
      include: [{ model: Assignment, as: 'assignment' }],
    });

    if (!question) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy câu hỏi!' });
    }

    // Check authorization
    if (req.user.user_type !== 'admin') {
      const isOwner = await isInstructorOfCourse(req.user.id, (question as any).assignment.course_id);
      if (!isOwner) {
        return res.status(403).json({ success: false, error: 'Bạn không có quyền xóa câu hỏi!' });
      }
    }

    await question.destroy();

    return res.status(200).json({
      success: true,
      message: 'Xóa câu hỏi thành công!',
    });
  } catch (error: any) {
    console.error('deleteQuestion Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra khi xóa câu hỏi!' });
  }
};

// PUT /api/assignments/:id/questions/reorder - Sắp xếp câu hỏi
export const reorderQuestions = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Chưa xác thực người dùng!' });
    }

    const { id } = req.params;
    const { order } = req.body; // Array of question IDs in new order

    if (!order || !Array.isArray(order)) {
      return res.status(400).json({ success: false, error: 'Vui lòng cung cấp thứ tự sắp xếp!' });
    }

    const assignment = await Assignment.findByPk(id);
    if (!assignment) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy bài tập!' });
    }

    // Check authorization
    if (req.user.user_type !== 'admin') {
      const isOwner = await isInstructorOfCourse(req.user.id, assignment.course_id);
      if (!isOwner) {
        return res.status(403).json({ success: false, error: 'Bạn không có quyền sắp xếp câu hỏi!' });
      }
    }

    // Update sort_order for each question
    for (let i = 0; i < order.length; i++) {
      await QuizQuestion.update(
        { sort_order: i + 1 },
        { where: { id: order[i], assignment_id: id } }
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Sắp xếp câu hỏi thành công!',
    });
  } catch (error: any) {
    console.error('reorderQuestions Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra khi sắp xếp câu hỏi!' });
  }
};
```

- [x] **Step 2: Verify compilation**

Run: `cd backend && npx tsc --noEmit`
Expected: No errors

- [x] **Step 3: Commit**

```bash
git add backend/src/controllers/assignment.controller.ts
git commit -m "feat(backend): add assignment controller with CRUD and question management"
```

---

## Task 4: Create Assignment Routes

**Files:**
- Create: `backend/src/routes/assignment.routes.ts`

- [x] **Step 1: Create assignment routes file**

```typescript
// backend/src/routes/assignment.routes.ts
import { Router } from 'express';
import {
  createAssignment,
  getAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
  togglePublish,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  reorderQuestions,
} from '../controllers/assignment.controller';
import { authenticateToken, authorizeRole } from '../middlewares/auth.middleware';

const router = Router();

// Public routes (students can view published assignments)
router.get('/', authenticateToken as any, getAssignments as any);
router.get('/:id', authenticateToken as any, getAssignmentById as any);

// Protected routes - Instructor & Admin
router.post('/', authenticateToken as any, authorizeRole('instructor', 'admin') as any, createAssignment as any);
router.put('/:id', authenticateToken as any, authorizeRole('instructor', 'admin') as any, updateAssignment as any);
router.delete('/:id', authenticateToken as any, authorizeRole('instructor', 'admin') as any, deleteAssignment as any);
router.patch('/:id/publish', authenticateToken as any, authorizeRole('instructor', 'admin') as any, togglePublish as any);

// Question management
router.post('/:id/questions', authenticateToken as any, authorizeRole('instructor', 'admin') as any, addQuestion as any);
router.put('/questions/:id', authenticateToken as any, authorizeRole('instructor', 'admin') as any, updateQuestion as any);
router.delete('/questions/:id', authenticateToken as any, authorizeRole('instructor', 'admin') as any, deleteQuestion as any);
router.put('/:id/questions/reorder', authenticateToken as any, authorizeRole('instructor', 'admin') as any, reorderQuestions as any);

export default router;
```

- [x] **Step 2: Verify compilation**

Run: `cd backend && npx tsc --noEmit`
Expected: No errors

- [x] **Step 3: Commit**

```bash
git add backend/src/routes/assignment.routes.ts
git commit -m "feat(backend): add assignment routes with auth middleware"
```

---

## Task 5: Create Submission Controller with Auto-grading

**Files:**
- Create: `backend/src/controllers/submission.controller.ts`

- [x] **Step 1: Create submission controller**

```typescript
// backend/src/controllers/submission.controller.ts
import { Response } from 'express';
import { Op } from 'sequelize';
import { Submission, Assignment, QuizQuestion, User, Enrollment, LessonProgress, CourseInstructor } from '../models';
import { AuthRequest } from '../middlewares/auth.middleware';

// Helper: Check if user is instructor of the course
const isInstructorOfCourse = async (userId: string, courseId: string): Promise<boolean> => {
  const courseInstructor = await CourseInstructor.findOne({
    where: { instructor_id: userId, course_id: courseId },
  });
  return !!courseInstructor;
};

// Auto-grade quiz submission
const gradeQuizSubmission = async (submission: any, assignment: any) => {
  const questions = await QuizQuestion.findAll({
    where: { assignment_id: assignment.id },
    order: [['sort_order', 'ASC']],
  });

  const answers = submission.answers || [];
  let totalScore = 0;
  const results: any[] = [];

  for (const question of questions) {
    const studentAnswer = answers.find((a: any) => a.question_id === question.id);
    const correctOptions = question.options
      .filter((o: any) => o.is_correct)
      .map((o: any) => o.id)
      .sort();
    const selectedOptions = (studentAnswer?.selected_options || []).sort();

    const isCorrect =
      correctOptions.length === selectedOptions.length &&
      correctOptions.every((opt: string, idx: number) => opt === selectedOptions[idx]);

    if (isCorrect) {
      totalScore += question.points;
    }

    results.push({
      question_id: question.id,
      question_text: question.question_text,
      is_correct: isCorrect,
      selected: selectedOptions,
      correct: correctOptions,
      points_earned: isCorrect ? question.points : 0,
      points_possible: question.points,
      explanation: question.explanation,
    });
  }

  await submission.update({
    score: totalScore,
    status: 'graded',
  });

  return {
    score: totalScore,
    total: assignment.total_points,
    passed: totalScore >= assignment.passing_score,
    results,
  };
};

// POST /api/assignments/:id/submit - Nộp bài
export const submitAssignment = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Chưa xác thực người dùng!' });
    }

    const { id } = req.params;
    const { answers } = req.body;

    // Find assignment
    const assignment = await Assignment.findByPk(id, {
      include: [{ model: QuizQuestion, as: 'questions' }],
    });

    if (!assignment) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy bài tập!' });
    }

    // Check if published
    if (!assignment.is_published) {
      return res.status(400).json({ success: false, error: 'Bài tập chưa được xuất bản!' });
    }

    // Check due date
    if (assignment.due_date && new Date() > new Date(assignment.due_date)) {
      return res.status(400).json({ success: false, error: 'Đã quá hạn nộp bài!' });
    }

    // Check enrollment
    const enrollment = await Enrollment.findOne({
      where: { user_id: req.user.id, course_id: assignment.course_id, status: 'active' },
    });

    if (!enrollment) {
      return res.status(403).json({ success: false, error: 'Bạn chưa đăng ký khóa học này!' });
    }

    // Check attempts
    const existingSubmissions = await Submission.count({
      where: { assignment_id: id, user_id: req.user.id },
    });

    if (existingSubmissions >= assignment.attempts_allowed) {
      return res.status(400).json({ success: false, error: 'Bạn đã hết lượt nộp bài!' });
    }

    // Validate answers based on type
    if (assignment.assignment_type === 'quiz') {
      if (!answers || !Array.isArray(answers) || answers.length === 0) {
        return res.status(400).json({ success: false, error: 'Vui lòng trả lời ít nhất một câu hỏi!' });
      }
    } else if (assignment.assignment_type === 'essay') {
      if (!answers?.text || answers.text.trim().length === 0) {
        return res.status(400).json({ success: false, error: 'Vui lòng nhập nội dung bài viết!' });
      }
    } else if (assignment.assignment_type === 'upload') {
      if (!answers?.file_url) {
        return res.status(400).json({ success: false, error: 'Vui lòng upload file!' });
      }
    }

    // Create submission
    const submission = await Submission.create({
      assignment_id: id,
      user_id: req.user.id,
      attempt_number: existingSubmissions + 1,
      answers,
      status: 'submitted',
      submitted_at: new Date(),
    });

    // Auto-grade quiz
    let gradingResult = null;
    if (assignment.assignment_type === 'quiz') {
      gradingResult = await gradeQuizSubmission(submission, assignment);

      // Update LessonProgress if passed and assignment is linked to a lesson
      if (gradingResult.passed && assignment.lesson_id) {
        const progress = await LessonProgress.findOne({
          where: { user_id: req.user.id, lesson_id: assignment.lesson_id },
        });

        if (progress) {
          await progress.update({
            status: 'completed',
            quiz_score: gradingResult.score,
          });
        } else {
          await LessonProgress.create({
            user_id: req.user.id,
            lesson_id: assignment.lesson_id,
            course_id: assignment.course_id,
            status: 'completed',
            quiz_score: gradingResult.score,
          });
        }
      }
    }

    return res.status(201).json({
      success: true,
      message: assignment.assignment_type === 'quiz' ? 'Nộp bài và chấm điểm thành công!' : 'Nộp bài thành công! Chờ giảng viên chấm điểm.',
      data: {
        submission,
        grading: gradingResult,
      },
    });
  } catch (error: any) {
    console.error('submitAssignment Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra khi nộp bài!' });
  }
};

// GET /api/assignments/:id/submissions - Lịch sử nộp bài của mình
export const getMySubmissions = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Chưa xác thực người dùng!' });
    }

    const { id } = req.params;

    const submissions = await Submission.findAll({
      where: { assignment_id: id, user_id: req.user.id },
      order: [['attempt_number', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      data: submissions,
    });
  } catch (error: any) {
    console.error('getMySubmissions Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra khi lấy lịch sử nộp bài!' });
  }
};

// GET /api/submissions/:id - Chi tiết submission
export const getSubmissionById = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Chưa xác thực người dùng!' });
    }

    const { id } = req.params;

    const submission = await Submission.findByPk(id, {
      include: [
        {
          model: Assignment,
          as: 'assignment',
          include: [{ model: QuizQuestion, as: 'questions' }],
        },
        { model: User, as: 'user', attributes: ['id', 'full_name', 'username'] },
        { model: User, as: 'grader', attributes: ['id', 'full_name'] },
      ],
    });

    if (!submission) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy bài nộp!' });
    }

    // Students can only view their own submissions
    if (req.user.user_type === 'student' && submission.user_id !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Bạn chỉ có thể xem bài nộp của mình!' });
    }

    // If quiz is graded and show_answer_after is true, include question details
    let responseData: any = submission.toJSON();
    if (
      submission.status === 'graded' &&
      (submission as any).assignment?.show_answer_after &&
      (submission as any).assignment?.assignment_type === 'quiz'
    ) {
      const questions = (submission as any).assignment?.questions || [];
      const answers = submission.answers || [];
      responseData.question_results = questions.map((q: any) => {
        const studentAnswer = answers.find((a: any) => a.question_id === q.id);
        const correctOptions = q.options.filter((o: any) => o.is_correct).map((o: any) => o.id);
        const selectedOptions = studentAnswer?.selected_options || [];
        const isCorrect =
          correctOptions.length === selectedOptions.length &&
          correctOptions.every((opt: string) => selectedOptions.includes(opt));

        return {
          question_id: q.id,
          question_text: q.question_text,
          question_type: q.question_type,
          options: q.options,
          selected_options: selectedOptions,
          is_correct: isCorrect,
          points: q.points,
          explanation: q.explanation,
        };
      });
    }

    return res.status(200).json({
      success: true,
      data: responseData,
    });
  } catch (error: any) {
    console.error('getSubmissionById Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra khi lấy thông tin bài nộp!' });
  }
};

// GET /api/assignments/:id/grading - List submissions cần chấm (instructor)
export const getSubmissionsForGrading = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Chưa xác thực người dùng!' });
    }

    const { id } = req.params;
    const { status, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    // Find assignment and check authorization
    const assignment = await Assignment.findByPk(id);
    if (!assignment) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy bài tập!' });
    }

    if (req.user.user_type !== 'admin') {
      const isOwner = await isInstructorOfCourse(req.user.id, assignment.course_id);
      if (!isOwner) {
        return res.status(403).json({ success: false, error: 'Bạn không có quyền xem bài nộp của khóa học này!' });
      }
    }

    const where: any = { assignment_id: id };
    if (status) where.status = status;

    const { count, rows } = await Submission.findAndCountAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'full_name', 'username', 'email'] },
      ],
      order: [['submitted_at', 'DESC']],
      limit: limitNum,
      offset,
      distinct: true,
    });

    return res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count,
        totalPages: Math.ceil(count / limitNum),
      },
    });
  } catch (error: any) {
    console.error('getSubmissionsForGrading Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra khi lấy danh sách bài nộp!' });
  }
};

// PUT /api/submissions/:id/grade - Chấm bài (instructor)
export const gradeSubmission = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Chưa xác thực người dùng!' });
    }

    const { id } = req.params;
    const { score, feedback } = req.body;

    if (score === undefined || score === null) {
      return res.status(400).json({ success: false, error: 'Vui lòng cung cấp điểm số!' });
    }

    const submission = await Submission.findByPk(id, {
      include: [{ model: Assignment, as: 'assignment' }],
    });

    if (!submission) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy bài nộp!' });
    }

    // Check authorization
    if (req.user.user_type !== 'admin') {
      const isOwner = await isInstructorOfCourse(req.user.id, (submission as any).assignment.course_id);
      if (!isOwner) {
        return res.status(403).json({ success: false, error: 'Bạn không có quyền chấm bài nộp này!' });
      }
    }

    await submission.update({
      score,
      feedback: feedback || null,
      status: 'graded',
      graded_by: req.user.id,
      graded_at: new Date(),
    });

    // Update LessonProgress if passed
    const assignment = (submission as any).assignment;
    if (score >= assignment.passing_score && assignment.lesson_id) {
      const progress = await LessonProgress.findOne({
        where: { user_id: submission.user_id, lesson_id: assignment.lesson_id },
      });

      if (progress) {
        await progress.update({
          status: 'completed',
          quiz_score: score,
        });
      } else {
        await LessonProgress.create({
          user_id: submission.user_id,
          lesson_id: assignment.lesson_id,
          course_id: assignment.course_id,
          status: 'completed',
          quiz_score: score,
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Chấm bài thành công!',
      data: submission,
    });
  } catch (error: any) {
    console.error('gradeSubmission Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra khi chấm bài!' });
  }
};
```

- [x] **Step 2: Verify compilation**

Run: `cd backend && npx tsc --noEmit`
Expected: No errors

- [x] **Step 3: Commit**

```bash
git add backend/src/controllers/submission.controller.ts
git commit -m "feat(backend): add submission controller with auto-grading and manual grading"
```

---

## Task 6: Create Submission Routes & Register All Routes

**Files:**
- Create: `backend/src/routes/submission.routes.ts`
- Modify: `backend/src/app.ts`

- [x] **Step 1: Create submission routes file**

```typescript
// backend/src/routes/submission.routes.ts
import { Router } from 'express';
import {
  submitAssignment,
  getMySubmissions,
  getSubmissionById,
  getSubmissionsForGrading,
  gradeSubmission,
} from '../controllers/submission.controller';
import { authenticateToken, authorizeRole } from '../middlewares/auth.middleware';

const router = Router();

// Student routes
router.post('/assignments/:id/submit', authenticateToken as any, authorizeRole('student') as any, submitAssignment as any);
router.get('/assignments/:id/submissions', authenticateToken as any, getMySubmissions as any);

// Shared routes
router.get('/submissions/:id', authenticateToken as any, getSubmissionById as any);

// Instructor routes
router.get('/assignments/:id/grading', authenticateToken as any, authorizeRole('instructor', 'admin') as any, getSubmissionsForGrading as any);
router.put('/submissions/:id/grade', authenticateToken as any, authorizeRole('instructor', 'admin') as any, gradeSubmission as any);

export default router;
```

- [x] **Step 2: Register routes in app.ts**

Add imports after admin routes import:
```typescript
import assignmentRoutes from './routes/assignment.routes';
import submissionRoutes from './routes/submission.routes';
```

Add route registrations after admin routes:
```typescript
app.use('/api/assignments', assignmentRoutes);
app.use('/api', submissionRoutes);
```

- [x] **Step 3: Verify compilation**

Run: `cd backend && npx tsc --noEmit`
Expected: No errors

- [x] **Step 4: Commit**

```bash
git add backend/src/routes/submission.routes.ts backend/src/app.ts
git commit -m "feat(backend): add submission routes and register assignment/submission routes"
```

---

## hoanh: Write Backend Tests

**Files:**
- Create: `backend/src/tests/assignment.test.ts`
- Create: `backend/src/tests/submission.test.ts`

- [x] **Step 1: Create assignment test file**

```typescript
// backend/src/tests/assignment.test.ts
import request from 'supertest';
import app from '../app';
import { sequelize } from '../config/database';
import { Assignment, QuizQuestion } from '../models';

let instructorToken: string;
let studentToken: string;
let assignmentId: string;
let questionId: string;

beforeAll(async () => {
  await sequelize.sync({ force: true });

  // Login as instructor
  const instructorRes = await request(app)
    .post('/api/auth/login')
    .send({ usernameOrEmail: 'instructor@demo.com', password: 'ant.design' });
  instructorToken = instructorRes.body.token;

  // Login as student
  const studentRes = await request(app)
    .post('/api/auth/login')
    .send({ usernameOrEmail: 'student@demo.com', password: 'ant.design' });
  studentToken = studentRes.body.token;
});

afterAll(async () => {
  await sequelize.close();
});

describe('Assignment API', () => {
  test('POST /api/assignments - Create assignment', async () => {
    const res = await request(app)
      .post('/api/assignments')
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({
        title: 'Test Quiz',
        assignment_type: 'quiz',
        total_points: 100,
        passing_score: 50,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Test Quiz');
    assignmentId = res.body.data.id;
  });

  test('GET /api/assignments - List assignments', async () => {
    const res = await request(app)
      .get('/api/assignments')
      .set('Authorization', `Bearer ${instructorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  test('POST /api/assignments/:id/questions - Add question', async () => {
    const res = await request(app)
      .post(`/api/assignments/${assignmentId}/questions`)
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
    questionId = res.body.data.id;
  });

  test('PATCH /api/assignments/:id/publish - Publish assignment', async () => {
    const res = await request(app)
      .patch(`/api/assignments/${assignmentId}/publish`)
      .set('Authorization', `Bearer ${instructorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.is_published).toBe(true);
  });

  test('Student cannot create assignment', async () => {
    const res = await request(app)
      .post('/api/assignments')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ title: 'Test' });

    expect(res.status).toBe(403);
  });
});
```

- [x] **Step 2: Create submission test file**

```typescript
// backend/src/tests/submission.test.ts
import request from 'supertest';
import app from '../app';
import { sequelize } from '../config/database';

let instructorToken: string;
let studentToken: string;
let assignmentId: string;
let submissionId: string;

beforeAll(async () => {
  await sequelize.sync({ force: true });

  // Login
  const instructorRes = await request(app)
    .post('/api/auth/login')
    .send({ usernameOrEmail: 'instructor@demo.com', password: 'ant.design' });
  instructorToken = instructorRes.body.token;

  const studentRes = await request(app)
    .post('/api/auth/login')
    .send({ usernameOrEmail: 'student@demo.com', password: 'ant.design' });
  studentToken = studentRes.body.token;

  // Create and publish a quiz assignment
  const assignmentRes = await request(app)
    .post('/api/assignments')
    .set('Authorization', `Bearer ${instructorToken}`)
    .send({
      title: 'Test Quiz for Submission',
      assignment_type: 'quiz',
      total_points: 10,
      passing_score: 5,
      attempts_allowed: 2,
    });
  assignmentId = assignmentRes.body.data.id;

  // Add questions
  await request(app)
    .post(`/api/assignments/${assignmentId}/questions`)
    .set('Authorization', `Bearer ${instructorToken}`)
    .send({
      question_text: 'Question 1',
      question_type: 'single',
      options: [
        { id: 'a', text: 'Correct', is_correct: true },
        { id: 'b', text: 'Wrong', is_correct: false },
      ],
      points: 5,
    });

  await request(app)
    .post(`/api/assignments/${assignmentId}/questions`)
    .set('Authorization', `Bearer ${instructorToken}`)
    .send({
      question_text: 'Question 2',
      question_type: 'single',
      options: [
        { id: 'a', text: 'Wrong', is_correct: false },
        { id: 'b', text: 'Correct', is_correct: true },
      ],
      points: 5,
    });

  // Publish
  await request(app)
    .patch(`/api/assignments/${assignmentId}/publish`)
    .set('Authorization', `Bearer ${instructorToken}`);
});

afterAll(async () => {
  await sequelize.close();
});

describe('Submission API', () => {
  test('POST /api/assignments/:id/submit - Submit quiz', async () => {
    const res = await request(app)
      .post(`/api/assignments/${assignmentId}/submit`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        answers: [
          { question_id: 'q1', selected_options: ['a'] },
          { question_id: 'q2', selected_options: ['b'] },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.grading).toBeDefined();
    expect(res.body.data.submission.status).toBe('graded');
    submissionId = res.body.data.submission.id;
  });

  test('GET /api/assignments/:id/submissions - Get my submissions', async () => {
    const res = await request(app)
      .get(`/api/assignments/${assignmentId}/submissions`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  test('GET /api/submissions/:id - Get submission detail', async () => {
    const res = await request(app)
      .get(`/api/submissions/${submissionId}`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.score).toBeDefined();
  });

  test('Cannot exceed attempts_allowed', async () => {
    // Second attempt (attempts_allowed = 2)
    const res1 = await request(app)
      .post(`/api/assignments/${assignmentId}/submit`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ answers: [{ question_id: 'q1', selected_options: ['a'] }] });

    expect(res1.status).toBe(201);

    // Third attempt (should fail)
    const res2 = await request(app)
      .post(`/api/assignments/${assignmentId}/submit`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ answers: [{ question_id: 'q1', selected_options: ['a'] }] });

    expect(res2.status).toBe(400);
    expect(res2.body.error).toContain('hết lượt');
  });
});
```

- [x] **Step 3: Verify tests compile**

Run: `cd backend && npx tsc --noEmit`
Expected: No errors

- [x] **Step 4: Commit**

```bash
git add backend/src/__tests__/assignment.test.ts backend/src/__tests__/submission.test.ts backend/src/__tests__/helpers/app.helper.ts
git commit -m "test(backend): add assignment and submission API tests"
```

---

## Task 8: Create Frontend Service Layer

**Files:**
- Create: `frontend/src/services/ant-design-pro/assignments.ts`

- [x] **Step 1: Create assignments service file**

```typescript
// frontend/src/services/ant-design-pro/assignments.ts
import { request } from '@umijs/max';
import type { Pagination, DeleteResponse } from './types';

// --- Interfaces ---

export interface AssignmentOption {
  id: string;
  text: string;
  is_correct: boolean;
}

export interface QuizQuestion {
  id: string;
  assignment_id: string;
  question_text: string;
  question_type: 'single' | 'multiple' | 'true_false';
  options: AssignmentOption[];
  explanation: string | null;
  points: number;
  sort_order: number;
}

export interface Assignment {
  id: string;
  course_id: string;
  lesson_id: string | null;
  title: string;
  description: string | null;
  assignment_type: 'quiz' | 'essay' | 'upload';
  total_points: number;
  passing_score: number;
  time_limit_minutes: number | null;
  attempts_allowed: number;
  show_answer_after: boolean;
  due_date: string | null;
  is_published: boolean;
  questions?: QuizQuestion[];
  course?: { id: string; title: string };
  lesson?: { id: string; title: string };
  submissions_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Submission {
  id: string;
  assignment_id: string;
  user_id: string;
  attempt_number: number;
  answers: any;
  score: number | null;
  status: 'in_progress' | 'submitted' | 'graded';
  feedback: string | null;
  graded_by: string | null;
  graded_at: string | null;
  submitted_at: string;
  user?: { id: string; full_name: string; username: string };
  grader?: { id: string; full_name: string };
  assignment?: Assignment;
  question_results?: any[];
}

export interface AssignmentsResponse {
  success: boolean;
  data: Assignment[];
  pagination: Pagination;
}

export interface AssignmentDetailResponse {
  success: boolean;
  data: Assignment;
}

export interface SubmissionsResponse {
  success: boolean;
  data: Submission[];
  pagination: Pagination;
}

export interface SubmissionDetailResponse {
  success: boolean;
  data: Submission;
}

export interface SubmitResponse {
  success: boolean;
  message: string;
  data: {
    submission: Submission;
    grading?: {
      score: number;
      total: number;
      passed: boolean;
      results: any[];
    };
  };
}

// --- Functions ---

export async function getAssignments(params?: {
  lesson_id?: string;
  course_id?: string;
  type?: string;
  is_published?: string;
  page?: number;
  limit?: number;
}) {
  return request<AssignmentsResponse>('/api/assignments', {
    method: 'GET',
    params,
  });
}

export async function getAssignment(id: string) {
  return request<AssignmentDetailResponse>(`/api/assignments/${id}`, {
    method: 'GET',
  });
}

export async function createAssignment(data: {
  lesson_id?: string;
  course_id?: string;
  title: string;
  description?: string;
  assignment_type?: 'quiz' | 'essay' | 'upload';
  total_points?: number;
  passing_score?: number;
  time_limit_minutes?: number;
  attempts_allowed?: number;
  show_answer_after?: boolean;
  due_date?: string;
}) {
  return request<{ success: boolean; data: Assignment }>('/api/assignments', {
    method: 'POST',
    data,
  });
}

export async function updateAssignment(id: string, data: Partial<Assignment>) {
  return request<{ success: boolean; data: Assignment }>(`/api/assignments/${id}`, {
    method: 'PUT',
    data,
  });
}

export async function deleteAssignment(id: string) {
  return request<DeleteResponse>(`/api/assignments/${id}`, {
    method: 'DELETE',
  });
}

export async function publishAssignment(id: string) {
  return request<{ success: boolean; data: Assignment }>(`/api/assignments/${id}/publish`, {
    method: 'PATCH',
  });
}

export async function addQuestion(assignmentId: string, data: Partial<QuizQuestion>) {
  return request<{ success: boolean; data: QuizQuestion }>(`/api/assignments/${assignmentId}/questions`, {
    method: 'POST',
    data,
  });
}

export async function updateQuestion(id: string, data: Partial<QuizQuestion>) {
  return request<{ success: boolean; data: QuizQuestion }>(`/api/assignments/questions/${id}`, {
    method: 'PUT',
    data,
  });
}

export async function deleteQuestion(id: string) {
  return request<DeleteResponse>(`/api/assignments/questions/${id}`, {
    method: 'DELETE',
  });
}

export async function reorderQuestions(assignmentId: string, order: string[]) {
  return request<{ success: boolean }>(`/api/assignments/${assignmentId}/questions/reorder`, {
    method: 'PUT',
    data: { order },
  });
}

export async function submitAssignment(assignmentId: string, answers: any) {
  return request<SubmitResponse>(`/api/assignments/${assignmentId}/submit`, {
    method: 'POST',
    data: { answers },
  });
}

export async function getMySubmissions(assignmentId: string) {
  return request<{ success: boolean; data: Submission[] }>(`/api/assignments/${assignmentId}/submissions`, {
    method: 'GET',
  });
}

export async function getSubmission(id: string) {
  return request<SubmissionDetailResponse>(`/api/submissions/${id}`, {
    method: 'GET',
  });
}

export async function getSubmissionsForGrading(assignmentId: string, params?: {
  status?: string;
  page?: number;
  limit?: number;
}) {
  return request<SubmissionsResponse>(`/api/assignments/${assignmentId}/grading`, {
    method: 'GET',
    params,
  });
}

export async function gradeSubmission(id: string, data: { score: number; feedback?: string }) {
  return request<{ success: boolean; data: Submission }>(`/api/submissions/${id}/grade`, {
    method: 'PUT',
    data,
  });
}
```

- [x] **Step 2: Verify frontend compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors related to assignments.ts

- [x] **Step 3: Commit**

```bash
git add frontend/src/services/ant-design-pro/assignments.ts
git commit -m "feat(frontend): add assignments service layer with types"
```

---

## Task 9: Create Instructor Assignment List Page

**Files:**
- Create: `frontend/src/pages/instructor/assignments/index.tsx`

- [x] **Step 1: Create assignment list page**

```typescript
// frontend/src/pages/instructor/assignments/index.tsx
import { PlusOutlined } from '@ant-design/icons';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { history } from '@umijs/max';
import { Button, Popconfirm, Space, Tag, message } from 'antd';
import React, { useRef } from 'react';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  getAssignments,
  deleteAssignment,
  publishAssignment,
  type Assignment,
} from '@/services/ant-design-pro/assignments';

const AssignmentManagement: React.FC = () => {
  const actionRef = useRef<ActionType>(null);

  const handleDelete = async (id: string) => {
    try {
      await deleteAssignment(id);
      message.success('Đã xóa bài tập thành công!');
      actionRef.current?.reload();
    } catch (err: any) {
      message.error(err?.data?.error || 'Không thể xóa bài tập');
    }
  };

  const handleTogglePublish = async (record: Assignment) => {
    try {
      await publishAssignment(record.id);
      message.success(
        record.is_published ? 'Đã ẩn bài tập!' : 'Đã xuất bản bài tập!'
      );
      actionRef.current?.reload();
    } catch (err: any) {
      message.error(err?.data?.error || 'Không thể thay đổi trạng thái');
    }
  };

  const typeColors: Record<string, string> = {
    quiz: 'blue',
    essay: 'purple',
    upload: 'orange',
  };

  const typeLabels: Record<string, string> = {
    quiz: 'Trắc nghiệm',
    essay: 'Tự luận',
    upload: 'Nộp file',
  };

  const columns: ProColumns<Assignment>[] = [
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      copyable: true,
      ellipsis: true,
      render: (_, record) => <strong>{record.title}</strong>,
    },
    {
      title: 'Loại',
      dataIndex: 'assignment_type',
      valueType: 'select',
      valueEnum: {
        quiz: { text: 'Trắc nghiệm' },
        essay: { text: 'Tự luận' },
        upload: { text: 'Nộp file' },
      },
      render: (_, record) => (
        <Tag color={typeColors[record.assignment_type]}>
          {typeLabels[record.assignment_type]}
        </Tag>
      ),
    },
    {
      title: 'Bài học',
      dataIndex: ['lesson', 'title'],
      search: false,
      render: (_, record) => record.lesson?.title || '-',
    },
    {
      title: 'Câu hỏi',
      dataIndex: 'questions',
      search: false,
      render: (_, record) =>
        record.assignment_type === 'quiz'
          ? `${record.questions?.length || 0} câu`
          : '-',
    },
    {
      title: 'Điểm đạt',
      dataIndex: 'passing_score',
      search: false,
      render: (_, record) => `${record.passing_score}/${record.total_points}`,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'is_published',
      valueType: 'select',
      valueEnum: {
        true: { text: 'Đã xuất bản', status: 'Success' },
        false: { text: 'Bản nháp', status: 'Default' },
      },
      render: (_, record) => (
        <Tag color={record.is_published ? 'green' : 'default'}>
          {record.is_published ? 'Đã xuất bản' : 'Bản nháp'}
        </Tag>
      ),
    },
    {
      title: 'Hành động',
      valueType: 'option',
      render: (_, record) => (
        <Space>
          <a onClick={() => history.push(`/instructor/assignments/${record.id}/edit`)}>Chỉnh sửa</a>
          <a onClick={() => history.push(`/instructor/assignments/${record.id}/submissions`)}>
            Bài nộp
          </a>
          <a onClick={() => handleTogglePublish(record)}>
            {record.is_published ? 'Gỡ xuất bản' : 'Xuất bản'}
          </a>
          <Popconfirm
            title="Bạn có chắc muốn xóa bài tập này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <a style={{ color: '#EF4444' }}>Xóa</a>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer title="Quản lý bài tập">
      <ProTable<Assignment>
        headerTitle="Danh sách bài tập"
        actionRef={actionRef}
        rowKey="id"
        search={{ labelWidth: 120 }}
        toolBarRender={() => [
          <Button
            key="create"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => history.push('/instructor/assignments/create')}
          >
            Tạo bài tập mới
          </Button>,
        ]}
        request={async (params, sort) => {
          try {
            const res = await getAssignments({
              page: params.current || 1,
              limit: params.pageSize || 10,
              type: params.assignment_type as string,
              is_published: params.is_published as string,
            });
            return {
              data: res.data || [],
              total: res.pagination?.total || 0,
              success: true,
            };
          } catch (err) {
            return { data: [], total: 0, success: false };
          }
        }}
        columns={columns}
      />
    </PageContainer>
  );
};

export default AssignmentManagement;
```

- [x] **Step 2: Verify compilation**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

- [x] **Step 3: Commit**

```bash
git add frontend/src/pages/instructor/assignments/index.tsx
git commit -m "feat(frontend): add instructor assignment list page with ProTable"
```

---

## Task 10: Create Instructor Assignment Create/Edit Pages

**Files:**
- Create: `frontend/src/pages/instructor/assignments/create/index.tsx`
- Create: `frontend/src/pages/instructor/assignments/edit/index.tsx`

- [x] **Step 1: Create assignment create page**

```typescript
// frontend/src/pages/instructor/assignments/create/index.tsx
import { PageContainer } from '@ant-design/pro-components';
import { history, useParams } from '@umijs/max';
import {
  Button, Card, DatePicker, Form, Input, InputNumber,
  Radio, Select, Space, Switch, message, Divider, List,
} from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import React, { useState } from 'react';
import { createAssignment, addQuestion } from '@/services/ant-design-pro/assignments';

const { TextArea } = Input;

const CreateAssignmentPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [assignmentType, setAssignmentType] = useState<string>('quiz');
  const [questions, setQuestions] = useState<any[]>([]);

  const handleFinish = async (values: any) => {
    setLoading(true);
    try {
      const res = await createAssignment({
        ...values,
        due_date: values.due_date?.toISOString(),
      });

      // Add questions if quiz type
      if (assignmentType === 'quiz' && questions.length > 0) {
        for (const q of questions) {
          await addQuestion(res.data.id, q);
        }
      }

      message.success('Tạo bài tập thành công!');
      history.push('/instructor/assignments');
    } catch (err: any) {
      message.error(err?.data?.error || 'Không thể tạo bài tập');
    } finally {
      setLoading(false);
    }
  };

  const addNewQuestion = () => {
    setQuestions([
      ...questions,
      {
        question_text: '',
        question_type: 'single',
        options: [
          { id: 'a', text: '', is_correct: false },
          { id: 'b', text: '', is_correct: false },
        ],
        points: 1,
        explanation: '',
      },
    ]);
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const addOption = (qIndex: number) => {
    const updated = [...questions];
    const optId = String.fromCharCode(97 + updated[qIndex].options.length); // a, b, c, d...
    updated[qIndex].options.push({ id: optId, text: '', is_correct: false });
    setQuestions(updated);
  };

  const updateOption = (qIndex: number, oIndex: number, field: string, value: any) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex] = {
      ...updated[qIndex].options[oIndex],
      [field]: value,
    };
    setQuestions(updated);
  };

  const removeOption = (qIndex: number, oIndex: number) => {
    const updated = [...questions];
    updated[qIndex].options = updated[qIndex].options.filter((_: any, i: number) => i !== oIndex);
    setQuestions(updated);
  };

  const setCorrectOption = (qIndex: number, oIndex: number) => {
    const updated = [...questions];
    if (updated[qIndex].question_type === 'single' || updated[qIndex].question_type === 'true_false') {
      updated[qIndex].options = updated[qIndex].options.map((opt: any, i: number) => ({
        ...opt,
        is_correct: i === oIndex,
      }));
    } else {
      updated[qIndex].options[oIndex].is_correct = !updated[qIndex].options[oIndex].is_correct;
    }
    setQuestions(updated);
  };

  return (
    <PageContainer title="Tạo bài tập mới">
      <Card>
        <Form form={form} layout="vertical" onFinish={handleFinish} initialValues={{ assignment_type: 'quiz', total_points: 100, passing_score: 50, attempts_allowed: 1 }}>
          <Form.Item name="title" label="Tiêu đề" rules={[{ required: true, message: 'Vui lòng nhập tiêu đề!' }]}>
            <Input placeholder="Nhập tiêu đề bài tập" />
          </Form.Item>

          <Form.Item name="description" label="Mô tả">
            <TextArea rows={3} placeholder="Mô tả bài tập (tùy chọn)" />
          </Form.Item>

          <Form.Item name="assignment_type" label="Loại bài tập" rules={[{ required: true }]}>
            <Radio.Group onChange={(e) => setAssignmentType(e.target.value)}>
              <Radio.Button value="quiz">Trắc nghiệm</Radio.Button>
              <Radio.Button value="essay">Tự luận</Radio.Button>
              <Radio.Button value="upload">Nộp file</Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Space size="large">
            <Form.Item name="total_points" label="Tổng điểm">
              <InputNumber min={1} max={1000} />
            </Form.Item>
            <Form.Item name="passing_score" label="Điểm đạt">
              <InputNumber min={1} />
            </Form.Item>
            <Form.Item name="attempts_allowed" label="Số lần nộp">
              <InputNumber min={1} max={100} />
            </Form.Item>
            <Form.Item name="time_limit_minutes" label="Thời gian (phút)">
              <InputNumber min={1} placeholder="Không giới hạn" />
            </Form.Item>
          </Space>

          <Space size="large">
            <Form.Item name="due_date" label="Hạn nộp">
              <DatePicker showTime />
            </Form.Item>
            <Form.Item name="show_answer_after" label="Hiện đáp án sau khi nộp" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Space>

          {assignmentType === 'quiz' && (
            <>
              <Divider>Câu hỏi</Divider>
              {questions.map((q, qIndex) => (
                <Card key={qIndex} size="small" style={{ marginBottom: 16 }} title={`Câu ${qIndex + 1}`}
                  extra={<Button danger size="small" icon={<MinusCircleOutlined />} onClick={() => removeQuestion(qIndex)}>Xóa</Button>}>
                  <Form.Item label="Câu hỏi" required>
                    <TextArea
                      value={q.question_text}
                      onChange={(e) => updateQuestion(qIndex, 'question_text', e.target.value)}
                      rows={2}
                      placeholder="Nhập nội dung câu hỏi"
                    />
                  </Form.Item>

                  <Space>
                    <Form.Item label="Loại">
                      <Select
                        value={q.question_type}
                        onChange={(val) => {
                          updateQuestion(qIndex, 'question_type', val);
                          if (val === 'true_false') {
                            updateQuestion(qIndex, 'options', [
                              { id: 'true', text: 'Đúng', is_correct: false },
                              { id: 'false', text: 'Sai', is_correct: false },
                            ]);
                          }
                        }}
                        options={[
                          { label: 'Chọn 1', value: 'single' },
                          { label: 'Chọn nhiều', value: 'multiple' },
                          { label: 'Đúng/Sai', value: 'true_false' },
                        ]}
                        style={{ width: 120 }}
                      />
                    </Form.Item>
                    <Form.Item label="Điểm">
                      <InputNumber
                        value={q.points}
                        onChange={(val) => updateQuestion(qIndex, 'points', val)}
                        min={1}
                      />
                    </Form.Item>
                  </Space>

                  <div style={{ marginBottom: 8 }}>Đáp án:</div>
                  {q.options.map((opt: any, oIndex: number) => (
                    <Space key={oIndex} style={{ display: 'flex', marginBottom: 8 }}>
                      <Button
                        size="small"
                        type={opt.is_correct ? 'primary' : 'default'}
                        onClick={() => setCorrectOption(qIndex, oIndex)}
                      >
                        {opt.id.toUpperCase()}
                      </Button>
                      <Input
                        value={opt.text}
                        onChange={(e) => updateOption(qIndex, oIndex, 'text', e.target.value)}
                        placeholder="Nhập đáp án"
                        disabled={q.question_type === 'true_false'}
                        style={{ width: 300 }}
                      />
                      {q.question_type !== 'true_false' && (
                        <Button
                          danger
                          size="small"
                          icon={<MinusCircleOutlined />}
                          onClick={() => removeOption(qIndex, oIndex)}
                        />
                      )}
                    </Space>
                  ))}
                  {q.question_type !== 'true_false' && (
                    <Button type="dashed" size="small" onClick={() => addOption(qIndex)} icon={<PlusOutlined />}>
                      Thêm đáp án
                    </Button>
                  )}

                  <Form.Item label="Giải thích" style={{ marginTop: 8 }}>
                    <Input
                      value={q.explanation}
                      onChange={(e) => updateQuestion(qIndex, 'explanation', e.target.value)}
                      placeholder="Giải thích đáp án (tùy chọn)"
                    />
                  </Form.Item>
                </Card>
              ))}
              <Button type="dashed" onClick={addNewQuestion} icon={<PlusOutlined />} style={{ width: '100%' }}>
                Thêm câu hỏi
              </Button>
            </>
          )}

          <Divider />

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                Tạo bài tập
              </Button>
              <Button onClick={() => history.push('/instructor/assignments')}>Hủy</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </PageContainer>
  );
};

export default CreateAssignmentPage;
```

- [x] **Step 2: Create assignment edit page**

```typescript
// frontend/src/pages/instructor/assignments/edit/index.tsx
import { PageContainer } from '@ant-design/pro-components';
import { history, useParams } from '@umijs/max';
import {
  Button, Card, DatePicker, Form, Input, InputNumber,
  Radio, Select, Space, Switch, message, Divider, Spin,
} from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  getAssignment, updateAssignment, addQuestion,
  updateQuestion, deleteQuestion, type Assignment, type QuizQuestion,
} from '@/services/ant-design-pro/assignments';
import dayjs from 'dayjs';

const { TextArea } = Input;

const EditAssignmentPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [assignmentType, setAssignmentType] = useState<string>('quiz');
  const [questions, setQuestions] = useState<any[]>([]);
  const [originalQuestions, setOriginalQuestions] = useState<QuizQuestion[]>([]);

  const fetchAssignment = useCallback(async () => {
    try {
      const res = await getAssignment(id!);
      const data = res.data;
      form.setFieldsValue({
        title: data.title,
        description: data.description,
        assignment_type: data.assignment_type,
        total_points: data.total_points,
        passing_score: data.passing_score,
        attempts_allowed: data.attempts_allowed,
        time_limit_minutes: data.time_limit_minutes,
        due_date: data.due_date ? dayjs(data.due_date) : undefined,
        show_answer_after: data.show_answer_after,
      });
      setAssignmentType(data.assignment_type);
      if (data.questions) {
        setQuestions(data.questions);
        setOriginalQuestions(data.questions);
      }
    } catch (err: any) {
      message.error('Không thể tải thông tin bài tập');
    } finally {
      setLoading(false);
    }
  }, [id, form]);

  useEffect(() => {
    fetchAssignment();
  }, [fetchAssignment]);

  const handleFinish = async (values: any) => {
    setSaving(true);
    try {
      await updateAssignment(id!, {
        ...values,
        due_date: values.due_date?.toISOString(),
      });

      // Handle questions for quiz type
      if (assignmentType === 'quiz') {
        // Delete removed questions
        const currentIds = questions.filter((q) => q.id).map((q) => q.id);
        for (const orig of originalQuestions) {
          if (!currentIds.includes(orig.id)) {
            await deleteQuestion(orig.id);
          }
        }

        // Add/update questions
        for (const q of questions) {
          if (q.id) {
            await updateQuestion(q.id, q);
          } else {
            await addQuestion(id!, q);
          }
        }
      }

      message.success('Cập nhật bài tập thành công!');
      history.push('/instructor/assignments');
    } catch (err: any) {
      message.error(err?.data?.error || 'Không thể cập nhật bài tập');
    } finally {
      setSaving(false);
    }
  };

  const addNewQuestion = () => {
    setQuestions([
      ...questions,
      {
        question_text: '',
        question_type: 'single',
        options: [
          { id: 'a', text: '', is_correct: false },
          { id: 'b', text: '', is_correct: false },
        ],
        points: 1,
        explanation: '',
      },
    ]);
  };

  const updateQuestionField = (index: number, field: string, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const addOption = (qIndex: number) => {
    const updated = [...questions];
    const optId = String.fromCharCode(97 + updated[qIndex].options.length);
    updated[qIndex].options.push({ id: optId, text: '', is_correct: false });
    setQuestions(updated);
  };

  const updateOption = (qIndex: number, oIndex: number, field: string, value: any) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex] = {
      ...updated[qIndex].options[oIndex],
      [field]: value,
    };
    setQuestions(updated);
  };

  const removeOption = (qIndex: number, oIndex: number) => {
    const updated = [...questions];
    updated[qIndex].options = updated[qIndex].options.filter((_: any, i: number) => i !== oIndex);
    setQuestions(updated);
  };

  const setCorrectOption = (qIndex: number, oIndex: number) => {
    const updated = [...questions];
    if (updated[qIndex].question_type === 'single' || updated[qIndex].question_type === 'true_false') {
      updated[qIndex].options = updated[qIndex].options.map((opt: any, i: number) => ({
        ...opt,
        is_correct: i === oIndex,
      }));
    } else {
      updated[qIndex].options[oIndex].is_correct = !updated[qIndex].options[oIndex].is_correct;
    }
    setQuestions(updated);
  };

  if (loading) {
    return (
      <PageContainer title="Chỉnh sửa bài tập">
        <Card>
          <div style={{ textAlign: 'center', padding: 50 }}>
            <Spin size="large" />
          </div>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Chỉnh sửa bài tập">
      <Card>
        <Form form={form} layout="vertical" onFinish={handleFinish}>
          <Form.Item name="title" label="Tiêu đề" rules={[{ required: true, message: 'Vui lòng nhập tiêu đề!' }]}>
            <Input placeholder="Nhập tiêu đề bài tập" />
          </Form.Item>

          <Form.Item name="description" label="Mô tả">
            <TextArea rows={3} placeholder="Mô tả bài tập (tùy chọn)" />
          </Form.Item>

          <Form.Item name="assignment_type" label="Loại bài tập" rules={[{ required: true }]}>
            <Radio.Group onChange={(e) => setAssignmentType(e.target.value)}>
              <Radio.Button value="quiz">Trắc nghiệm</Radio.Button>
              <Radio.Button value="essay">Tự luận</Radio.Button>
              <Radio.Button value="upload">Nộp file</Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Space size="large">
            <Form.Item name="total_points" label="Tổng điểm">
              <InputNumber min={1} max={1000} />
            </Form.Item>
            <Form.Item name="passing_score" label="Điểm đạt">
              <InputNumber min={1} />
            </Form.Item>
            <Form.Item name="attempts_allowed" label="Số lần nộp">
              <InputNumber min={1} max={100} />
            </Form.Item>
            <Form.Item name="time_limit_minutes" label="Thời gian (phút)">
              <InputNumber min={1} placeholder="Không giới hạn" />
            </Form.Item>
          </Space>

          <Space size="large">
            <Form.Item name="due_date" label="Hạn nộp">
              <DatePicker showTime />
            </Form.Item>
            <Form.Item name="show_answer_after" label="Hiện đáp án sau khi nộp" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Space>

          {assignmentType === 'quiz' && (
            <>
              <Divider>Câu hỏi</Divider>
              {questions.map((q, qIndex) => (
                <Card key={q.id || qIndex} size="small" style={{ marginBottom: 16 }} title={`Câu ${qIndex + 1}`}
                  extra={<Button danger size="small" icon={<MinusCircleOutlined />} onClick={() => removeQuestion(qIndex)}>Xóa</Button>}>
                  <Form.Item label="Câu hỏi" required>
                    <TextArea
                      value={q.question_text}
                      onChange={(e) => updateQuestionField(qIndex, 'question_text', e.target.value)}
                      rows={2}
                      placeholder="Nhập nội dung câu hỏi"
                    />
                  </Form.Item>

                  <Space>
                    <Form.Item label="Loại">
                      <Select
                        value={q.question_type}
                        onChange={(val) => updateQuestionField(qIndex, 'question_type', val)}
                        options={[
                          { label: 'Chọn 1', value: 'single' },
                          { label: 'Chọn nhiều', value: 'multiple' },
                          { label: 'Đúng/Sai', value: 'true_false' },
                        ]}
                        style={{ width: 120 }}
                      />
                    </Form.Item>
                    <Form.Item label="Điểm">
                      <InputNumber
                        value={q.points}
                        onChange={(val) => updateQuestionField(qIndex, 'points', val)}
                        min={1}
                      />
                    </Form.Item>
                  </Space>

                  <div style={{ marginBottom: 8 }}>Đáp án:</div>
                  {q.options.map((opt: any, oIndex: number) => (
                    <Space key={oIndex} style={{ display: 'flex', marginBottom: 8 }}>
                      <Button
                        size="small"
                        type={opt.is_correct ? 'primary' : 'default'}
                        onClick={() => setCorrectOption(qIndex, oIndex)}
                      >
                        {opt.id.toUpperCase()}
                      </Button>
                      <Input
                        value={opt.text}
                        onChange={(e) => updateOption(qIndex, oIndex, 'text', e.target.value)}
                        placeholder="Nhập đáp án"
                        disabled={q.question_type === 'true_false'}
                        style={{ width: 300 }}
                      />
                      {q.question_type !== 'true_false' && (
                        <Button
                          danger
                          size="small"
                          icon={<MinusCircleOutlined />}
                          onClick={() => removeOption(qIndex, oIndex)}
                        />
                      )}
                    </Space>
                  ))}
                  {q.question_type !== 'true_false' && (
                    <Button type="dashed" size="small" onClick={() => addOption(qIndex)} icon={<PlusOutlined />}>
                      Thêm đáp án
                    </Button>
                  )}

                  <Form.Item label="Giải thích" style={{ marginTop: 8 }}>
                    <Input
                      value={q.explanation}
                      onChange={(e) => updateQuestionField(qIndex, 'explanation', e.target.value)}
                      placeholder="Giải thích đáp án (tùy chọn)"
                    />
                  </Form.Item>
                </Card>
              ))}
              <Button type="dashed" onClick={addNewQuestion} icon={<PlusOutlined />} style={{ width: '100%' }}>
                Thêm câu hỏi
              </Button>
            </>
          )}

          <Divider />

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={saving}>
                Lưu thay đổi
              </Button>
              <Button onClick={() => history.push('/instructor/assignments')}>Hủy</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </PageContainer>
  );
};

export default EditAssignmentPage;
```

- [x] **Step 3: Verify compilation**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

- [x] **Step 4: Commit**

```bash
git add frontend/src/pages/instructor/assignments/create/index.tsx frontend/src/pages/instructor/assignments/edit/index.tsx
git commit -m "feat(frontend): add instructor assignment create and edit pages"
```

---

## Task 11: Create Instructor Submissions & Grading Page

**Files:**
- Create: `frontend/src/pages/instructor/assignments/submissions/index.tsx`

- [x] **Step 1: Create submissions page**

```typescript
// frontend/src/pages/instructor/assignments/submissions/index.tsx
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { useParams } from '@umijs/max';
import { Button, Card, Form, Input, InputNumber, Modal, Space, Tag, Typography, message } from 'antd';
import React, { useRef, useState } from 'react';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  getSubmissionsForGrading,
  getSubmission,
  gradeSubmission,
  type Submission,
} from '@/services/ant-design-pro/assignments';

const { Text } = Typography;
const { TextArea } = Input;

const SubmissionsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const actionRef = useRef<ActionType>(null);
  const [gradingModalVisible, setGradingModalVisible] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [gradingLoading, setGradingLoading] = useState(false);
  const [gradeForm] = Form.useForm();

  const handleViewSubmission = async (submissionId: string) => {
    try {
      const res = await getSubmission(submissionId);
      setSelectedSubmission(res.data);
      setGradingModalVisible(true);
      gradeForm.setFieldsValue({
        score: res.data.score,
        feedback: res.data.feedback,
      });
    } catch (err: any) {
      message.error('Không thể tải thông tin bài nộp');
    }
  };

  const handleGrade = async (values: any) => {
    if (!selectedSubmission) return;
    setGradingLoading(true);
    try {
      await gradeSubmission(selectedSubmission.id, {
        score: values.score,
        feedback: values.feedback,
      });
      message.success('Chấm bài thành công!');
      setGradingModalVisible(false);
      setSelectedSubmission(null);
      gradeForm.resetFields();
      actionRef.current?.reload();
    } catch (err: any) {
      message.error(err?.data?.error || 'Không thể chấm bài');
    } finally {
      setGradingLoading(false);
    }
  };

  const statusColors: Record<string, string> = {
    submitted: 'orange',
    graded: 'green',
    in_progress: 'default',
  };

  const statusLabels: Record<string, string> = {
    submitted: 'Chờ chấm',
    graded: 'Đã chấm',
    in_progress: 'Đang làm',
  };

  const columns: ProColumns<Submission>[] = [
    {
      title: 'Học viên',
      dataIndex: ['user', 'full_name'],
      search: false,
      render: (_, record) => record.user?.full_name || record.user?.username || '-',
    },
    {
      title: 'Lần nộp',
      dataIndex: 'attempt_number',
      search: false,
      render: (_, record) => `Lần ${record.attempt_number}`,
    },
    {
      title: 'Điểm',
      dataIndex: 'score',
      search: false,
      render: (_, record) =>
        record.score !== null ? (
          <strong>{record.score}</strong>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      valueType: 'select',
      valueEnum: {
        submitted: { text: 'Chờ chấm' },
        graded: { text: 'Đã chấm' },
      },
      render: (_, record) => (
        <Tag color={statusColors[record.status]}>
          {statusLabels[record.status]}
        </Tag>
      ),
    },
    {
      title: 'Nộp lúc',
      dataIndex: 'submitted_at',
      search: false,
      render: (_, record) =>
        new Date(record.submitted_at).toLocaleString('vi-VN'),
    },
    {
      title: 'Hành động',
      valueType: 'option',
      render: (_, record) => (
        <Space>
          <a onClick={() => handleViewSubmission(record.id)}>
            {record.status === 'graded' ? 'Xem' : 'Chấm bài'}
          </a>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer title="Bài nộp">
      <ProTable<Submission>
        headerTitle="Danh sách bài nộp"
        actionRef={actionRef}
        rowKey="id"
        search={{ labelWidth: 120 }}
        request={async (params, sort) => {
          try {
            const res = await getSubmissionsForGrading(id!, {
              page: params.current || 1,
              limit: params.pageSize || 10,
              status: params.status as string,
            });
            return {
              data: res.data || [],
              total: res.pagination?.total || 0,
              success: true,
            };
          } catch (err) {
            return { data: [], total: 0, success: false };
          }
        }}
        columns={columns}
      />

      <Modal
        title={selectedSubmission?.status === 'graded' ? 'Chi tiết bài nộp' : 'Chấm bài'}
        open={gradingModalVisible}
        onCancel={() => {
          setGradingModalVisible(false);
          setSelectedSubmission(null);
          gradeForm.resetFields();
        }}
        footer={null}
        width={700}
      >
        {selectedSubmission && (
          <>
            {selectedSubmission.assignment?.assignment_type === 'essay' && selectedSubmission.answers?.text && (
              <Card size="small" title="Bài viết" style={{ marginBottom: 16 }}>
                <div style={{ whiteSpace: 'pre-wrap', maxHeight: 300, overflow: 'auto' }}>
                  {selectedSubmission.answers.text}
                </div>
              </Card>
            )}

            {selectedSubmission.assignment?.assignment_type === 'upload' && selectedSubmission.answers?.file_url && (
              <Card size="small" title="File đã nộp" style={{ marginBottom: 16 }}>
                <a href={selectedSubmission.answers.file_url} target="_blank" rel="noopener noreferrer">
                  {selectedSubmission.answers.file_name || 'Xem file'}
                </a>
              </Card>
            )}

            <Form form={gradeForm} layout="vertical" onFinish={handleGrade}>
              <Form.Item
                name="score"
                label={`Điểm (tối đa: ${selectedSubmission.assignment?.total_points || 100})`}
                rules={[{ required: true, message: 'Vui lòng nhập điểm!' }]}
              >
                <InputNumber
                  min={0}
                  max={selectedSubmission.assignment?.total_points || 100}
                  style={{ width: '100%' }}
                />
              </Form.Item>

              <Form.Item name="feedback" label="Nhận xét">
                <TextArea rows={4} placeholder="Nhận xét cho học viên (tùy chọn)" />
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit" loading={gradingLoading}>
                    Lưu điểm
                  </Button>
                  <Button onClick={() => {
                    setGradingModalVisible(false);
                    setSelectedSubmission(null);
                    gradeForm.resetFields();
                  }}>
                    Đóng
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>
    </PageContainer>
  );
};

export default SubmissionsPage;
```

- [x] **Step 2: Verify compilation**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

- [x] **Step 3: Commit**

```bash
git add frontend/src/pages/instructor/assignments/submissions/index.tsx
git commit -m "feat(frontend): add instructor submissions view and grading page"
```

---

## Task 12: Create Student Take Assignment Page

**Files:**
- Create: `frontend/src/pages/student/assignments/take/index.tsx`

- [x] **Step 1: Create take assignment page**

```typescript
// frontend/src/pages/student/assignments/take/index.tsx
import { PageContainer } from '@ant-design/pro-components';
import { history, useParams } from '@umijs/max';
import {
  Button, Card, Radio, Checkbox, Input, Upload, Space,
  Typography, message, Spin, Result, Alert, Progress,
} from 'antd';
import { UploadOutlined, ClockCircleOutlined } from '@ant-design/icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  getAssignment, submitAssignment, getMySubmissions,
  type Assignment, type QuizQuestion,
} from '@/services/ant-design-pro/assignments';
import { uploadsService } from '@/services/ant-design-pro/uploads';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const TakeAssignmentPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string[]>>({});
  const [essayText, setEssayText] = useState('');
  const [uploadedFile, setUploadedFile] = useState<{ url: string; name: string } | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [gradingResult, setGradingResult] = useState<any>(null);
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);

  const fetchAssignment = useCallback(async () => {
    try {
      const res = await getAssignment(id!);
      setAssignment(res.data);

      // Check attempts
      const submissionsRes = await getMySubmissions(id!);
      const attempts = submissionsRes.data?.length || 0;
      setAttemptsLeft(res.data.attempts_allowed - attempts);

      if (attempts >= res.data.attempts_allowed) {
        message.warning('Bạn đã hết lượt nộp bài!');
      }
    } catch (err: any) {
      message.error('Không thể tải bài tập');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAssignment();
  }, [fetchAssignment]);

  const handleQuizAnswer = (questionId: string, optionId: string, type: string) => {
    setQuizAnswers((prev) => {
      const current = prev[questionId] || [];
      if (type === 'single' || type === 'true_false') {
        return { ...prev, [questionId]: [optionId] };
      } else {
        // multiple
        if (current.includes(optionId)) {
          return { ...prev, [questionId]: current.filter((id) => id !== optionId) };
        } else {
          return { ...prev, [questionId]: [...current, optionId] };
        }
      }
    });
  };

  const handleUpload = async (file: any) => {
    try {
      const res = await uploadsService.uploadFile(file);
      setUploadedFile({ url: res.data.url, name: file.name });
      message.success('Upload thành công!');
    } catch (err) {
      message.error('Upload thất bại!');
    }
    return false;
  };

  const handleSubmit = async () => {
    if (!assignment) return;

    // Validate
    if (assignment.assignment_type === 'quiz') {
      const answeredCount = Object.keys(quizAnswers).length;
      if (answeredCount === 0) {
        message.error('Vui lòng trả lời ít nhất một câu hỏi!');
        return;
      }
    } else if (assignment.assignment_type === 'essay') {
      if (!essayText.trim()) {
        message.error('Vui lòng nhập nội dung bài viết!');
        return;
      }
    } else if (assignment.assignment_type === 'upload') {
      if (!uploadedFile) {
        message.error('Vui lòng upload file!');
        return;
      }
    }

    setSubmitting(true);
    try {
      let answers: any;
      if (assignment.assignment_type === 'quiz') {
        answers = Object.entries(quizAnswers).map(([question_id, selected_options]) => ({
          question_id,
          selected_options,
        }));
      } else if (assignment.assignment_type === 'essay') {
        answers = { text: essayText };
      } else {
        answers = { file_url: uploadedFile!.url, file_name: uploadedFile!.name };
      }

      const res = await submitAssignment(id!, answers);
      setSubmitted(true);
      if (res.data.grading) {
        setGradingResult(res.data.grading);
      }
      message.success(res.message);
    } catch (err: any) {
      message.error(err?.data?.error || 'Không thể nộp bài');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PageContainer title="Làm bài tập">
        <Card>
          <div style={{ textAlign: 'center', padding: 50 }}>
            <Spin size="large" />
          </div>
        </Card>
      </PageContainer>
    );
  }

  if (!assignment) {
    return (
      <PageContainer title="Làm bài tập">
        <Result status="404" title="Không tìm thấy bài tập" />
      </PageContainer>
    );
  }

  if (submitted) {
    return (
      <PageContainer title="Kết quả bài tập">
        <Card>
          {gradingResult ? (
            <Result
              status={gradingResult.passed ? 'success' : 'warning'}
              title={`${gradingResult.score}/${gradingResult.total} điểm`}
              subTitle={gradingResult.passed ? 'Bạn đã đạt!' : 'Bạn chưa đạt điểm tối thiểu'}
              extra={[
                <Button key="back" onClick={() => history.push(`/student/courses/${assignment.course_id}/lessons/${assignment.lesson_id}`)}>
                  Quay lại bài học
                </Button>,
              ]}
            />
          ) : (
            <Result
              status="info"
              title="Nộp bài thành công!"
              subTitle="Bài tập của bạn đang chờ giảng viên chấm điểm."
              extra={[
                <Button key="back" onClick={() => history.push(`/student/courses/${assignment.course_id}/lessons/${assignment.lesson_id}`)}>
                  Quay lại bài học
                </Button>,
              ]}
            />
          )}
        </Card>
      </PageContainer>
    );
  }

  if (attemptsLeft !== null && attemptsLeft <= 0) {
    return (
      <PageContainer title="Làm bài tập">
        <Result
          status="warning"
          title="Hết lượt nộp bài"
          subTitle={`Bạn đã sử dụng hết ${assignment.attempts_allowed} lượt nộp cho bài tập này.`}
          extra={[
            <Button key="back" onClick={() => history.push(`/student/courses/${assignment.course_id}/lessons/${assignment.lesson_id}`)}>
              Quay lại bài học
            </Button>,
          ]}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer title={assignment.title}>
      <Card>
        <div style={{ marginBottom: 24 }}>
          <Title level={4}>{assignment.title}</Title>
          {assignment.description && <Paragraph>{assignment.description}</Paragraph>}
          <Space>
            <Text type="secondary">Loại: {assignment.assignment_type === 'quiz' ? 'Trắc nghiệm' : assignment.assignment_type === 'essay' ? 'Tự luận' : 'Nộp file'}</Text>
            <Text type="secondary">|</Text>
            <Text type="secondary">Tổng điểm: {assignment.total_points}</Text>
            <Text type="secondary">|</Text>
            <Text type="secondary">Điểm đạt: {assignment.passing_score}</Text>
            {attemptsLeft !== null && (
              <>
                <Text type="secondary">|</Text>
                <Text type="secondary">Còn lại: {attemptsLeft} lượt</Text>
              </>
            )}
            {assignment.time_limit_minutes && (
              <>
                <Text type="secondary">|</Text>
                <Text type="secondary"><ClockCircleOutlined /> {assignment.time_limit_minutes} phút</Text>
              </>
            )}
          </Space>
        </div>

        {/* Quiz */}
        {assignment.assignment_type === 'quiz' && assignment.questions && (
          <>
            {assignment.questions.map((q, index) => (
              <Card key={q.id} size="small" style={{ marginBottom: 16 }} title={`Câu ${index + 1}: ${q.question_text}`}>
                {q.question_type === 'single' || q.question_type === 'true_false' ? (
                  <Radio.Group
                    onChange={(e) => handleQuizAnswer(q.id, e.target.value, q.question_type)}
                    value={quizAnswers[q.id]?.[0]}
                  >
                    <Space direction="vertical">
                      {q.options.map((opt) => (
                        <Radio key={opt.id} value={opt.id}>{opt.text}</Radio>
                      ))}
                    </Space>
                  </Radio.Group>
                ) : (
                  <Checkbox.Group
                    onChange={(values) => setQuizAnswers((prev) => ({ ...prev, [q.id]: values as string[] }))}
                    value={quizAnswers[q.id]}
                  >
                    <Space direction="vertical">
                      {q.options.map((opt) => (
                        <Checkbox key={opt.id} value={opt.id}>{opt.text}</Checkbox>
                      ))}
                    </Space>
                  </Checkbox.Group>
                )}
              </Card>
            ))}
          </>
        )}

        {/* Essay */}
        {assignment.assignment_type === 'essay' && (
          <Card title="Bài viết" style={{ marginBottom: 16 }}>
            <TextArea
              value={essayText}
              onChange={(e) => setEssayText(e.target.value)}
              rows={10}
              placeholder="Nhập nội dung bài viết của bạn..."
            />
            <Text type="secondary" style={{ marginTop: 8, display: 'block' }}>
              {essayText.length} ký tự
            </Text>
          </Card>
        )}

        {/* Upload */}
        {assignment.assignment_type === 'upload' && (
          <Card title="Nộp file" style={{ marginBottom: 16 }}>
            <Upload beforeUpload={handleUpload} maxCount={1}>
              <Button icon={<UploadOutlined />}>Chọn file</Button>
            </Upload>
            {uploadedFile && (
              <Text type="success" style={{ marginTop: 8, display: 'block' }}>
                Đã chọn: {uploadedFile.name}
              </Text>
            )}
          </Card>
        )}

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Space>
            <Button
              type="primary"
              size="large"
              onClick={handleSubmit}
              loading={submitting}
            >
              Nộp bài
            </Button>
            <Button
              size="large"
              onClick={() => history.push(`/student/courses/${assignment.course_id}/lessons/${assignment.lesson_id}`)}
            >
              Hủy
            </Button>
          </Space>
        </div>
      </Card>
    </PageContainer>
  );
};

export default TakeAssignmentPage;
```

- [x] **Step 2: Verify compilation**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

- [x] **Step 3: Commit**

```bash
git add frontend/src/pages/student/assignments/take/index.tsx
git commit -m "feat(frontend): add student take assignment page with quiz/essay/upload"
```

---

## Task 13: Create Student Result Page

**Files:**
- Create: `frontend/src/pages/student/assignments/result/index.tsx`

- [x] **Step 1: Create result page**

```typescript
// frontend/src/pages/student/assignments/result/index.tsx
import { PageContainer } from '@ant-design/pro-components';
import { history, useParams } from '@umijs/max';
import {
  Button, Card, List, Space, Tag, Typography, message, Spin, Result,
} from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import React, { useCallback, useEffect, useState } from 'react';
import { getSubmission, type Submission } from '@/services/ant-design-pro/assignments';

const { Title, Text, Paragraph } = Typography;

const AssignmentResultPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [submission, setSubmission] = useState<Submission | null>(null);

  const fetchSubmission = useCallback(async () => {
    try {
      const res = await getSubmission(id!);
      setSubmission(res.data);
    } catch (err: any) {
      message.error('Không thể tải kết quả bài tập');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSubmission();
  }, [fetchSubmission]);

  if (loading) {
    return (
      <PageContainer title="Kết quả bài tập">
        <Card>
          <div style={{ textAlign: 'center', padding: 50 }}>
            <Spin size="large" />
          </div>
        </Card>
      </PageContainer>
    );
  }

  if (!submission) {
    return (
      <PageContainer title="Kết quả bài tập">
        <Result status="404" title="Không tìm thấy bài nộp" />
      </PageContainer>
    );
  }

  const assignment = submission.assignment;
  const isGraded = submission.status === 'graded';
  const passed = isGraded && submission.score !== null && assignment && submission.score >= assignment.passing_score;

  return (
    <PageContainer title="Kết quả bài tập">
      <Card>
        {/* Score summary */}
        {isGraded && (
          <Result
            status={passed ? 'success' : 'warning'}
            title={`${submission.score}/${assignment?.total_points || 0} điểm`}
            subTitle={passed ? 'Chúc mừng! Bạn đã đạt!' : 'Bạn chưa đạt điểm tối thiểu.'}
          />
        )}

        {!isGraded && (
          <Result
            status="info"
            title="Chờ chấm điểm"
            subTitle="Bài tập của bạn đang chờ giảng viên chấm điểm."
          />
        )}

        {/* Feedback */}
        {submission.feedback && (
          <Card size="small" title="Nhận xét của giảng viên" style={{ marginBottom: 16 }}>
            <Paragraph>{submission.feedback}</Paragraph>
          </Card>
        )}

        {/* Quiz question results */}
        {assignment?.assignment_type === 'quiz' && submission.question_results && submission.question_results.length > 0 && (
          <Card title="Chi tiết câu hỏi">
            <List
              dataSource={submission.question_results}
              renderItem={(item: any, index: number) => (
                <List.Item>
                  <div style={{ width: '100%' }}>
                    <div style={{ marginBottom: 8 }}>
                      <Space>
                        {item.is_correct ? (
                          <CheckCircleOutlined style={{ color: '#52c41a' }} />
                        ) : (
                          <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                        )}
                        <Text strong>Câu {index + 1}:</Text>
                        <Text>{item.question_text}</Text>
                        <Tag color={item.is_correct ? 'green' : 'red'}>
                          {item.is_correct ? `+${item.points}` : '0'} điểm
                        </Tag>
                      </Space>
                    </div>
                    <div style={{ marginLeft: 24 }}>
                      {item.options?.map((opt: any) => {
                        const isSelected = item.selected_options?.includes(opt.id);
                        const isCorrect = opt.is_correct;
                        let bgColor = 'transparent';
                        if (isCorrect) bgColor = '#f6ffed';
                        if (isSelected && !isCorrect) bgColor = '#fff2f0';

                        return (
                          <div
                            key={opt.id}
                            style={{
                              padding: '4px 8px',
                              marginBottom: 4,
                              backgroundColor: bgColor,
                              borderRadius: 4,
                            }}
                          >
                            <Space>
                              {isSelected && <Tag color="blue">Đã chọn</Tag>}
                              {isCorrect && <Tag color="green">Đáp án đúng</Tag>}
                              <Text>{opt.text}</Text>
                            </Space>
                          </div>
                        );
                      })}
                      {item.explanation && (
                        <div style={{ marginTop: 8 }}>
                          <Text type="secondary">Giải thích: {item.explanation}</Text>
                        </div>
                      )}
                    </div>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        )}

        {/* Essay content */}
        {assignment?.assignment_type === 'essay' && submission.answers?.text && (
          <Card size="small" title="Bài viết của bạn" style={{ marginTop: 16 }}>
            <div style={{ whiteSpace: 'pre-wrap' }}>{submission.answers.text}</div>
          </Card>
        )}

        {/* Upload file */}
        {assignment?.assignment_type === 'upload' && submission.answers?.file_url && (
          <Card size="small" title="File đã nộp" style={{ marginTop: 16 }}>
            <a href={submission.answers.file_url} target="_blank" rel="noopener noreferrer">
              {submission.answers.file_name || 'Xem file'}
            </a>
          </Card>
        )}

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Space>
            <Button
              type="primary"
              onClick={() => history.push(`/student/courses/${assignment?.course_id}/lessons/${assignment?.lesson_id}`)}
            >
              Quay lại bài học
            </Button>
            <Button onClick={() => history.push('/student/my-courses')}>
              Khóa học của tôi
            </Button>
          </Space>
        </div>
      </Card>
    </PageContainer>
  );
};

export default AssignmentResultPage;
```

- [x] **Step 2: Verify compilation**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

- [x] **Step 3: Commit**

```bash
git add frontend/src/pages/student/assignments/result/index.tsx
git commit -m "feat(frontend): add student assignment result page with quiz details"
```

---

## Task 14: Update Routes and Lesson View Integration

**Files:**
- Modify: `frontend/config/routes.ts`
- Modify: `frontend/src/pages/student/lesson-view/index.tsx`

- [x] **Step 1: Add assignment routes to config**

Add after the instructor courses routes:
```typescript
// Assignment routes (Instructor)
{ path: '/instructor/assignments', name: 'Quản lý bài tập', icon: 'FileText', component: './instructor/assignments', access: 'canInstructor' },
{ path: '/instructor/assignments/create', name: 'Tạo bài tập', component: './instructor/assignments/create', hideInMenu: true },
{ path: '/instructor/assignments/:id/edit', name: 'Chỉnh sửa bài tập', component: './instructor/assignments/edit', hideInMenu: true },
{ path: '/instructor/assignments/:id/submissions', name: 'Bài nộp', component: './instructor/assignments/submissions', hideInMenu: true },
```

Add after the student lesson-view route:
```typescript
// Assignment routes (Student)
{ path: '/student/assignments/:id', name: 'Làm bài tập', component: './student/assignments/take', hideInMenu: true },
{ path: '/student/assignments/:id/result', name: 'Kết quả bài tập', component: './student/assignments/result', hideInMenu: true },
```

- [x] **Step 2: Update lesson view to show assignment card**

In `frontend/src/pages/student/lesson-view/index.tsx`, add import:
```typescript
import { getAssignments, type Assignment } from '@/services/ant-design-pro/assignments';
```

Add state:
```typescript
const [assignment, setAssignment] = useState<Assignment | null>(null);
```

Add fetch function (after fetchLesson):
```typescript
const fetchAssignment = useCallback(async () => {
  if (!lessonId) return;
  try {
    const res = await getAssignments({ lesson_id: lessonId, is_published: 'true' });
    if (res.data && res.data.length > 0) {
      setAssignment(res.data[0]);
    } else {
      setAssignment(null);
    }
  } catch (err) {
    setAssignment(null);
  }
}, [lessonId]);
```

Call fetchAssignment in the init useEffect.

Add assignment card before the lesson content (after the lesson sidebar):
```typescript
{assignment && (
  <Card
    size="small"
    style={{ marginBottom: 16, borderColor: '#4F46E5' }}
    title={<><FileTextOutlined /> Bài tập: {assignment.title}</>}
  >
    <Space direction="vertical" style={{ width: '100%' }}>
      <Space>
        <Tag color="blue">{assignment.assignment_type === 'quiz' ? 'Trắc nghiệm' : assignment.assignment_type === 'essay' ? 'Tự luận' : 'Nộp file'}</Tag>
        <Text type="secondary">Điểm đạt: {assignment.passing_score}/{assignment.total_points}</Text>
        {assignment.time_limit_minutes && <Text type="secondary"><ClockCircleOutlined /> {assignment.time_limit_minutes} phút</Text>}
      </Space>
      <Button
        type="primary"
        onClick={() => history.push(`/student/assignments/${assignment.id}`)}
      >
        Làm bài tập
      </Button>
    </Space>
  </Card>
)}
```

Add import for icons:
```typescript
import { FileTextOutlined, ClockCircleOutlined } from '@ant-design/icons';
```

- [x] **Step 3: Verify compilation**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

- [x] **Step 4: Commit**

```bash
git add frontend/config/routes.ts frontend/src/pages/student/lesson-view/index.tsx
git commit -m "feat(frontend): add assignment routes and lesson view integration"
```

---

## Task 15: Update Database SQL and Seeder

**Files:**
- Modify: `database/eduvi_lms.sql`
- Modify: `backend/src/seeders/course-seeder.ts`

- [x] **Step 1: Add submissions table to SQL**

Add after quiz_questions table:
```sql
-- ----------------------------
-- Table structure for submissions
-- ----------------------------
CREATE TABLE `submissions`  (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `assignment_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `attempt_number` int NOT NULL DEFAULT 1,
  `answers` json NOT NULL,
  `score` float NULL DEFAULT NULL,
  `status` enum('in_progress','submitted','graded') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'submitted',
  `feedback` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `graded_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `graded_at` datetime NULL DEFAULT NULL,
  `submitted_at` datetime NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_assignment_user_attempt`(`assignment_id`, `user_id`, `attempt_number`) USING BTREE,
  INDEX `idx_submission_assignment`(`assignment_id`) USING BTREE,
  INDEX `idx_submission_user`(`user_id`) USING BTREE,
  CONSTRAINT `fk_submissions_assignment` FOREIGN KEY (`assignment_id`) REFERENCES `assignments` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `fk_submissions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `fk_submissions_graded_by` FOREIGN KEY (`graded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;
```

- [x] **Step 2: Add seed data for essay and upload assignments**

Add to the INSERT statements for assignments:
```sql
INSERT INTO `assignments` VALUES ('e1a2b3c4-d5e6-f7a8-b9c0-d1e2f3a4b5c6', 'c0a80101-0001-0001-0001-000000000001', 'c0a80101-0001-0001-0001-000000000005', 'Bài luận về Express Middleware', 'Viết bài luận giải thích cách middleware hoạt động trong Express.js', 'essay', 100, 60, NULL, 1, 0, '2026-06-30 23:59:59', 1, NULL, '2026-06-01 00:00:00', '2026-06-01 00:00:00');
INSERT INTO `assignments` VALUES ('f2b3c4d5-e6f7-a8b9-c0d1-e2f3a4b5c6d7', 'c0a80101-0001-0001-0001-000000000001', 'c0a80101-0001-0001-0001-000000000007', 'Bài nộp project cuối khóa', 'Upload file source code project cuối khóa', 'upload', 100, 50, NULL, 1, 0, '2026-07-15 23:59:59', 1, NULL, '2026-06-01 00:00:00', '2026-06-01 00:00:00');
```

- [x] **Step 3: Update seeder**

Add to `backend/src/seeders/course-seeder.ts` after existing assignment:
```typescript
// Essay assignment
const essayAssignment = await Assignment.create({
  course_id: nodeCourse.id,
  lesson_id: lesson5.id, // Adjust to actual lesson
  title: 'Bài luận về Express Middleware',
  description: 'Viết bài luận giải thích cách middleware hoạt động trong Express.js',
  assignment_type: 'essay',
  total_points: 100,
  passing_score: 60,
  attempts_allowed: 1,
  due_date: new Date('2026-06-30'),
  is_published: true,
});

// Upload assignment
const uploadAssignment = await Assignment.create({
  course_id: nodeCourse.id,
  lesson_id: lesson7.id, // Adjust to actual lesson
  title: 'Bài nộp project cuối khóa',
  description: 'Upload file source code project cuối khóa',
  assignment_type: 'upload',
  total_points: 100,
  passing_score: 50,
  attempts_allowed: 1,
  due_date: new Date('2026-07-15'),
  is_published: true,
});

// Sample submission for quiz (graded)
await Submission.create({
  assignment_id: quizAssignment.id,
  user_id: studentUser.id,
  attempt_number: 1,
  answers: [
    { question_id: q1.id, selected_options: ['a'] },
    { question_id: q2.id, selected_options: ['b'] },
  ],
  score: 10,
  status: 'graded',
  submitted_at: new Date(),
});

// Sample submission for essay (pending)
await Submission.create({
  assignment_id: essayAssignment.id,
  user_id: studentUser.id,
  attempt_number: 1,
  answers: { text: 'Middleware trong Express.js là các hàm có thể truy cập vào đối tượng request, response và hàm next...' },
  status: 'submitted',
  submitted_at: new Date(),
});
```

- [x] **Step 4: Verify backend compiles**

Run: `cd backend && npx tsc --noEmit`
Expected: No errors

- [x] **Step 5: Commit**

```bash
git add database/eduvi_lms.sql backend/src/seeders/course-seeder.ts
git commit -m "feat: add submissions table SQL and extend seeder with essay/upload assignments"
```

---

## Task 16: End-to-End Verification

- [x] **Step 1: Start backend and verify routes**

Run: `cd backend && npm run dev`
Expected: Server starts, shows "Eduvi LMS Backend server is running"

- [x] **Step 2: Test API endpoints manually**

```bash
# Login as instructor
curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d '{"usernameOrEmail":"instructor@demo.com","password":"ant.design"}'

# Create assignment (use token from login)
curl -X POST http://localhost:5000/api/assignments -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{"title":"Test Quiz","assignment_type":"quiz","course_id":"<course_id>"}'

# Add question
curl -X POST http://localhost:5000/api/assignments/<id>/questions -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{"question_text":"Test?","question_type":"single","options":[{"id":"a","text":"Yes","is_correct":true},{"id":"b","text":"No","is_correct":false}]}'

# Publish
curl -X PATCH http://localhost:5000/api/assignments/<id>/publish -H "Authorization: Bearer <token>"
```

- [x] **Step 3: Start frontend and verify pages load**

Run: `cd frontend && npm start`
Expected: Frontend starts on port 8000

- [x] **Step 4: Verify all pages accessible**

- Navigate to `/instructor/assignments` — should show empty list
- Navigate to `/instructor/assignments/create` — should show form
- Create a quiz assignment with questions
- Navigate to `/student/assignments/<id>` — should show quiz
- Submit quiz — should show results

- [x] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: complete quiz/assignment feature implementation"
```

---

## Implementation Notes (2026-06-01)

**Completed:** Tasks 1-16 (all tasks)

**Adjustments from plan:**
1. `LessonProgress` model uses `is_completed` (boolean) + `completed_at`, not a `status` field — corrected in submission controller's `gradeQuizSubmission` and `gradeSubmission` functions
2. Student upload uses existing `uploadImage` from `@/services/ant-design-pro/uploads` instead of non-existent `uploadsService.uploadFile`
3. `QuizQuestion.max()` returns `number | null | {}` — added `as number` cast in `addQuestion` to fix TS2365 error
4. Pre-existing TS2339 errors in `instructor/dashboard/index.tsx` and `student/dashboard/index.tsx` (unrelated to this feature)

**Remaining:** None — all tasks completed

---

## Spec Coverage Checklist

| Spec Requirement | Task |
|-----------------|------|
| Submission model | Task 1, 2 |
| Assignment CRUD API | Task 3, 4 |
| Question management API | Task 3, 4 |
| Submission API (submit) | Task 5, 6 |
| Submission API (view/grade) | Task 5, 6 |
| Auto-grading logic | Task 5 |
| Quiz grading algorithm | Task 5 |
| LessonProgress integration | Task 5 |
| Backend tests | Task 7 |
| Frontend service layer | Task 8 |
| Instructor assignment list | Task 9 |
| Instructor create/edit assignment | Task 10 |
| Instructor submissions & grading | Task 11 |
| Student take assignment | Task 12 |
| Student result view | Task 13 |
| Routes config | Task 14 |
| Lesson view integration | Task 14 |
| SQL schema update | Task 15 |
| Seeder update | Task 15 |
