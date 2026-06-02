# Student Navigation & Teacher Submission Fixes - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix two UX issues — students can't find the course catalog, and teachers can't see assignment submission details.

**Architecture:** Three-pronged approach: (1) add navigation links to student sidebar, dashboard, and empty states; (2) improve error display for teacher submission pages; (3) seed additional submission data for demo purposes.

**Tech Stack:** React + Ant Design Pro (frontend), Express + Sequelize (backend), MySQL (database)

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `frontend/config/routes.ts` | Modify | Add `/courses` route to student sidebar group |
| `frontend/src/pages/student/dashboard/index.tsx` | Modify | Add "Tìm khóa học" banner with link to `/courses` |
| `frontend/src/pages/student/my-courses/index.tsx` | Modify | Add "Khám phá khóa học" button in empty state |
| `frontend/src/pages/instructor/assignments/submissions/index.tsx` | Modify | Show 403 error message, add empty text for no submissions |
| `backend/src/seeders/course-seeder.ts` | Modify | Add 5 new submission records |
| `database/eduvi_lms.sql` | Modify | Add 5 new submission rows to match seeder |

---

## Task 1: Add course catalog route to student sidebar

**Files:**
- Modify: `frontend/config/routes.ts:58-100`

- [ ] **Step 1: Add route entry to student group**

Open `frontend/config/routes.ts`. Find the student routes section (lines 58-100). Add a new route entry after the "Khóa học của tôi" route (after line 80):

```typescript
      {
        path: '/courses',
        name: '📚 Danh sách khóa học',
        icon: 'SearchOutlined',
        component: './courses/list',
      },
```

The full student routes section should now look like:

```typescript
  // ================= STUDENT PORTAL =================
  {
    path: '/student',
    name: 'Học viên',
    icon: 'user',
    access: 'canStudent',
    routes: [
      {
        path: '/student',
        redirect: '/student/dashboard',
      },
      {
        path: '/student/dashboard',
        name: 'Góc học tập',
        icon: 'dashboard',
        component: './student/dashboard',
      },
      {
        path: '/student/my-courses',
        name: 'Khóa học của tôi',
        icon: 'book',
        component: './student/my-courses',
      },
      {
        path: '/courses',
        name: '📚 Danh sách khóa học',
        icon: 'SearchOutlined',
        component: './courses/list',
      },
      {
        path: '/student/courses/:courseId/lessons/:lessonId',
        name: 'Xem bài giảng',
        component: './student/lesson-view',
        hideInMenu: true,
      },
      {
        path: '/student/assignments/:id',
        name: 'Làm bài tập',
        component: './student/assignments/take',
        hideInMenu: true,
      },
      {
        path: '/student/assignments/:id/result',
        name: 'Kết quả bài tập',
        component: './student/assignments/result',
        hideInMenu: true,
      },
    ],
  },
```

- [ ] **Step 2: Verify the route appears**

Run the frontend dev server:
```bash
cd frontend && npm run dev
```

Login as a student (username: `annv`, password: `ant.design`). Check that "📚 Danh sách khóa học" appears in the left sidebar under "Học viên". Click it and verify the course catalog page loads.

- [ ] **Step 3: Commit**

```bash
git add frontend/config/routes.ts
git commit -m "feat: add course catalog route to student sidebar"
```

---

## Task 2: Add "Tìm khóa học" banner on student dashboard

**Files:**
- Modify: `frontend/src/pages/student/dashboard/index.tsx:1-4, 108-116`

- [ ] **Step 1: Add missing imports**

Open `frontend/src/pages/student/dashboard/index.tsx`. The file currently imports from antd (line 3) and does not import `history` from `@umijs/max`. Update the imports:

At line 1-5, the current imports are:
```typescript
import { BookOutlined, ClockCircleOutlined, StarOutlined, TrophyOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { Card, Col, Progress, Row, Statistic, Table, Tag, Spin, message } from 'antd';
import React, { useEffect, useState } from 'react';
import { getStudentDashboard, StudentDashboardData } from '@/services/ant-design-pro/dashboard';
```

Add the `history` import after line 4:
```typescript
import { history } from '@umijs/max';
```

