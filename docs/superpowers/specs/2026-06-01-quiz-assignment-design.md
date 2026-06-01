# Quiz & Assignment Feature Design Spec

**Date:** 2026-06-01  
**Author:** Eduvi LMS Team  
**Status:** Draft  
**Scope:** Full assignment system with 3 types (Quiz, Essay, Upload), auto-grading for quiz, manual grading for essay/upload

---

## 1. Overview

### 1.1 Purpose

Xây dựng hệ thống bài tập (Assignment) đầy đủ cho Eduvi LMS, hỗ trợ 3 loại:
- **Quiz** — Trắc nghiệm với auto-grading
- **Essay** — Tự luận với manual grading
- **Upload** — Nộp file với manual grading

### 1.2 Goals

- Cho phép giảng viên tạo và quản lý bài tập cho từng lesson
- Học viên nộp bài trực tiếp từ lesson view
- Quiz tự động chấm điểm ngay sau khi nộp
- Essay/Upload chờ giảng viên chấm thủ công
- Hiển thị kết quả và giải thích (nếu được bật)

### 1.3 Scope

| Trong scope | Ngoài scope |
|-------------|-------------|
| CRUD assignments + questions | Timer countdown (chỉ hiển thị time limit) |
| Quiz auto-grading | Real-time collaboration |
| Essay/Upload manual grading | File preview trong upload |
| Submission history | Email notification |
| LessonProgress integration | Parent portal integration |

---

## 2. Database Schema

### 2.1 Existing Models (đã có)

**Assignment** (`assignments` table):
- `id` UUID PK
- `course_id` UUID FK → courses
- `lesson_id` UUID FK → lessons (nullable)
- `title` VARCHAR(255)
- `description` TEXT
- `assignment_type` ENUM('quiz', 'essay', 'upload')
- `total_points` INTEGER (default 100)
- `passing_score` FLOAT (default 50)
- `time_limit_minutes` INTEGER (nullable)
- `attempts_allowed` INTEGER (default 1)
- `show_answer_after` BOOLEAN (default false)
- `due_date` DATETIME (nullable)
- `is_published` BOOLEAN (default false)
- `deleted_at` DATETIME (soft delete)

**QuizQuestion** (`quiz_questions` table):
- `id` UUID PK
- `assignment_id` UUID FK → assignments
- `question_text` TEXT
- `question_type` ENUM('single', 'multiple', 'true_false')
- `options` JSON — `[{ id, text, is_correct }]`
- `explanation` TEXT (nullable)
- `points` INTEGER (default 1)
- `sort_order` INTEGER (default 0)

### 2.2 New Model: Submission

**Submission** (`submissions` table):

```sql
CREATE TABLE `submissions` (
  `id` char(36) NOT NULL,
  `assignment_id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `attempt_number` int NOT NULL DEFAULT '1',
  `answers` json NOT NULL,
  `score` float DEFAULT NULL,
  `status` enum('in_progress','submitted','graded') NOT NULL DEFAULT 'submitted',
  `feedback` text,
  `graded_by` char(36) DEFAULT NULL,
  `graded_at` datetime DEFAULT NULL,
  `submitted_at` datetime NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_assignment_user_attempt` (`assignment_id`,`user_id`,`attempt_number`),
  KEY `idx_assignment_id` (`assignment_id`),
  KEY `idx_user_id` (`user_id`),
  CONSTRAINT `fk_submissions_assignment` FOREIGN KEY (`assignment_id`) REFERENCES `assignments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_submissions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_submissions_graded_by` FOREIGN KEY (`graded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `assignment_id` | UUID | FK → assignments |
| `user_id` | UUID | FK → users (student) |
| `attempt_number` | INT | Lần nộp thứ mấy (1, 2, 3...) |
| `answers` | JSON | Câu trả lời (format tùy type) |
| `score` | FLOAT | Điểm (auto cho quiz, manual cho essay/upload) |
| `status` | ENUM | 'in_progress', 'submitted', 'graded' |
| `feedback` | TEXT | Nhận xét của giảng viên |
| `graded_by` | UUID | FK → users (instructor chấm) |
| `graded_at` | DATETIME | Thời điểm chấm |
| `submitted_at` | DATETIME | Thời điểm nộp |

**Answers JSON format:**