Also add `Button` to the antd import (line 3):
```typescript
import { Button, Card, Col, Progress, Row, Statistic, Table, Tag, Spin, message } from 'antd';
```

- [ ] **Step 2: Add banner component**

Find the section after the stats cards (after line 108, which closes the `</Row>` of stats). Insert a new Row before the "Khóa học đang diễn ra" card (before line 110):

```tsx
      <Row gutter={16} style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: 12,
            }}
            styles={{ body: { padding: '24px 32px' } }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ color: '#fff', margin: 0, fontSize: 18, fontWeight: 600 }}>
                  Khám phá khóa học mới
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.85)', margin: '8px 0 0', fontSize: 14 }}>
                  Hàng trăm khóa học đang chờ bạn khám phá
                </p>
              </div>
              <Button
                type="primary"
                ghost
                size="large"
                style={{ borderColor: '#fff', color: '#fff', fontWeight: 500 }}
                onClick={() => history.push('/courses')}
              >
                Tìm khóa học
              </Button>
            </div>
          </Card>
        </Col>
      </Row>
```

- [ ] **Step 3: Verify the banner**

Run the frontend dev server. Login as student. The dashboard should now show a purple gradient banner with "Tìm khóa học" button between the stats cards and the "Khóa học đang diễn ra" table.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/student/dashboard/index.tsx
git commit -m "feat: add course discovery banner on student dashboard"
```

---

## Task 3: Add "Khám phá khóa học" button in empty state

**Files:**
- Modify: `frontend/src/pages/student/my-courses/index.tsx:33-36`

- [ ] **Step 1: Update the Empty component**

Open `frontend/src/pages/student/my-courses/index.tsx`. Find the `renderCourseGrid` function (line 33). The current empty state (line 34-36) is:

```tsx
    if (enrollments.length === 0) {
      return <Empty description={isCompleted ? 'Bạn chưa hoàn thành khóa học nào.' : 'Bạn chưa đăng ký khóa học nào.'} />;
    }
```

Replace it with:

```tsx
    if (enrollments.length === 0) {
      return (
        <Empty description={isCompleted ? 'Bạn chưa hoàn thành khóa học nào.' : 'Bạn chưa đăng ký khóa học nào.'}>
          {!isCompleted && (
            <Button type="primary" onClick={() => history.push('/courses')}>
              Khám phá khóa học
            </Button>
          )}
        </Empty>
      );
    }
```

Note: `Button` is already imported from antd (line 2). `history` is already imported from `@umijs/max` (line 3).

- [ ] **Step 2: Verify the empty state**

Login as a new student or a student with no enrollments. Go to "Khóa học của tôi". The empty state should now show "Bạn chưa đăng ký khóa học nào." with a "Khám phá khóa học" button below it. Clicking the button should navigate to `/courses`.

Also verify: the "Đã hoàn thành" tab should show "Bạn chưa hoàn thành khóa học nào." WITHOUT the button (because `isCompleted` is true).

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/student/my-courses/index.tsx
git commit -m "feat: add course discovery button in my-courses empty state"
```

---

## Task 4: Improve error display for teacher submissions page

**Files:**
- Modify: `frontend/src/pages/instructor/assignments/submissions/index.tsx:1-3, 130-152`

- [ ] **Step 1: Add Empty import**

Open `frontend/src/pages/instructor/assignments/submissions/index.tsx`. Update the antd import (line 3) to include `Empty`:

Current:
```typescript
import { Button, Card, Form, Input, InputNumber, Modal, Space, Tag, Typography, message } from 'antd';
```

Updated:
```typescript
import { Button, Card, Empty, Form, Input, InputNumber, Modal, Space, Tag, Typography, message } from 'antd';
```

- [ ] **Step 2: Improve catch block error handling**

Find the `request` function's catch block (lines 147-149):

```typescript
          } catch (err) {
            return { data: [], total: 0, success: false };
          }
```

Replace with:

```typescript
          } catch (err: any) {
            const statusCode = err?.response?.status || err?.status;
            if (statusCode === 403) {
              message.error('Bạn không có quyền xem bài nộp của khóa học này');
            } else if (statusCode === 404) {
              message.error('Không tìm thấy bài tập này');
            } else {
              message.error('Không thể tải danh sách bài nộp');
            }
            return { data: [], total: 0, success: false };
          }
```

- [ ] **Step 3: Add empty text for no submissions**

Find the ProTable component (around line 130). Add the `locale` prop to show a meaningful message when the table is empty:

```tsx
      <ProTable<Submission>
        headerTitle="Danh sách bài nộp"
        actionRef={actionRef}
        rowKey="id"
        search={{ labelWidth: 120 }}
        locale={{
          emptyText: <Empty description="Chưa có học sinh nào nộp bài tập này" />,
        }}
        request={async (params, sort) => {
```

- [ ] **Step 4: Verify error handling**

Test scenario 1 — Wrong instructor: Login as `hongvt@921` (instructor 2, teaches Express). Navigate to instructor assignments. Click "Bài nộp" on the quiz assignment (belongs to Node.js course, taught by `binhtt`). Expected: Error toast "Bạn không có quyền xem bài nộp của khóa học này" and empty table with "Chưa có học sinh nào nộp bài tập này".

Test scenario 2 — No submissions: Login as `binhtt` (instructor 1, teaches Node.js). Navigate to instructor assignments. Click "Bài nộp" on the upload assignment (has 0 submissions before seeding). Expected: Empty table with "Chưa có học sinh nào nộp bài tập này".

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/instructor/assignments/submissions/index.tsx
git commit -m "fix: show clear error messages for instructor submission pages"
```

---

## Task 5: Seed additional submission data

**Files:**
- Modify: `backend/src/seeders/course-seeder.ts:207-230`

- [ ] **Step 1: Add new submissions after existing ones**

Open `backend/src/seeders/course-seeder.ts`. Find the end of the existing submissions section (after line 229, which is the closing `});` of the essay submission). Add 5 new submissions:

```typescript
    // Quiz submission - student2 (graded, score 5/10)
    await Submission.create({
      assignment_id: assignments[0].id,
      user_id: student2.id,
      attempt_number: 1,
      answers: [
        { question_id: 'd6ed85b9-4a1c-4b30-8f23-6994371b8748', selected_options: ['C'] },
        { question_id: 'e772a082-b7b2-487d-a8c3-26beaece2c86', selected_options: ['B'] },
      ],
      score: 5,
      status: 'graded',
      submitted_at: new Date(),
    });

    // Quiz submission - student3 (submitted, awaiting grading)
    await Submission.create({
      assignment_id: assignments[0].id,
      user_id: student3.id,
      attempt_number: 1,
      answers: [
        { question_id: 'd6ed85b9-4a1c-4b30-8f23-6994371b8748', selected_options: ['A'] },
        { question_id: 'e772a082-b7b2-487d-a8c3-26beaece2c86', selected_options: ['B'] },
      ],
      status: 'submitted',
      submitted_at: new Date(),
    });

    // Essay submission - student2 (graded, score 75/100)
    await Submission.create({
      assignment_id: essayAssignment.id,
      user_id: student2.id,
      attempt_number: 1,
      answers: { text: 'Middleware trong Express.js đóng vai trò trung gian xử lý request và response. Nó có thể thực hiện các tác vụ như xác thực, logging, xử lý lỗi, và chuyển tiếp request đến handler tiếp theo thông qua hàm next().' },
      score: 75,
      status: 'graded',
      feedback: 'Bài viết tốt, cần bổ sung thêm ví dụ code minh họa.',
      submitted_at: new Date(),
    });

    // Upload submission - student1 (submitted, awaiting grading)
    await Submission.create({
      assignment_id: uploadAssignment.id,
      user_id: student1.id,
      attempt_number: 1,
      answers: { file_url: '/uploads/project-student1.zip', file_name: 'project-student1.zip' },
      status: 'submitted',
      submitted_at: new Date(),
    });

    // Upload submission - student2 (graded, score 85/100)
    await Submission.create({
      assignment_id: uploadAssignment.id,
      user_id: student2.id,
      attempt_number: 1,
      answers: { file_url: '/uploads/project-student2.zip', file_name: 'project-student2.zip' },
      score: 85,
      status: 'graded',
      feedback: 'Project tốt, code sạch sẽ.',
      submitted_at: new Date(),
    });