```json
// Quiz
[
  { "question_id": "uuid-1", "selected_options": ["opt-a"] },
  { "question_id": "uuid-2", "selected_options": ["opt-a", "opt-c"] }
]

// Essay
{ "text": "Nội dung bài viết..." }

// Upload
{ "file_url": "https://res.cloudinary.com/...", "file_name": "bai-tap.pdf" }
```

### 2.3 Associations

```typescript
// Existing (trong models/index.ts)
Assignment.hasMany(QuizQuestion, { foreignKey: 'assignment_id', as: 'questions', onDelete: 'CASCADE' });
QuizQuestion.belongsTo(Assignment, { foreignKey: 'assignment_id', as: 'assignment' });

// New
Assignment.hasMany(Submission, { foreignKey: 'assignment_id', as: 'submissions', onDelete: 'CASCADE' });
Submission.belongsTo(Assignment, { foreignKey: 'assignment_id', as: 'assignment' });

User.hasMany(Submission, { foreignKey: 'user_id', as: 'submissions', onDelete: 'CASCADE' });
Submission.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(Submission, { foreignKey: 'graded_by', as: 'graded_submissions' });
Submission.belongsTo(User, { foreignKey: 'graded_by', as: 'grader' });
```

---

## 3. Backend API Design

### 3.1 Assignment Module

**Base path:** `/api/assignments`

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/` | Tạo assignment mới | Instructor (chủ course) |
| GET | `/` | List assignments | Instructor, Student |
| GET | `/:id` | Chi tiết assignment + questions | All |
| PUT | `/:id` | Cập nhật assignment | Instructor (chủ course) |
| DELETE | `/` | Xóa assignment (soft delete) | Instructor (chủ course) |
| PATCH | `/:id/publish` | Publish/unpublish | Instructor (chủ course) |

**Query params cho GET /:**
- `lesson_id` — filter theo lesson
- `course_id` — filter theo course
- `type` — filter theo assignment_type
- `is_published` — filter theo publish status

**Request body cho POST/PUT:**

```json
{
  "lesson_id": "uuid",
  "title": "Bài kiểm tra chương 3",
  "description": "Mô tả bài tập",
  "assignment_type": "quiz",
  "total_points": 100,
  "passing_score": 50,
  "time_limit_minutes": 30,
  "attempts_allowed": 1,
  "show_answer_after": true,
  "due_date": "2026-06-15T23:59:59Z"
}
```

### 3.2 Question Management

**Base path:** `/api/assignments/:assignmentId/questions`

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/` | Thêm câu hỏi | Instructor (chủ course) |
| PUT | `/questions/:id` | Sửa câu hỏi | Instructor (chủ course) |
| DELETE | `/questions/:id` | Xóa câu hỏi | Instructor (chủ course) |
| PUT | `/reorder` | Sắp xếp lại câu hỏi | Instructor (chủ course) |

**Request body cho POST/PUT question:**

```json
{
  "question_text": "Kiến trúc chạy (Runtime) của Node.js là gì?",
  "question_type": "single",
  "options": [
    { "id": "a", "text": "Đơn luồng (Single-threaded)", "is_correct": true },
    { "id": "b", "text": "Đa luồng (Multi-threaded)", "is_correct": false },
    { "id": "c", "text": "Lai (Hybrid)", "is_correct": false }
  ],
  "explanation": "Node.js sử dụng event loop đơn luồng với libuv thread pool",
  "points": 5,
  "sort_order": 1
}
```

### 3.3 Submission Module

**Endpoints:**

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/assignments/:id/submit` | Nộp bài | Student (enrolled) |
| GET | `/api/assignments/:id/submissions` | Lịch sử nộp bài của mình | Student |
| GET | `/api/submissions/:id` | Chi tiết submission | Student (own), Instructor |
| GET | `/api/assignments/:id/grading` | List submissions cần chấm | Instructor (chủ course) |
| PUT | `/api/submissions/:id/grade` | Chấm bài | Instructor (chủ course) |

**Request body cho POST /submit:**

```json
// Quiz
{
  "answers": [
    { "question_id": "uuid-1", "selected_options": ["a"] },
    { "question_id": "uuid-2", "selected_options": ["a", "c"] }
  ]
}

// Essay
{
  "answers": { "text": "Node.js sử dụng kiến trúc event loop..." }
}