```

- [ ] **Step 2: Update the submission count in log**

Find line 242:
```typescript
    console.log(`Submissions: 2`);
```

Replace with:
```typescript
    console.log(`Submissions: 7`);
```

- [ ] **Step 3: Re-seed the database**

```bash
cd backend && npm run seed:courses
```

Expected output should include:
```
Submissions: 7
```

- [ ] **Step 4: Verify seeded data**

Login as `binhtt` (instructor 1). Navigate to instructor assignments:
- "Bài trắc nghiệm ôn tập chương 1" → Bài nộp: should show 3 rows (annv graded 10, cuonglh graded 5, ducpm submitted)
- "Bài nộp project cuối khóa" → Bài nộp: should show 2 rows (annv submitted, cuonglh graded 85)

Login as `hongvt@921` (instructor 2). Navigate to instructor assignments:
- "Bài luận về Express Middleware" → Bài nộp: should show 2 rows (annv submitted, cuonglh graded 75)

- [ ] **Step 5: Commit**

```bash
git add backend/src/seeders/course-seeder.ts
git commit -m "feat: seed 5 additional submission records for demo"
```

---

## Task 6: Update SQL dump with new submissions

**Files:**
- Modify: `database/eduvi_lms.sql:341-343`

- [ ] **Step 1: Add new submission rows to SQL dump**

Open `database/eduvi_lms.sql`. Find the existing INSERT statement for submissions (lines 341-343). The current statement inserts 2 rows and ends with a semicolon on line 343.

Replace the entire INSERT block (lines 341-343) with:

```sql
INSERT INTO `submissions` (`id`, `assignment_id`, `user_id`, `attempt_number`, `answers`, `score`, `status`, `feedback`, `graded_by`, `graded_at`, `submitted_at`, `created_at`, `updated_at`) VALUES
('sub00001-0000-0000-0000-000000000001', 'b8c94ad3-5056-4882-871d-72aab6e77595', 'u-studen-000000000000000000000000001', 1, '[{\"question_id\":\"d6ed85b9-4a1c-4b30-8f23-6994371b8748\",\"selected_options\":[\"A\"]},{\"question_id\":\"e772a082-b7b2-487d-a8c3-26beaece2c86\",\"selected_options\":[\"B\"]}]', 10, 'graded', NULL, NULL, '2026-06-01 10:00:00', '2026-06-01 10:00:00', '2026-06-01 10:00:00', '2026-06-01 10:00:00'),
('sub00001-0000-0000-0000-000000000002', 'e1a2b3c4-d5e6-f7a8-b9c0-d1e2f3a4b5c6', 'u-studen-000000000000000000000000001', 1, '{\"text\":\"Middleware trong Express.js là các hàm có thể truy cập vào đối tượng request, response và hàm next. Middleware được sử dụng để xử lý các tác vụ như xác thực, logging, parse body request, xử lý lỗi và nhiều tác vụ khác.\"}', NULL, 'submitted', NULL, NULL, NULL, '2026-06-01 11:00:00', '2026-06-01 11:00:00', '2026-06-01 11:00:00'),
('sub00001-0000-0000-0000-000000000003', 'b8c94ad3-5056-4882-871d-72aab6e77595', 'u-studen-000000000000000000000000002', 1, '[{\"question_id\":\"d6ed85b9-4a1c-4b30-8f23-6994371b8748\",\"selected_options\":[\"C\"]},{\"question_id\":\"e772a082-b7b2-487d-a8c3-26beaece2c86\",\"selected_options\":[\"B\"]}]', 5, 'graded', NULL, NULL, '2026-06-01 12:00:00', '2026-06-01 12:00:00', '2026-06-01 12:00:00', '2026-06-01 12:00:00'),
('sub00001-0000-0000-0000-000000000004', 'b8c94ad3-5056-4882-871d-72aab6e77595', 'u-studen-000000000000000000000000003', 1, '[{\"question_id\":\"d6ed85b9-4a1c-4b30-8f23-6994371b8748\",\"selected_options\":[\"A\"]},{\"question_id\":\"e772a082-b7b2-487d-a8c3-26beaece2c86\",\"selected_options\":[\"B\"]}]', NULL, 'submitted', NULL, NULL, NULL, '2026-06-01 13:00:00', '2026-06-01 13:00:00', '2026-06-01 13:00:00'),
('sub00001-0000-0000-0000-000000000005', 'e1a2b3c4-d5e6-f7a8-b9c0-d1e2f3a4b5c6', 'u-studen-000000000000000000000000002', 1, '{\"text\":\"Middleware trong Express.js đóng vai trò trung gian xử lý request và response. Nó có thể thực hiện các tác vụ như xác thực, logging, xử lý lỗi, và chuyển tiếp request đến handler tiếp theo thông qua hàm next().\"}', 75, 'graded', 'Bài viết tốt, cần bổ sung thêm ví dụ code minh họa.', NULL, '2026-06-01 14:00:00', '2026-06-01 14:00:00', '2026-06-01 14:00:00', '2026-06-01 14:00:00'),
('sub00001-0000-0000-0000-000000000006', 'f2b3c4d5-e6f7-a8b9-c0d1-e2f3a4b5c6d7', 'u-studen-000000000000000000000000001', 1, '{\"file_url\":\"/uploads/project-student1.zip\",\"file_name\":\"project-student1.zip\"}', NULL, 'submitted', NULL, NULL, NULL, '2026-06-01 15:00:00', '2026-06-01 15:00:00', '2026-06-01 15:00:00'),
('sub00001-0000-0000-0000-000000000007', 'f2b3c4d5-e6f7-a8b9-c0d1-e2f3a4b5c6d7', 'u-studen-000000000000000000000000002', 1, '{\"file_url\":\"/uploads/project-student2.zip\",\"file_name\":\"project-student2.zip\"}', 85, 'graded', 'Project tốt, code sạch sẽ.', NULL, '2026-06-01 16:00:00', '2026-06-01 16:00:00', '2026-06-01 16:00:00', '2026-06-01 16:00:00');
```

- [ ] **Step 2: Verify SQL syntax**

Import the SQL file into a test database to verify syntax:

```bash
mysql -u root -p eduvi_lms_test < database/eduvi_lms.sql
```

Or verify by checking that:
- All 7 rows have valid UUID format in `id`, `assignment_id`, `user_id` columns
- JSON in `answers` column is valid
- Foreign keys reference existing records (`assignment_id` values match the assignments table, `user_id` values match the users table)

- [ ] **Step 3: Commit**

```bash
git add database/eduvi_lms.sql
git commit -m "feat: update SQL dump with 5 new submission records"
```

---

## Task 7: End-to-end verification

- [ ] **Step 1: Re-seed database from SQL dump**

```bash
cd database && mysql -u root -p eduvi_lms < eduvi_lms.sql
```

- [ ] **Step 2: Verify student navigation flow**

1. Login as student `annv` (password: `ant.design`)
2. Verify sidebar shows "📚 Danh sách khóa học"
3. Click it → course catalog loads with course cards
4. Go to "Góc học tập" → verify purple banner "Tìm khóa học" appears
5. Click "Tìm khóa học" → navigates to `/courses`
6. Go to "Khóa học của tôi" → verify enrolled courses show normally
7. Login as a new student with no enrollments → verify "Khám phá khóa học" button appears in empty state

- [ ] **Step 3: Verify teacher submission flow**

1. Login as instructor `binhtt` (password: `ant.design`)
2. Go to "Quản lý bài tập"
3. Click "Bài nộp" on "Bài trắc nghiệm ôn tập chương 1" → should show 3 submissions
4. Click "Bài nộp" on "Bài nộp project cuối khóa" → should show 2 submissions
5. Click "Chấm bài" on an ungraded submission → grading modal opens with essay/file content

- [ ] **Step 4: Verify error handling**

1. Login as instructor `hongvt@921` (password: `ant.design')
2. Go to "Quản lý bài tập"
3. Click "Bài nộp" on "Bài trắc nghiệm ôn tập chương 1" (not their course)
4. Expected: Error toast "Bạn không có quyền xem bài nộp của khóa học này" + empty table with "Chưa có học sinh nào nộp bài tập này"

- [ ] **Step 5: Final commit (if any fixes needed)**

```bash
git add -A && git commit -m "fix: address verification feedback"
```