// Upload
{
  "answers": { "file_url": "https://res.cloudinary.com/...", "file_name": "bai-tap.pdf" }
}
```

**Request body cho PUT /grade:**

```json
{
  "score": 85,
  "feedback": "Bài làm tốt, cần cải thiện phần middleware"
}
```

### 3.4 Authorization Rules

| Action | Student | Instructor | Admin |
|--------|---------|------------|-------|
| View assignments (enrolled course) | ✅ | ✅ | ✅ |
| Create/Edit/Delete assignment | ❌ | ✅ (own course) | ✅ |
| Submit assignment | ✅ (enrolled) | ❌ | ❌ |
| View own submissions | ✅ | ✅ | ✅ |
| View all submissions | ❌ | ✅ (own course) | ✅ |
| Grade submissions | ❌ | ✅ (own course) | ✅ |

---

## 4. Auto-grading Logic

### 4.1 Quiz Grading Algorithm

```
function gradeQuizSubmission(submission, assignment):
  questions = assignment.questions
  answers = submission.answers

  totalScore = 0
  results = []

  for each question in questions:
    studentAnswer = answers.find(a => a.question_id === question.id)
    correctOptions = question.options
      .filter(o => o.is_correct)
      .map(o => o.id)
      .sort()
    selectedOptions = (studentAnswer?.selected_options || []).sort()

    isCorrect = arraysEqual(correctOptions, selectedOptions)

    if isCorrect:
      totalScore += question.points

    results.push({
      question_id: question.id,
      is_correct: isCorrect,
      selected: selectedOptions,
      correct: correctOptions,
      points_earned: isCorrect ? question.points : 0,
      points_possible: question.points
    })

  submission.score = totalScore
  submission.status = 'graded'
  submission.save()

  return {
    score: totalScore,
    total: assignment.total_points,
    passed: totalScore >= assignment.passing_score,
    results: results
  }
```

### 4.2 Question Type Handling

| Type | Logic |
|------|-------|
| `single` | `selected_options.length === 1` && nằm trong correctOptions |
| `multiple` | So sánh 2 arrays đã sort (tất cả correct phải được chọn, không chọn sai) |
| `true_false` | Coi như single với 2 options |

### 4.3 LessonProgress Integration

Khi submission được graded:

```
if (score >= assignment.passing_score):
  find LessonProgress where user_id AND lesson_id = assignment.lesson_id
  update:
    - status = 'completed'
    - quiz_score = score (nếu lesson_type === 'quiz')
```

Essay/Upload: chỉ cập nhật LessonProgress khi instructor chấm xong VÀ đạt passing_score.

---

## 5. Frontend Design

### 5.1 Instructor Pages

#### 5.1.1 Assignment List (`/instructor/assignments`)

- ProTable hiển thị danh sách assignments
- Columns: title, type (badge), questions count, submissions count, status (published/draft), actions
- Filter: theo course, lesson, type, publish status
- Actions: Edit, Delete, View Submissions, Toggle Publish

#### 5.1.2 Create/Edit Assignment (`/instructor/assignments/create`, `/:id/edit`)

- Form chính: title, description, type (radio), time_limit, attempts, passing_score, due_date
- Section câu hỏi (khi type = quiz):
  - Danh sách câu hỏi có thể reorder (drag & drop)
  - Mỗi câu hỏi: question_text, type selector, options editor, correct answer toggle, points, explanation
  - Nút Add Question, Delete Question

#### 5.1.3 Submissions View (`/instructor/assignments/:id/submissions`)

- ProTable: student name, attempt number, score, status (badge), submitted_at, actions
- Filter: status (submitted/graded), student name
- Click row → modal/page chấm bài:
  - Hiển thị câu trả lời của học viên
  - Form nhập score + feedback
  - Nút Submit Grade

### 5.2 Student Pages

#### 5.2.1 Lesson View Integration

Trong `/student/lesson-view`, khi lesson có assignment:
- Hiển thị card assignment info: title, type, time limit, attempts còn lại, due date
- Nút "Làm bài tập" → chuyển sang trang làm bài

#### 5.2.2 Take Assignment (`/student/assignments/:id`)

**Quiz:**
- Hiển thị tất cả câu hỏi trên 1 trang
- Mỗi câu: question_text, options với radio (single) hoặc checkbox (multiple)
- Timer countdown nếu có time_limit (hiển thị, không auto-submit)
- Nút Submit + confirm dialog

**Essay:**
- Text area lớn để nhập bài viết
- Character count
- Nút Submit

**Upload:**
- Upload component (Multer/Cloudinary)
- Preview file đã upload
- Nút Submit

#### 5.2.3 Result View (`/student/assignments/:id/result`)

**Quiz (ngay sau submit):**
- Tổng điểm / total_points
- Pass/Fail indicator
- Nếu `show_answer_after = true`:
  - Mỗi câu: câu hỏi, đáp án đã chọn, đáp án đúng, giải thích
  - Màu xanh cho đúng, đỏ cho sai

**Essay/Upload (chờ chấm):**
- Status: "Chờ giảng viên chấm"
- Khi đã chấm: điểm, feedback của giảng viên

### 5.3 Frontend Routes

```typescript
// Instructor routes (thêm vào config/routes.ts)
{
  path: '/instructor/assignments',
  name: 'assignments',
  icon: 'FileText',
  access: 'canInstructor',
  component: 'instructor/assignments',
},
{
  path: '/instructor/assignments/create',
  component: 'instructor/assignments/create',
  hideInMenu: true,
},
{
  path: '/instructor/assignments/:id/edit',
  component: 'instructor/assignments/edit',
  hideInMenu: true,
},
{
  path: '/instructor/assignments/:id/submissions',
  component: 'instructor/assignments/submissions',
  hideInMenu: true,
},

// Student routes
{
  path: '/student/assignments/:id',
  component: 'student/assignments/take',
  hideInMenu: true,
},
{
  path: '/student/assignments/:id/result',
  component: 'student/assignments/result',
  hideInMenu: true,
},
```

### 5.4 Frontend Service Layer

File: `frontend/src/services/ant-design-pro/assignments.ts`

```typescript
// Types
interface Assignment {
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
  submissions_count?: number;
}

interface QuizQuestion {
  id: string;
  assignment_id: string;
  question_text: string;
  question_type: 'single' | 'multiple' | 'true_false';
  options: { id: string; text: string; is_correct: boolean }[];
  explanation: string | null;
  points: number;
  sort_order: number;
}

interface Submission {
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
}

// API Functions
export async function getAssignments(params?: {
  lesson_id?: string;
  course_id?: string;
  type?: string;
  is_published?: boolean;
}) { ... }

export async function getAssignment(id: string) { ... }

export async function createAssignment(data: Partial<Assignment>) { ... }

export async function updateAssignment(id: string, data: Partial<Assignment>) { ... }

export async function deleteAssignment(id: string) { ... }

export async function publishAssignment(id: string, publish: boolean) { ... }

export async function addQuestion(assignmentId: string, data: Partial<QuizQuestion>) { ... }

export async function updateQuestion(id: string, data: Partial<QuizQuestion>) { ... }

export async function deleteQuestion(id: string) { ... }

export async function reorderQuestions(assignmentId: string, order: string[]) { ... }

export async function submitAssignment(assignmentId: string, answers: any) { ... }

export async function getMySubmissions(assignmentId: string) { ... }

export async function getSubmission(id: string) { ... }

export async function getSubmissionsForGrading(assignmentId: string) { ... }

export async function gradeSubmission(id: string, data: { score: number; feedback: string }) { ... }
```

---

## 6. Error Handling

### 6.1 Validation Rules

| Rule | Error Message | HTTP Code |
|------|---------------|-----------|
| Assignment not published | "Assignment is not published" | 400 |
| Past due date | "Submission deadline has passed" | 400 |
| No attempts remaining | "No attempts remaining" | 400 |
| Not enrolled | "You are not enrolled in this course" | 403 |
| Empty quiz answers | "No answers provided" | 400 |
| Empty essay text | "Essay text is required" | 400 |
| No file uploaded | "File is required for upload assignment" | 400 |

### 6.2 Authorization Errors

| Scenario | Error Message | HTTP Code |
|----------|---------------|-----------|
| Student views others' submissions | "You can only view your own submissions" | 403 |
| Non-instructor grades | "Only the course instructor can grade submissions" | 403 |
| Non-owner edits assignment | "You can only edit assignments for your own courses" | 403 |

### 6.3 Error Response Format

```json
{
  "success": false,
  "message": "Assignment is not published",
  "error": "ASSIGNMENT_NOT_PUBLISHED"
}
```

---

## 7. Seeder & Test Data

### 7.1 Extended Seed Data

**Assignments:**
1. Quiz — "Bài kiểm tra Node.js Runtime" (đã có)
2. Essay — "Bài luận về Express Middleware" (mới)
3. Upload — "Bài nộp project cuối khóa" (mới)

**Quiz Questions (mở rộng từ 2 lên 6 câu):**
1. "Kiến trúc chạy (Runtime) của Node.js là đơn luồng hay đa luồng?" — single
2. "Thư viện nào cung cấp nhân ThreadPool xử lý bất đồng bộ trong Node.js?" — single
3. "HTTP method nào dùng để tạo tài nguyên mới?" — single
4. "Express middleware có thể gọi next() để chuyển control cho middleware tiếp theo?" — true_false
5. "Những cách nào để handle errors trong Express?" — multiple
6. "Port mặc định của HTTP server là bao nhiêu?" — single

**Sample Submissions:**
1. Quiz submission — graded, score 4/6, passed
2. Essay submission — submitted, chờ chấm
3. Upload submission — submitted, chờ chấm

### 7.2 SQL Updates

Thêm vào `database/eduvi_lms.sql`:
- Table `submissions` (schema ở Section 2.2)
- Seed data cho assignments, quiz_questions, submissions

---

## 8. Implementation Order

### Phase 1: Backend Core
1. Tạo `Submission` model
2. Cập nhật associations trong `models/index.ts`
3. Tạo `assignment.controller.ts` + `assignment.routes.ts`
4. Tạo `submission.controller.ts` + `submission.routes.ts`
5. Implement auto-grading logic
6. Register routes trong `app.ts`

### Phase 2: Backend Testing
1. Viết test cho assignment CRUD
2. Viết test cho submission flow
3. Viết test cho auto-grading
4. Update seeder

### Phase 3: Frontend Service
1. Tạo `assignments.ts` service file
2. Types definitions

### Phase 4: Instructor Frontend
1. Assignment list page
2. Create/Edit assignment page (với question management)
3. Submissions view + grading page

### Phase 5: Student Frontend
1. Lesson view integration
2. Take assignment page (Quiz/Essay/Upload)
3. Result view page

### Phase 6: Integration
1. LessonProgress integration
2. End-to-end testing
3. Update routes config

---

## 9. File Structure Summary

### Backend (mới)

```
backend/src/
├── models/
│   └── Submission.model.ts          (NEW)
├── controllers/
│   ├── assignment.controller.ts     (NEW)
│   └── submission.controller.ts     (NEW)
├── routes/
│   ├── assignment.routes.ts         (NEW)
│   └── submission.routes.ts         (NEW)
├── services/
│   ├── assignment.service.ts        (NEW)
│   └── submission.service.ts        (NEW)
├── models/index.ts                  (MODIFY - add associations)
└── app.ts                           (MODIFY - register routes)
```

### Frontend (mới)

```
frontend/src/
├── pages/
│   ├── instructor/
│   │   └── assignments/
│   │       ├── index.tsx            (NEW - list)
│   │       ├── create/index.tsx     (NEW)
│   │       ├── edit/index.tsx       (NEW)
│   │       └── submissions/index.tsx (NEW)
│   └── student/
│       └── assignments/
│           ├── take/index.tsx       (NEW)
│           └── result/index.tsx     (NEW)
├── services/ant-design-pro/
│   └── assignments.ts               (NEW)
└── config/routes.ts                 (MODIFY - add routes)
```

### Database (mới)

```
database/
└── eduvi_lms.sql                    (MODIFY - add submissions table + seed)
```

---

## 10. Dependencies

### Backend
- Existing: Express, Sequelize, MySQL2, JWT, Multer, Cloudinary
- No new npm packages required

### Frontend
- Existing: React, Ant Design, ProComponents, UmiJS, @tanstack/react-query
- No new npm packages required
- Use existing ProTable, ProForm, ProSteps components

---

## 11. Success Criteria

- [ ] Instructor có thể tạo assignment (Quiz/Essay/Upload) cho lesson
- [ ] Instructor có thể thêm/sửa/xóa câu hỏi cho quiz
- [ ] Student có thể nộp bài từ lesson view
- [ ] Quiz tự động chấm điểm ngay sau khi nộp
- [ ] Essay/Upload hiển thị "chờ chấm" sau khi nộp
- [ ] Instructor có thể chấm bài essay/upload với score + feedback
- [ ] Student thấy kết quả + giải thích (nếu show_answer_after)
- [ ] LessonProgress cập nhật khi đạt passing_score
- [ ] Kiểm tra attempts_allowed và due_date
- [ ] Seed data đầy đủ cho demo
