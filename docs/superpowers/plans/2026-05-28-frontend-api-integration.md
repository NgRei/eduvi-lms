# Frontend API Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect all 20 existing backend API endpoints to the frontend, build 7 new admin API endpoints, and convert all mock-data pages to use real APIs.

**Architecture:** Frontend service layer (6 new files) wraps `request()` from `@umijs/max` following the existing `dashboard.ts` pattern. Pages use `useState` + `useEffect` for data fetching. Backend gets a new admin controller following the existing controller/route pattern. All API responses use the envelope `{ success: boolean, data?: T, error?: string }`.

**Tech Stack:** React + TypeScript, Ant Design Pro (UmiJS Max v4), antd v6, ProComponents v3, Express.js + Sequelize (backend)

---

## File Structure

### Frontend — New Files (6 service files + 4 page files)

| File | Responsibility |
|---|---|
| `frontend/src/services/ant-design-pro/courses.ts` | Course + category API calls |
| `frontend/src/services/ant-design-pro/enrollments.ts` | Enrollment API calls |
| `frontend/src/services/ant-design-pro/lessons.ts` | Lesson API calls |
| `frontend/src/services/ant-design-pro/lessonProgress.ts` | Lesson progress API calls |
| `frontend/src/services/ant-design-pro/uploads.ts` | Upload + signed URL API calls |
| `frontend/src/services/ant-design-pro/admin.ts` | Admin API calls |
| `frontend/src/pages/courses/list/index.tsx` | Public course listing |
| `frontend/src/pages/courses/detail/index.tsx` | Course detail + enrollment |
| `frontend/src/pages/student/lesson-view/index.tsx` | Lesson viewer + video player |
| `frontend/src/pages/instructor/courses/edit/index.tsx` | Course editor for instructors |

### Frontend — Modified Files (3 page files + 1 config file)

| File | Change |
|---|---|
| `frontend/src/pages/student/my-courses/index.tsx` | Replace mock data with API call |
| `frontend/src/pages/instructor/courses/index.tsx` | Replace mock data with API call |
| `frontend/src/pages/instructor/courses/create/index.tsx` | Replace setTimeout with API calls |
| `frontend/config/routes.ts` | Add 4 new routes |

### Backend — New Files (1 controller + 1 route file)

| File | Responsibility |
|---|---|
| `backend/src/controllers/admin.controller.ts` | Admin user management + dashboard |
| `backend/src/routes/admin.routes.ts` | Admin route definitions |

### Backend — Modified Files (1 file)

| File | Change |
|---|---|
| `backend/src/app.ts` | Register admin routes |

---

## Task 1: Create Frontend API Services

**Files:**
- Create: `frontend/src/services/ant-design-pro/courses.ts`
- Create: `frontend/src/services/ant-design-pro/enrollments.ts`
- Create: `frontend/src/services/ant-design-pro/lessons.ts`
- Create: `frontend/src/services/ant-design-pro/lessonProgress.ts`
- Create: `frontend/src/services/ant-design-pro/uploads.ts`

These 5 files provide the API layer for all Priority 1 and Priority 2 pages. Each follows the `dashboard.ts` pattern: exported interfaces + exported async function wrapping `request()`.

### Step 1.1: Create `courses.ts`

```ts
// frontend/src/services/ant-design-pro/courses.ts
import { request } from '@umijs/max';

export interface CourseCategory {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  icon_url: string | null;
  sort_order: number;
  is_active: boolean;
  children?: CourseCategory[];
}

export interface CourseInstructor {
  id: string;
  full_name: string;
  username: string;
  CourseInstructor?: { is_primary: boolean };
}

export interface CourseItem {
  id: string;
  title: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  thumbnail: string | null;
  price: number;
  sale_price: number | null;
  target_level: string;
  language: string;
  is_published: boolean;
  total_lessons: number;
  total_students: number;
  rating_avg: number;
  category: { id: string; name: string; slug: string } | null;
  instructors: CourseInstructor[];
  created_at: string;
}

export interface CourseDetail extends CourseItem {
  max_students: number | null;
  duration_weeks: number | null;
  published_at: string | null;
  enrollment_status?: string | null;
  enrollment_id?: string | null;
  lessons?: LessonBrief[];
  materials?: CourseMaterialBrief[];
}

export interface LessonBrief {
  id: string;
  title: string;
  sort_order: number;
  lesson_type: string;
  duration_minutes: number | null;
  is_preview: boolean;
  is_published: boolean;
}

export interface CourseMaterialBrief {
  id: string;
  title: string;
  material_type: string;
  file_url: string;
  file_size_kb: number | null;
  is_downloadable: boolean;
}

export interface CoursesResponse {
  success: boolean;
  data: CourseItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface CourseDetailResponse {
  success: boolean;
  data: CourseDetail;
}

export interface CategoriesResponse {
  success: boolean;
  data: CourseCategory[];
}

export async function getCourses(params?: {
  page?: number;
  limit?: number;
  category_id?: string;
  target_level?: string;
  search?: string;
  sort?: string;
}) {
  return request<CoursesResponse>('/api/courses', {
    method: 'GET',
    params,
  });
}

export async function getCourseById(id: string) {
  return request<CourseDetailResponse>(`/api/courses/${id}`, {
    method: 'GET',
  });
}

export async function getCategories() {
  return request<CategoriesResponse>('/api/courses/categories', {
    method: 'GET',
  });
}

export async function createCourse(data: {
  title: string;
  category_id?: string;
  short_description?: string;
  description?: string;
  price?: number;
  target_level?: string;
  language?: string;
}) {
  return request<{ success: boolean; data: CourseItem }>('/api/courses', {
    method: 'POST',
    data,
  });
}

export async function updateCourse(id: string, data: Record<string, any>) {
  return request<{ success: boolean; data: CourseItem }>(`/api/courses/${id}`, {
    method: 'PUT',
    data,
  });
}

export async function deleteCourse(id: string) {
  return request<{ success: boolean; message: string }>(`/api/courses/${id}`, {
    method: 'DELETE',
  });
}

export async function getInstructorCourses(params?: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  return request<{
    success: boolean;
    data: CourseItem[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }>('/api/courses/instructor/me', {
    method: 'GET',
    params,
  });
}
```

### Step 1.2: Create `enrollments.ts`

```ts
// frontend/src/services/ant-design-pro/enrollments.ts
import { request } from '@umijs/max';

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  status: string;
  progress_percentage: number;
  enrolled_at: string;
  completed_at: string | null;
  course?: {
    id: string;
    title: string;
    slug: string;
    thumbnail: string | null;
    total_lessons: number;
    rating_avg: number;
    instructors?: { full_name: string; avatar_url?: string }[];
  };
}

export interface MyEnrollmentsResponse {
  success: boolean;
  data: Enrollment[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface EnrollResponse {
  success: boolean;
  message: string;
  data: Enrollment;
}

export interface CheckEnrollmentResponse {
  success: boolean;
  data: { enrolled: boolean; enrollment_id?: string; status?: string };
}

export async function enrollCourse(courseId: string) {
  return request<EnrollResponse>('/api/enrollments', {
    method: 'POST',
    data: { course_id: courseId },
  });
}

export async function unenrollCourse(enrollmentId: string) {
  return request<{ success: boolean; message: string }>(`/api/enrollments/${enrollmentId}`, {
    method: 'DELETE',
  });
}

export async function getMyEnrollments(params?: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  return request<MyEnrollmentsResponse>('/api/enrollments/me', {
    method: 'GET',
    params,
  });
}

export async function checkEnrollment(courseId: string) {
  return request<CheckEnrollmentResponse>(`/api/enrollments/check/${courseId}`, {
    method: 'GET',
  });
}
```

### Step 1.3: Create `lessons.ts`

```ts
// frontend/src/services/ant-design-pro/lessons.ts
import { request } from '@umijs/max';

export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  sort_order: number;
  lesson_type: string;
  content_url: string | null;
  content_text: string | null;
  duration_minutes: number | null;
  is_preview: boolean;
  is_published: boolean;
  video_id: string | null;
  course?: { id: string; title: string; slug: string };
  materials?: {
    id: string;
    title: string;
    material_type: string;
    file_url: string;
    file_size_kb: number | null;
    is_downloadable: boolean;
  }[];
}

export interface LessonDetailResponse {
  success: boolean;
  data: Lesson;
}

export interface LessonsListResponse {
  success: boolean;
  data: Lesson[];
}

export async function getLessonById(id: string) {
  return request<LessonDetailResponse>(`/api/lessons/${id}`, {
    method: 'GET',
  });
}

export async function getLessonsByCourse(courseId: string) {
  return request<LessonsListResponse>(`/api/courses/${courseId}/lessons`, {
    method: 'GET',
  });
}

export async function createLesson(courseId: string, data: {
  title: string;
  lesson_type?: string;
  content_text?: string;
  content_url?: string;
  duration_minutes?: number;
  is_preview?: boolean;
}) {
  return request<{ success: boolean; data: Lesson }>(`/api/courses/${courseId}/lessons`, {
    method: 'POST',
    data,
  });
}

export async function updateLesson(id: string, data: Record<string, any>) {
  return request<{ success: boolean; data: Lesson }>(`/api/lessons/${id}`, {
    method: 'PUT',
    data,
  });
}

export async function deleteLesson(id: string) {
  return request<{ success: boolean; message: string }>(`/api/lessons/${id}`, {
    method: 'DELETE',
  });
}

export async function reorderLessons(courseId: string, lessonIds: string[]) {
  return request<{ success: boolean; message: string }>(`/api/courses/${courseId}/lessons/reorder`, {
    method: 'PUT',
    data: { lessonIds },
  });
}
```

### Step 1.4: Create `lessonProgress.ts`

```ts
// frontend/src/services/ant-design-pro/lessonProgress.ts
import { request } from '@umijs/max';

export interface LessonProgressItem {
  id: string;
  user_id: string;
  lesson_id: string;
  course_id: string;
  is_completed: boolean;
  watch_duration: number;
  last_position: number;
  quiz_score: number | null;
  completed_at: string | null;
}

export interface LessonProgressMapResponse {
  success: boolean;
  data: Record<string, LessonProgressItem>;
}

export interface ProgressActionResponse {
  success: boolean;
  message: string;
  data: LessonProgressItem;
}

export async function markLessonComplete(lessonId: string, courseId: string) {
  return request<ProgressActionResponse>('/api/lesson-progress/complete', {
    method: 'POST',
    data: { lesson_id: lessonId, course_id: courseId },
  });
}

export async function unmarkLessonComplete(lessonId: string, courseId: string) {
  return request<ProgressActionResponse>('/api/lesson-progress/uncomplete', {
    method: 'PUT',
    data: { lesson_id: lessonId, course_id: courseId },
  });
}

export async function updateWatchPosition(data: {
  lesson_id: string;
  course_id: string;
  last_position: number;
  watch_duration: number;
}) {
  return request<ProgressActionResponse>('/api/lesson-progress/position', {
    method: 'PUT',
    data,
  });
}

export async function getLessonProgress(courseId: string) {
  return request<LessonProgressMapResponse>(`/api/lesson-progress/${courseId}`, {
    method: 'GET',
  });
}
```

### Step 1.5: Create `uploads.ts`

```ts
// frontend/src/services/ant-design-pro/uploads.ts
import { request } from '@umijs/max';

export interface VideoUploadResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    cloudinary_id: string;
    original_name: string;
    format: string;
    duration: number;
    size_bytes: number;
    thumbnail_url: string | null;
  };
}

export interface SignedUrlResponse {
  success: boolean;
  data: {
    signed_url: string;
    expires_in: number;
  };
}

export interface VideosByCourseResponse {
  success: boolean;
  data: {
    id: string;
    cloudinary_id: string;
    original_name: string;
    format: string;
    duration: number;
    size_bytes: number;
    lesson_id: string | null;
  }[];
}

export async function uploadVideo(file: File, courseId: string, lessonId?: string) {
  const formData = new FormData();
  formData.append('video', file);
  formData.append('course_id', courseId);
  if (lessonId) formData.append('lesson_id', lessonId);

  return request<VideoUploadResponse>('/api/uploads/video', {
    method: 'POST',
    data: formData,
    requestType: 'form',
  });
}

export async function uploadImage(file: File, folder?: string) {
  const formData = new FormData();
  formData.append('image', file);
  if (folder) formData.append('folder', folder);

  return request<{ success: boolean; data: { url: string; public_id: string; width: number; height: number } }>(
    '/api/uploads/image',
    { method: 'POST', data: formData, requestType: 'form' }
  );
}

export async function getSignedVideoUrl(videoId: string) {
  return request<SignedUrlResponse>(`/api/uploads/video/${videoId}/signed-url`, {
    method: 'GET',
  });
}

export async function getVideosByCourse(courseId: string) {
  return request<VideosByCourseResponse>(`/api/uploads/video/course/${courseId}`, {
    method: 'GET',
  });
}

export async function deleteVideo(videoId: string) {
  return request<{ success: boolean; message: string }>(`/api/uploads/video/${videoId}`, {
    method: 'DELETE',
  });
}
```

### Step 1.6: Verify services compile

Run: `cd frontend && npx tsc --noEmit --skipLibCheck 2>&1 | head -30`

Expected: No errors related to the new service files.

### Step 1.7: Commit

```bash
git add frontend/src/services/ant-design-pro/courses.ts \
        frontend/src/services/ant-design-pro/enrollments.ts \
        frontend/src/services/ant-design-pro/lessons.ts \
        frontend/src/services/ant-design-pro/lessonProgress.ts \
        frontend/src/services/ant-design-pro/uploads.ts
git commit -m "feat(frontend): add API service layer for courses, enrollments, lessons, progress, uploads"
```

---

## Task 2: Public Courses Listing Page

**Files:**
- Create: `frontend/src/pages/courses/list/index.tsx`
- Modify: `frontend/config/routes.ts`

### Step 2.1: Create the courses list page

```tsx
// frontend/src/pages/courses/list/index.tsx
import { PageContainer } from '@ant-design/pro-components';
import { Card, Col, Empty, Input, Pagination, Row, Select, Spin, Tag, Typography } from 'antd';
import React, { useCallback, useEffect, useState } from 'react';
import { history } from '@umijs/max';
import { BookOutlined, StarOutlined, TeamOutlined } from '@ant-design/icons';
import { getCourses, getCategories, CourseItem, CourseCategory } from '@/services/ant-design-pro/courses';

const { Search } = Input;
const { Text } = Typography;

const CoursesList: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [targetLevel, setTargetLevel] = useState<string | undefined>();
  const [sort, setSort] = useState('newest');

  const fetchCategories = async () => {
    try {
      const res = await getCategories();
      if (res.success) setCategories(res.data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getCourses({
        page,
        limit: 12,
        search: search || undefined,
        category_id: categoryId,
        target_level: targetLevel,
        sort,
      });
      if (res.success) {
        setCourses(res.data);
        setTotal(res.pagination.total);
      }
    } catch (err) {
      console.error('Failed to fetch courses:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, categoryId, targetLevel, sort]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return (
    <PageContainer title="Danh sách khóa học">
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={8}>
            <Search
              placeholder="Tìm kiếm khóa học..."
              allowClear
              onSearch={handleSearch}
              enterButton
            />
          </Col>
          <Col xs={12} md={5}>
            <Select
              placeholder="Danh mục"
              allowClear
              style={{ width: '100%' }}
              value={categoryId}
              onChange={(v) => { setCategoryId(v); setPage(1); }}
              options={[
                { label: 'Tất cả danh mục', value: undefined },
                ...categories.map((c) => ({ label: c.name, value: c.id })),
              ]}
            />
          </Col>
          <Col xs={12} md={4}>
            <Select
              placeholder="Cấp độ"
              allowClear
              style={{ width: '100%' }}
              value={targetLevel}
              onChange={(v) => { setTargetLevel(v); setPage(1); }}
              options={[
                { label: 'Tất cả', value: undefined },
                { label: 'Cơ bản', value: 'beginner' },
                { label: 'Trung bình', value: 'intermediate' },
                { label: 'Nâng cao', value: 'advanced' },
              ]}
            />
          </Col>
          <Col xs={24} md={4}>
            <Select
              style={{ width: '100%' }}
              value={sort}
              onChange={(v) => { setSort(v); setPage(1); }}
              options={[
                { label: 'Mới nhất', value: 'newest' },
                { label: 'Giá tăng dần', value: 'price_asc' },
                { label: 'Giá giảm dần', value: 'price_desc' },
                { label: 'Phổ biến nhất', value: 'popular' },
                { label: 'Đánh giá cao', value: 'rating' },
              ]}
            />
          </Col>
        </Row>
      </Card>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 80 }}>
          <Spin size="large" />
        </div>
      ) : courses.length === 0 ? (
        <Card>
          <Empty description="Không tìm thấy khóa học nào." />
        </Card>
      ) : (
        <>
          <Row gutter={[16, 16]}>
            {courses.map((course) => (
              <Col xs={24} sm={12} md={8} lg={6} key={course.id}>
                <Card
                  hoverable
                  cover={
                    <img
                      alt={course.title}
                      src={course.thumbnail || 'https://via.placeholder.com/300x160?text=Course'}
                      style={{ height: 160, objectFit: 'cover' }}
                    />
                  }
                  onClick={() => history.push(`/courses/${course.id}`)}
                >
                  <Card.Meta
                    title={
                      <div style={{ whiteSpace: 'normal', height: 44, overflow: 'hidden', fontSize: 14 }}>
                        {course.title}
                      </div>
                    }
                    description={
                      <div>
                        {course.category && (
                          <Tag color="purple" style={{ marginBottom: 8 }}>
                            {course.category.name}
                          </Tag>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            <TeamOutlined /> {course.total_students}
                          </Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            <BookOutlined /> {course.total_lessons} bài
                          </Text>
                          {course.rating_avg > 0 && (
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              <StarOutlined /> {course.rating_avg}
                            </Text>
                          )}
                        </div>
                        <div style={{ marginTop: 8 }}>
                          <Text strong style={{ color: '#EF4444', fontSize: 16 }}>
                            {course.price === 0 ? 'Miễn phí' : `${course.price.toLocaleString()} đ`}
                          </Text>
                        </div>
                      </div>
                    }
                  />
                </Card>
              </Col>
            ))}
          </Row>
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Pagination
              current={page}
              total={total}
              pageSize={12}
              onChange={(p) => setPage(p)}
              showSizeChanger={false}
            />
          </div>
        </>
      )}
    </PageContainer>
  );
};

export default CoursesList;
```

### Step 2.2: Add route to `frontend/config/routes.ts`

Add these routes before the `// ================= STUDENT PORTAL =================` section:

```ts
  // ================= PUBLIC COURSES =================
  {
    path: '/courses',
    routes: [
      {
        path: '/courses',
        name: 'Danh sách khóa học',
        component: './courses/list',
      },
      {
        path: '/courses/:id',
        name: 'Chi tiết khóa học',
        component: './courses/detail',
        hideInMenu: true,
      },
    ],
  },
```

### Step 2.3: Verify page renders

Run: `cd frontend && npm start` (or `npx umi dev`)
Navigate to `http://localhost:8000/courses`

Expected: Page loads, shows empty state or courses from API.

### Step 2.4: Commit

```bash
git add frontend/src/pages/courses/list/index.tsx frontend/config/routes.ts
git commit -m "feat(frontend): add public courses listing page with filters and search"
```

---

## Task 3: Course Detail Page with Enrollment

**Files:**
- Create: `frontend/src/pages/courses/detail/index.tsx`

### Step 3.1: Create the course detail page

```tsx
// frontend/src/pages/courses/detail/index.tsx
import { PageContainer } from '@ant-design/pro-components';
import {
  Avatar, Button, Card, Col, Divider, Empty, List, message,
  Row, Spin, Statistic, Tag, Typography
} from 'antd';
import React, { useEffect, useState } from 'react';
import { history, useParams, useModel } from '@umijs/max';
import {
  BookOutlined, CheckCircleOutlined, ClockCircleOutlined,
  PlayCircleOutlined, StarOutlined, TeamOutlined, UserOutlined
} from '@ant-design/icons';
import { getCourseById, CourseDetail } from '@/services/ant-design-pro/courses';
import { enrollCourse } from '@/services/ant-design-pro/enrollments';

const { Title, Text, Paragraph } = Typography;

const CourseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { initialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser;
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [course, setCourse] = useState<CourseDetail | null>(null);

  useEffect(() => {
    if (id) fetchCourse(id);
  }, [id]);

  const fetchCourse = async (courseId: string) => {
    try {
      setLoading(true);
      const res = await getCourseById(courseId);
      if (res.success) setCourse(res.data);
    } catch (err) {
      console.error('Failed to fetch course:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!currentUser) {
      history.push('/user/login');
      return;
    }
    if (!id) return;
    try {
      setEnrolling(true);
      const res = await enrollCourse(id);
      if (res.success) {
        message.success('Đăng ký khóa học thành công!');
        fetchCourse(id);
      }
    } catch (err: any) {
      message.error(err?.data?.error || 'Không thể đăng ký khóa học');
    } finally {
      setEnrolling(false);
    }
  };

  const handleStartLearning = () => {
    if (!course) return;
    const firstLesson = course.lessons?.find((l) => l.is_published);
    if (firstLesson) {
      history.push(`/student/courses/${course.id}/lessons/${firstLesson.id}`);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div style={{ textAlign: 'center', padding: 100 }}>
          <Spin size="large" />
        </div>
      </PageContainer>
    );
  }

  if (!course) {
    return (
      <PageContainer>
        <Empty description="Không tìm thấy khóa học." />
      </PageContainer>
    );
  }

  const isEnrolled = course.enrollment_status === 'active';
  const isCompleted = course.enrollment_status === 'completed';

  return (
    <PageContainer title={course.title}>
      <Row gutter={[24, 24]}>
        <Col xs={24} md={16}>
          <Card>
            <div style={{ marginBottom: 16 }}>
              {course.category && <Tag color="purple">{course.category.name}</Tag>}
              <Tag color="blue">{course.target_level}</Tag>
            </div>
            <Title level={3}>{course.title}</Title>
            {course.short_description && (
              <Paragraph type="secondary">{course.short_description}</Paragraph>
            )}

            <Row gutter={16} style={{ margin: '16px 0' }}>
              <Col><Statistic title="Bài giảng" value={course.total_lessons} prefix={<BookOutlined />} /></Col>
              <Col><Statistic title="Học viên" value={course.total_students} prefix={<TeamOutlined />} /></Col>
              {course.rating_avg > 0 && (
                <Col><Statistic title="Đánh giá" value={course.rating_avg} prefix={<StarOutlined />} precision={1} /></Col>
              )}
              {course.duration_weeks && (
                <Col><Statistic title="Thời lượng" value={course.duration_weeks} suffix="tuần" prefix={<ClockCircleOutlined />} /></Col>
              )}
            </Row>

            {course.description && (
              <>
                <Divider />
                <Title level={5}>Mô tả khóa học</Title>
                <div dangerouslySetInnerHTML={{ __html: course.description }} />
              </>
            )}

            {course.lessons && course.lessons.length > 0 && (
              <>
                <Divider />
                <Title level={5}>Nội dung bài giảng</Title>
                <List
                  dataSource={course.lessons.filter((l) => l.is_published)}
                  renderItem={(lesson) => (
                    <List.Item
                      style={{ cursor: isEnrolled ? 'pointer' : 'default' }}
                      onClick={() => {
                        if (isEnrolled) {
                          history.push(`/student/courses/${course.id}/lessons/${lesson.id}`);
                        }
                      }}
                    >
                      <List.Item.Meta
                        avatar={
                          lesson.lesson_type === 'video' ? (
                            <PlayCircleOutlined style={{ fontSize: 20, color: '#4F46E5' }} />
                          ) : (
                            <BookOutlined style={{ fontSize: 20, color: '#10B981' }} />
                          )
                        }
                        title={
                          <span>
                            {lesson.title}
                            {lesson.is_preview && <Tag color="green" style={{ marginLeft: 8 }}>Xem trước</Tag>}
                          </span>
                        }
                        description={
                          lesson.duration_minutes ? `${lesson.duration_minutes} phút` : lesson.lesson_type
                        }
                      />
                    </List.Item>
                  )}
                />
              </>
            )}
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <img
                src={course.thumbnail || 'https://via.placeholder.com/300x200?text=Course'}
                alt={course.title}
                style={{ width: '100%', borderRadius: 8, maxHeight: 200, objectFit: 'cover' }}
              />
            </div>

            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <Title level={3} style={{ color: '#EF4444', margin: 0 }}>
                {course.price === 0 ? 'Miễn phí' : `${course.price.toLocaleString()} đ`}
              </Title>
              {course.sale_price && course.sale_price < course.price && (
                <Text delete type="secondary">{course.price.toLocaleString()} đ</Text>
              )}
            </div>

            {isEnrolled ? (
              <Button type="primary" block size="large" icon={<PlayCircleOutlined />} onClick={handleStartLearning}>
                Tiếp tục học
              </Button>
            ) : isCompleted ? (
              <Button block size="large" icon={<CheckCircleOutlined />} onClick={handleStartLearning}>
                Xem lại bài học
              </Button>
            ) : (
              <Button
                type="primary"
                block
                size="large"
                loading={enrolling}
                onClick={handleEnroll}
              >
                Đăng ký học
              </Button>
            )}

            <Divider />

            <div style={{ marginBottom: 12 }}>
              <Text strong>Giảng viên</Text>
            </div>
            {course.instructors.map((inst) => (
              <div key={inst.id} style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                <Avatar icon={<UserOutlined />} style={{ marginRight: 8 }} />
                <Text>{inst.full_name}</Text>
              </div>
            ))}

            {course.materials && course.materials.length > 0 && (
              <>
                <Divider />
                <Text strong>Tài liệu đính kèm</Text>
                <List
                  size="small"
                  dataSource={course.materials}
                  renderItem={(mat) => (
                    <List.Item>
                      <a href={mat.file_url} target="_blank" rel="noopener noreferrer">
                        {mat.title} ({mat.material_type.toUpperCase()})
                      </a>
                    </List.Item>
                  )}
                />
              </>
            )}
          </Card>
        </Col>
      </Row>
    </PageContainer>
  );
};

export default CourseDetailPage;
```

### Step 3.2: Verify page renders

Navigate to `http://localhost:8000/courses/{some-course-id}`

Expected: Course detail loads, shows lessons, enroll button works.

### Step 3.3: Commit

```bash
git add frontend/src/pages/courses/detail/index.tsx
git commit -m "feat(frontend): add course detail page with enrollment flow"
```

---

## Task 4: Convert My Courses Page (Mock → API)

**Files:**
- Modify: `frontend/src/pages/student/my-courses/index.tsx`

### Step 4.1: Rewrite my-courses to use API

Replace the entire file content:

```tsx
// frontend/src/pages/student/my-courses/index.tsx
import { PageContainer } from '@ant-design/pro-components';
import { Button, Card, Col, Empty, Progress, Row, Spin, Tabs, Tag, message } from 'antd';
import React, { useEffect, useState } from 'react';
import { history } from '@umijs/max';
import { getMyEnrollments, Enrollment } from '@/services/ant-design-pro/enrollments';

const MyCourses: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeEnrollments, setActiveEnrollments] = useState<Enrollment[]>([]);
  const [completedEnrollments, setCompletedEnrollments] = useState<Enrollment[]>([]);

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      const [activeRes, completedRes] = await Promise.all([
        getMyEnrollments({ status: 'active', limit: 50 }),
        getMyEnrollments({ status: 'completed', limit: 50 }),
      ]);
      if (activeRes.success) setActiveEnrollments(activeRes.data);
      if (completedRes.success) setCompletedEnrollments(completedRes.data);
    } catch (err) {
      console.error('Failed to fetch enrollments:', err);
      message.error('Không thể tải danh sách khóa học');
    } finally {
      setLoading(false);
    }
  };

  const renderCourseGrid = (enrollments: Enrollment[], isCompleted: boolean) => {
    if (enrollments.length === 0) {
      return <Empty description={isCompleted ? 'Bạn chưa hoàn thành khóa học nào.' : 'Bạn chưa đăng ký khóa học nào.'} />;
    }

    return (
      <Row gutter={[16, 16]}>
        {enrollments.map((enrollment) => {
          const course = enrollment.course;
          if (!course) return null;
          const instructorName = course.instructors?.[0]?.full_name || 'Chưa rõ';
          return (
            <Col xs={24} sm={12} md={8} key={enrollment.id}>
              <Card
                hoverable
                cover={
                  <img
                    alt={course.title}
                    src={course.thumbnail || 'https://via.placeholder.com/300x160?text=Course'}
                    style={{ height: 160, objectFit: 'cover' }}
                  />
                }
                actions={[
                  <Button
                    key="study-btn"
                    type="primary"
                    style={{ width: '85%' }}
                    onClick={() => history.push(`/courses/${course.id}`)}
                  >
                    {isCompleted ? 'Xem lại bài học' : 'Tiếp tục học bài'}
                  </Button>,
                ]}
              >
                <Card.Meta
                  title={<div style={{ whiteSpace: 'normal', height: 48, overflow: 'hidden' }}>{course.title}</div>}
                  description={
                    <div>
                      <div style={{ marginBottom: 8 }}>
                        <span style={{ fontSize: 12, color: '#6B7280' }}>GV: {instructorName}</span>
                      </div>
                      <div style={{ marginTop: 12 }}>
                        <span style={{ fontSize: 13 }}>Tiến độ: </span>
                        <Progress
                          percent={Math.round(enrollment.progress_percentage)}
                          size="small"
                          status={isCompleted ? 'success' : 'active'}
                        />
                      </div>
                      {isCompleted && enrollment.completed_at && (
                        <div style={{ marginTop: 8, fontSize: 12, color: '#10B981', fontWeight: 'bold' }}>
                          Hoàn thành ngày: {new Date(enrollment.completed_at).toLocaleDateString('vi-VN')}
                        </div>
                      )}
                    </div>
                  }
                />
              </Card>
            </Col>
          );
        })}
      </Row>
    );
  };

  if (loading) {
    return (
      <PageContainer title="Khóa học của tôi">
        <div style={{ textAlign: 'center', padding: 100 }}>
          <Spin size="large" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Khóa học của tôi">
      <Card>
        <Tabs
          defaultActiveKey="active"
          items={[
            {
              key: 'active',
              label: `Đang học (${activeEnrollments.length})`,
              children: renderCourseGrid(activeEnrollments, false),
            },
            {
              key: 'completed',
              label: `Đã hoàn thành (${completedEnrollments.length})`,
              children: renderCourseGrid(completedEnrollments, true),
            },
          ]}
        />
      </Card>
    </PageContainer>
  );
};

export default MyCourses;
```

### Step 4.2: Verify page works with API

Login as student, navigate to `/student/my-courses`.

Expected: Shows enrollments from API (or empty state if no enrollments).

### Step 4.3: Commit

```bash
git add frontend/src/pages/student/my-courses/index.tsx
git commit -m "feat(frontend): convert my-courses page from mock to real API"
```

---

## Task 5: Lesson View Page with Video Player

**Files:**
- Create: `frontend/src/pages/student/lesson-view/index.tsx`

### Step 5.1: Create the lesson view page

```tsx
// frontend/src/pages/student/lesson-view/index.tsx
import { PageContainer } from '@ant-design/pro-components';
import {
  Button, Card, Checkbox, Col, List, message, Row, Spin, Typography
} from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { history, useParams } from '@umijs/max';
import {
  BookOutlined, CheckCircleOutlined, PlayCircleOutlined
} from '@ant-design/icons';
import { getLessonById, getLessonsByCourse, Lesson } from '@/services/ant-design-pro/lessons';
import { getSignedVideoUrl } from '@/services/ant-design-pro/uploads';
import {
  getLessonProgress, markLessonComplete, unmarkLessonComplete,
  updateWatchPosition, LessonProgressItem
} from '@/services/ant-design-pro/lessonProgress';
import { checkEnrollment } from '@/services/ant-design-pro/enrollments';

const { Title, Text } = Typography;

const LessonViewPage: React.FC = () => {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const [loading, setLoading] = useState(true);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, LessonProgressItem>>({});
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchLesson = useCallback(async (lid: string) => {
    try {
      const res = await getLessonById(lid);
      if (res.success) {
        setLesson(res.data);
        if (res.data.lesson_type === 'video' && res.data.video_id) {
          const urlRes = await getSignedVideoUrl(res.data.video_id);
          if (urlRes.success) setSignedUrl(urlRes.data.signed_url);
        }
      }
    } catch (err) {
      console.error('Failed to fetch lesson:', err);
      message.error('Không thể tải bài giảng');
    }
  }, []);

  const fetchProgress = useCallback(async (cid: string) => {
    try {
      const res = await getLessonProgress(cid);
      if (res.success) {
        setProgressMap(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch progress:', err);
    }
  }, []);

  const fetchLessons = useCallback(async (cid: string) => {
    try {
      const res = await getLessonsByCourse(cid);
      if (res.success) setLessons(res.data);
    } catch (err) {
      console.error('Failed to fetch lessons:', err);
    }
  }, []);

  useEffect(() => {
    if (!courseId || !lessonId) return;

    const init = async () => {
      setLoading(true);
      try {
        const enrollCheck = await checkEnrollment(courseId);
        const isEnrolled = enrollCheck.success && enrollCheck.data?.enrolled;
        if (!isEnrolled) {
          message.warning('Bạn chưa đăng ký khóa học này');
          history.push(`/courses/${courseId}`);
          return;
        }
        await Promise.all([
          fetchLesson(lessonId),
          fetchLessons(courseId),
          fetchProgress(courseId),
        ]);
      } catch (err) {
        console.error('Init error:', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [courseId, lessonId, fetchLesson, fetchLessons, fetchProgress]);

  useEffect(() => {
    if (lessonId && progressMap[lessonId]) {
      setIsCompleted(progressMap[lessonId].is_completed);
    } else {
      setIsCompleted(false);
    }
    setSignedUrl(null);
  }, [lessonId, progressMap]);

  const debouncedSavePosition = useCallback((position: number, duration: number) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      if (lessonId && courseId) {
        updateWatchPosition({
          lesson_id: lessonId,
          course_id: courseId,
          last_position: Math.floor(position),
          watch_duration: Math.floor(duration),
        }).catch((err) => console.error('Failed to save position:', err));
      }
    }, 5000);
  }, [lessonId, courseId]);

  const handleVideoTimeUpdate = () => {
    const video = videoRef.current;
    if (video) {
      debouncedSavePosition(video.currentTime, video.currentTime);
    }
  };

  const handleToggleComplete = async () => {
    if (!lessonId || !courseId) return;
    try {
      if (isCompleted) {
        await unmarkLessonComplete(lessonId, courseId);
        setIsCompleted(false);
        message.success('Đã bỏ đánh dấu hoàn thành');
      } else {
        await markLessonComplete(lessonId, courseId);
        setIsCompleted(true);
        message.success('Đã đánh dấu hoàn thành bài giảng');
      }
      fetchProgress(courseId);
    } catch (err: any) {
      message.error(err?.data?.error || 'Không thể cập nhật tiến độ');
    }
  };

  const handleLessonClick = (lid: string) => {
    history.push(`/student/courses/${courseId}/lessons/${lid}`);
  };

  const completedCount = Object.values(progressMap).filter((p) => p.is_completed).length;

  if (loading) {
    return (
      <PageContainer>
        <div style={{ textAlign: 'center', padding: 100 }}>
          <Spin size="large" />
        </div>
      </PageContainer>
    );
  }

  if (!lesson) {
    return (
      <PageContainer>
        <div style={{ textAlign: 'center', padding: 100 }}>
          <Text>Không tìm thấy bài giảng.</Text>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title={lesson.title}>
      <Row gutter={[24, 24]}>
        <Col xs={24} md={16}>
          <Card>
            {lesson.lesson_type === 'video' && signedUrl && (
              <video
                ref={videoRef}
                src={signedUrl}
                controls
                style={{ width: '100%', borderRadius: 8, backgroundColor: '#000' }}
                onTimeUpdate={handleVideoTimeUpdate}
                onEnded={handleToggleComplete}
              />
            )}

            {lesson.lesson_type === 'text' && lesson.content_text && (
              <div
                style={{ padding: '16px 0', lineHeight: 1.8 }}
                dangerouslySetInnerHTML={{ __html: lesson.content_text }}
              />
            )}

            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Title level={5} style={{ margin: 0 }}>{lesson.title}</Title>
              <Button
                type={isCompleted ? 'default' : 'primary'}
                icon={isCompleted ? <CheckCircleOutlined /> : undefined}
                onClick={handleToggleComplete}
              >
                {isCompleted ? 'Đã hoàn thành' : 'Đánh dấu hoàn thành'}
              </Button>
            </div>

            {lesson.materials && lesson.materials.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <Text strong>Tài liệu bài giảng:</Text>
                <List
                  size="small"
                  dataSource={lesson.materials}
                  renderItem={(mat) => (
                    <List.Item>
                      <a href={mat.file_url} target="_blank" rel="noopener noreferrer">
                        {mat.title} ({mat.material_type.toUpperCase()})
                      </a>
                    </List.Item>
                  )}
                />
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card
            title={`Danh sách bài giảng (${completedCount}/${lessons.length})`}
            size="small"
          >
            <List
              dataSource={lessons}
              renderItem={(item) => {
                const itemProgress = progressMap[item.id];
                const itemCompleted = itemProgress?.is_completed || false;
                const isCurrent = item.id === lessonId;
                return (
                  <List.Item
                    style={{
                      cursor: 'pointer',
                      backgroundColor: isCurrent ? '#EEF2FF' : undefined,
                      padding: '8px 12px',
                      borderRadius: 6,
                    }}
                    onClick={() => handleLessonClick(item.id)}
                  >
                    <List.Item.Meta
                      avatar={
                        itemCompleted ? (
                          <CheckCircleOutlined style={{ color: '#10B981', fontSize: 18 }} />
                        ) : item.lesson_type === 'video' ? (
                          <PlayCircleOutlined style={{ color: '#6B7280', fontSize: 18 }} />
                        ) : (
                          <BookOutlined style={{ color: '#6B7280', fontSize: 18 }} />
                        )
                      }
                      title={
                        <Text style={{ fontWeight: isCurrent ? 'bold' : 'normal' }}>
                          {item.title}
                        </Text>
                      }
                      description={item.duration_minutes ? `${item.duration_minutes} phút` : item.lesson_type}
                    />
                  </List.Item>
                );
              }}
            />
          </Card>
        </Col>
      </Row>
    </PageContainer>
  );
};

export default LessonViewPage;
```

### Step 5.2: Add route to `frontend/config/routes.ts`

Inside the Student Portal routes array, add:

```ts
      {
        path: '/student/courses/:courseId/lessons/:lessonId',
        name: 'Xem bài giảng',
        component: './student/lesson-view',
        hideInMenu: true,
      },
```

### Step 5.3: Verify page works

Login as student enrolled in a course, navigate to `/student/courses/{courseId}/lessons/{lessonId}`.

Expected: Lesson loads, video plays (if video type), sidebar shows lesson list, complete button works.

### Step 5.4: Commit

```bash
git add frontend/src/pages/student/lesson-view/index.tsx frontend/config/routes.ts
git commit -m "feat(frontend): add lesson view page with video player and progress tracking"
```

---

## Task 6: Convert Instructor Course Management (Mock → API)

**Files:**
- Modify: `frontend/src/pages/instructor/courses/index.tsx`

### Step 6.1: Rewrite instructor courses to use API

Replace the entire file content. The key changes:
- Remove `useState` mock data
- Add `request` prop to ProTable for server-side data fetching
- Wire toggle publish and delete to real API calls

```tsx
// frontend/src/pages/instructor/courses/index.tsx
import { PlusOutlined } from '@ant-design/icons';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { history } from '@umijs/max';
import { Button, Popconfirm, Space, Tag, message } from 'antd';
import React, { useRef } from 'react';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { getInstructorCourses, updateCourse, deleteCourse } from '@/services/ant-design-pro/courses';

interface CourseItem {
  id: string;
  title: string;
  slug: string;
  category: { id: string; name: string } | null;
  total_students: number;
  total_lessons: number;
  price: number;
  is_published: boolean;
  rating_avg: number;
}

const CourseManagement: React.FC = () => {
  const actionRef = useRef<ActionType>();

  const handleDelete = async (id: string) => {
    try {
      await deleteCourse(id);
      message.success('Đã xóa khóa học thành công!');
      actionRef.current?.reload();
    } catch (err: any) {
      message.error(err?.data?.error || 'Không thể xóa khóa học');
    }
  };

  const togglePublish = async (record: CourseItem) => {
    try {
      await updateCourse(record.id, { is_published: !record.is_published });
      message.success(
        !record.is_published
          ? 'Đã xuất bản khóa học công khai!'
          : 'Đã chuyển khóa học về dạng bản nháp!'
      );
      actionRef.current?.reload();
    } catch (err: any) {
      message.error(err?.data?.error || 'Không thể cập nhật trạng thái');
    }
  };

  const columns: ProColumns<CourseItem>[] = [
    {
      title: 'Tên khóa học',
      dataIndex: 'title',
      copyable: true,
      ellipsis: true,
      render: (_, record) => <strong>{record.title}</strong>,
    },
    {
      title: 'Danh mục',
      dataIndex: ['category', 'name'],
      valueType: 'select',
      hideInTable: true,
      fieldProps: {
        showSearch: true,
      },
    },
    {
      title: 'Danh mục',
      dataIndex: ['category', 'name'],
      hideInSearch: true,
      render: (_, record) => record.category?.name || '-',
    },
    {
      title: 'Số bài học',
      dataIndex: 'total_lessons',
      hideInSearch: true,
      render: (_, record) => `${record.total_lessons} bài giảng`,
    },
    {
      title: 'Số học viên',
      dataIndex: 'total_students',
      hideInSearch: true,
      sorter: true,
      render: (_, record) => <Tag color="blue">{record.total_students} học viên</Tag>,
    },
    {
      title: 'Học phí',
      dataIndex: 'price',
      hideInSearch: true,
      render: (_, record) => (
        <strong>{record.price === 0 ? 'Miễn phí' : `${record.price.toLocaleString()} đ`}</strong>
      ),
    },
    {
      title: 'Đánh giá',
      dataIndex: 'rating_avg',
      hideInSearch: true,
      render: (_, record) =>
        record.rating_avg === 0 ? <span style={{ color: '#9CA3AF' }}>Chưa có</span> : `⭐ ${record.rating_avg}`,
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
          <a onClick={() => history.push(`/instructor/courses/${record.id}/edit`)}>Chỉnh sửa</a>
          <a onClick={() => togglePublish(record)}>
            {record.is_published ? 'Gỡ xuất bản' : 'Xuất bản'}
          </a>
          <Popconfirm
            title="Bạn có chắc muốn xóa khóa học này?"
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
    <PageContainer title="Quản lý khóa học">
      <ProTable<CourseItem>
        headerTitle="Danh sách khóa học"
        actionRef={actionRef}
        rowKey="id"
        search={{ labelWidth: 120 }}
        toolBarRender={() => [
          <Button
            key="create"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => history.push('/instructor/courses/create')}
          >
            Tạo khóa học mới
          </Button>,
        ]}
        request={async (params, sort) => {
          try {
            const sortField = sort && Object.keys(sort)[0];
            const sortOrder = sortField ? (sort[sortField] === 'ascend' ? 'asc' : 'desc') : undefined;
            const res = await getInstructorCourses({
              page: params.current || 1,
              limit: params.pageSize || 10,
              status: params.is_published === 'true' ? 'published' : params.is_published === 'false' ? 'draft' : undefined,
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

export default CourseManagement;
```

### Step 6.2: Verify page works

Login as instructor, navigate to `/instructor/courses`.

Expected: ProTable loads courses from API, toggle publish and delete work.

### Step 6.3: Commit

```bash
git add frontend/src/pages/instructor/courses/index.tsx
git commit -m "feat(frontend): convert instructor course management from mock to real API"
```

---

## Task 7: Convert Instructor Create Course (Mock → API)

**Files:**
- Modify: `frontend/src/pages/instructor/courses/create/index.tsx`

### Step 7.1: Rewrite create course to use API

Replace the `handleFinish` function and the simulated API call. The StepsForm stays the same structure, but each step's submit calls real APIs.

The key changes in the file:
1. Import `createCourse`, `getCategories` from `@/services/ant-design-pro/courses`
2. Import `createLesson` from `@/services/ant-design-pro/lessons`
3. Import `uploadVideo` from `@/services/ant-design-pro/uploads`
4. Replace the `setTimeout` in `handleFinish` with sequential API calls
5. Load categories from API instead of hardcoding

Replace the entire file content:

```tsx
// frontend/src/pages/instructor/courses/create/index.tsx
import { PageContainer, ProForm, ProFormDigit, ProFormSelect, ProFormText, ProFormTextArea, StepsForm } from '@ant-design/pro-components';
import { Card, Col, Input, InputNumber, message, Row, Select, Button, Space } from 'antd';
import { history } from '@umijs/max';
import React, { useEffect, useState } from 'react';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { createCourse, getCategories, CourseCategory } from '@/services/ant-design-pro/courses';
import { createLesson } from '@/services/ant-design-pro/lessons';

const CreateCourse: React.FC = () => {
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [createdCourseId, setCreatedCourseId] = useState<string | null>(null);

  useEffect(() => {
    getCategories().then((res) => {
      if (res.success) setCategories(res.data);
    }).catch(console.error);
  }, []);

  const handleStep1 = async (values: any) => {
    try {
      const res = await createCourse({
        title: values.title,
        category_id: values.category_id,
        short_description: values.short_description,
        description: values.description,
        price: values.price || 0,
        target_level: values.target_level || 'all',
      });
      if (res.success) {
        setCreatedCourseId(res.data.id);
        message.success('Tạo khóa học thành công!');
        return true;
      }
      return false;
    } catch (err: any) {
      message.error(err?.data?.error || 'Không thể tạo khóa học');
      return false;
    }
  };

  const handleStep2 = async (values: any) => {
    if (!createdCourseId) {
      message.error('Không tìm thấy khóa học');
      return false;
    }
    try {
      const lessons = values.lessons || [];
      for (let i = 0; i < lessons.length; i++) {
        const lesson = lessons[i];
        await createLesson(createdCourseId, {
          title: lesson.title,
          lesson_type: lesson.lesson_type || 'video',
          duration_minutes: lesson.duration_minutes,
        });
      }
      message.success(`Đã thêm ${lessons.length} bài giảng!`);
      return true;
    } catch (err: any) {
      message.error(err?.data?.error || 'Không thể thêm bài giảng');
      return false;
    }
  };

  return (
    <PageContainer title="Tạo khóa học mới">
      <Card>
        <StepsForm
          onFinish={async () => {
            message.success('Tạo khóa học thành công!');
            history.push('/instructor/courses');
            return true;
          }}
        >
          <StepsForm.StepForm name="step1" title="Thông tin cơ bản" onFinish={handleStep1}>
            <ProFormText
              name="title"
              label="Tên khóa học"
              placeholder="Nhập tên khóa học"
              rules={[{ required: true, message: 'Vui lòng nhập tên khóa học' }]}
            />
            <ProFormSelect
              name="category_id"
              label="Danh mục"
              placeholder="Chọn danh mục"
              options={categories.map((c) => ({ label: c.name, value: c.id }))}
            />
            <ProFormTextArea
              name="short_description"
              label="Mô tả ngắn"
              placeholder="Mô tả ngắn về khóa học"
            />
            <ProFormTextArea
              name="description"
              label="Mô tả chi tiết"
              placeholder="Mô tả chi tiết (hỗ trợ HTML)"
            />
            <Row gutter={16}>
              <Col span={8}>
                <ProFormDigit name="price" label="Giá (VNĐ)" min={0} initialValue={0} />
              </Col>
              <Col span={8}>
                <ProFormSelect
                  name="target_level"
                  label="Cấp độ"
                  initialValue="all"
                  options={[
                    { label: 'Tất cả', value: 'all' },
                    { label: 'Cơ bản', value: 'beginner' },
                    { label: 'Trung bình', value: 'intermediate' },
                    { label: 'Nâng cao', value: 'advanced' },
                  ]}
                />
              </Col>
            </Row>
          </StepsForm.StepForm>

          <StepsForm.StepForm name="step2" title="Bài giảng" onFinish={handleStep2}>
            <ProForm.Item name="lessons" label="Danh sách bài giảng">
              <Form.List name="lessons">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }) => (
                      <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                        <ProFormText
                          {...restField}
                          name={[name, 'title']}
                          placeholder="Tên bài giảng"
                          rules={[{ required: true }]}
                        />
                        <ProFormSelect
                          {...restField}
                          name={[name, 'lesson_type']}
                          initialValue="video"
                          options={[
                            { label: 'Video', value: 'video' },
                            { label: 'Text', value: 'text' },
                          ]}
                        />
                        <ProFormDigit
                          {...restField}
                          name={[name, 'duration_minutes']}
                          placeholder="Phút"
                          min={1}
                        />
                        <MinusCircleOutlined onClick={() => remove(name)} />
                      </Space>
                    ))}
                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                      Thêm bài giảng
                    </Button>
                  </>
                )}
              </Form.List>
            </ProForm.Item>
          </StepsForm.StepForm>

          <StepsForm.StepForm name="step3" title="Hoàn tất">
            <div style={{ textAlign: 'center', padding: 40 }}>
              <h3>Khóa học đã sẵn sàng!</h3>
              <p>Nhấn "Hoàn tất" để lưu và chuyển về trang quản lý.</p>
            </div>
          </StepsForm.StepForm>
        </StepsForm>
      </Card>
    </PageContainer>
  );
};

export default CreateCourse;
```

### Step 7.2: Verify create course flow

Login as instructor, go to `/instructor/courses/create`, fill in form, submit.

Expected: Course is created via API, lessons are added, redirects to course list.

### Step 7.3: Commit

```bash
git add frontend/src/pages/instructor/courses/create/index.tsx
git commit -m "feat(frontend): convert create course page from mock to real API"
```

---

## Task 8: Instructor Course Edit Page

**Files:**
- Create: `frontend/src/pages/instructor/courses/edit/index.tsx`
- Modify: `frontend/config/routes.ts`

### Step 8.1: Create the course edit page

```tsx
// frontend/src/pages/instructor/courses/edit/index.tsx
import { PageContainer } from '@ant-design/pro-components';
import {
  Button, Card, Form, Input, InputNumber, message, Popconfirm,
  Select, Space, Spin, Table, Tabs, Tag
} from 'antd';
import { history, useParams } from '@umijs/max';
import React, { useCallback, useEffect, useState } from 'react';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { getCourseById, updateCourse, getCategories, CourseCategory, CourseDetail } from '@/services/ant-design-pro/courses';
import { createLesson, updateLesson, deleteLesson, getLessonsByCourse, Lesson } from '@/services/ant-design-pro/lessons';

const { TextArea } = Input;

const EditCourse: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [courseForm] = Form.useForm();
  const [lessonForm] = Form.useForm();
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

  const fetchCourse = useCallback(async (courseId: string) => {
    try {
      const [courseRes, lessonsRes, catRes] = await Promise.all([
        getCourseById(courseId),
        getLessonsByCourse(courseId),
        getCategories(),
      ]);
      if (courseRes.success) {
        setCourse(courseRes.data);
        courseForm.setFieldsValue({
          title: courseRes.data.title,
          short_description: courseRes.data.short_description,
          description: courseRes.data.description,
          price: courseRes.data.price,
          target_level: courseRes.data.target_level,
          category_id: courseRes.data.category?.id,
          is_published: courseRes.data.is_published,
        });
      }
      if (lessonsRes.success) setLessons(lessonsRes.data);
      if (catRes.success) setCategories(catRes.data);
    } catch (err) {
      console.error(err);
      message.error('Không thể tải dữ liệu khóa học');
    } finally {
      setLoading(false);
    }
  }, [courseForm]);

  useEffect(() => {
    if (id) fetchCourse(id);
  }, [id, fetchCourse]);

  const handleSaveCourse = async (values: any) => {
    if (!id) return;
    try {
      setSaving(true);
      await updateCourse(id, values);
      message.success('Cập nhật khóa học thành công!');
    } catch (err: any) {
      message.error(err?.data?.error || 'Không thể cập nhật');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveLesson = async (values: any) => {
    if (!id) return;
    try {
      if (editingLesson) {
        await updateLesson(editingLesson.id, values);
        message.success('Cập nhật bài giảng thành công!');
      } else {
        await createLesson(id, values);
        message.success('Thêm bài giảng thành công!');
      }
      setShowLessonForm(false);
      setEditingLesson(null);
      lessonForm.resetFields();
      fetchCourse(id);
    } catch (err: any) {
      message.error(err?.data?.error || 'Không thể lưu bài giảng');
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!id) return;
    try {
      await deleteLesson(lessonId);
      message.success('Đã xóa bài giảng!');
      fetchCourse(id);
    } catch (err: any) {
      message.error(err?.data?.error || 'Không thể xóa bài giảng');
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div style={{ textAlign: 'center', padding: 100 }}>
          <Spin size="large" />
        </div>
      </PageContainer>
    );
  }

  if (!course) {
    return <PageContainer>Không tìm thấy khóa học.</PageContainer>;
  }

  const lessonColumns = [
    { title: 'STT', dataIndex: 'sort_order', key: 'sort_order', width: 60 },
    { title: 'Tên bài giảng', dataIndex: 'title', key: 'title' },
    {
      title: 'Loại',
      dataIndex: 'lesson_type',
      key: 'lesson_type',
      render: (t: string) => <Tag color={t === 'video' ? 'blue' : 'green'}>{t}</Tag>,
    },
    {
      title: 'Thời lượng',
      dataIndex: 'duration_minutes',
      key: 'duration_minutes',
      render: (v: number | null) => (v ? `${v} phút` : '-'),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'is_published',
      key: 'is_published',
      render: (v: boolean) => <Tag color={v ? 'green' : 'default'}>{v ? 'Đã xuất bản' : 'Nháp'}</Tag>,
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (_: any, record: Lesson) => (
        <Space>
          <a
            onClick={() => {
              setEditingLesson(record);
              lessonForm.setFieldsValue({
                title: record.title,
                lesson_type: record.lesson_type,
                duration_minutes: record.duration_minutes,
                is_published: record.is_published,
              });
              setShowLessonForm(true);
            }}
          >
            <EditOutlined /> Sửa
          </a>
          <Popconfirm title="Xóa bài giảng này?" onConfirm={() => handleDeleteLesson(record.id)}>
            <a style={{ color: '#EF4444' }}><DeleteOutlined /> Xóa</a>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer title={`Chỉnh sửa: ${course.title}`}>
      <Tabs
        items={[
          {
            key: 'info',
            label: 'Thông tin khóa học',
            children: (
              <Card>
                <Form form={courseForm} layout="vertical" onFinish={handleSaveCourse}>
                  <Form.Item name="title" label="Tên khóa học" rules={[{ required: true }]}>
                    <Input />
                  </Form.Item>
                  <Form.Item name="category_id" label="Danh mục">
                    <Select allowClear options={categories.map((c) => ({ label: c.name, value: c.id }))} />
                  </Form.Item>
                  <Form.Item name="short_description" label="Mô tả ngắn">
                    <TextArea rows={2} />
                  </Form.Item>
                  <Form.Item name="description" label="Mô tả chi tiết">
                    <TextArea rows={6} />
                  </Form.Item>
                  <Space>
                    <Form.Item name="price" label="Giá (VNĐ)">
                      <InputNumber min={0} />
                    </Form.Item>
                    <Form.Item name="target_level" label="Cấp độ">
                      <Select
                        options={[
                          { label: 'Tất cả', value: 'all' },
                          { label: 'Cơ bản', value: 'beginner' },
                          { label: 'Trung bình', value: 'intermediate' },
                          { label: 'Nâng cao', value: 'advanced' },
                        ]}
                      />
                    </Form.Item>
                  </Space>
                  <Form.Item>
                    <Button type="primary" htmlType="submit" loading={saving}>
                      Lưu thay đổi
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            ),
          },
          {
            key: 'lessons',
            label: `Bài giảng (${lessons.length})`,
            children: (
              <Card>
                <div style={{ marginBottom: 16 }}>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => {
                      setEditingLesson(null);
                      lessonForm.resetFields();
                      setShowLessonForm(true);
                    }}
                  >
                    Thêm bài giảng
                  </Button>
                </div>

                {showLessonForm && (
                  <Card style={{ marginBottom: 16 }} title={editingLesson ? 'Sửa bài giảng' : 'Thêm bài giảng'}>
                    <Form form={lessonForm} layout="inline" onFinish={handleSaveLesson}>
                      <Form.Item name="title" rules={[{ required: true, message: 'Nhập tên' }]}>
                        <Input placeholder="Tên bài giảng" style={{ width: 250 }} />
                      </Form.Item>
                      <Form.Item name="lesson_type" initialValue="video">
                        <Select
                          style={{ width: 120 }}
                          options={[
                            { label: 'Video', value: 'video' },
                            { label: 'Text', value: 'text' },
                          ]}
                        />
                      </Form.Item>
                      <Form.Item name="duration_minutes">
                        <InputNumber placeholder="Phút" min={1} />
                      </Form.Item>
                      <Form.Item name="is_published" initialValue={false}>
                        <Select
                          style={{ width: 120 }}
                          options={[
                            { label: 'Nháp', value: false },
                            { label: 'Xuất bản', value: true },
                          ]}
                        />
                      </Form.Item>
                      <Form.Item>
                        <Space>
                          <Button type="primary" htmlType="submit">
                            {editingLesson ? 'Cập nhật' : 'Thêm'}
                          </Button>
                          <Button onClick={() => { setShowLessonForm(false); setEditingLesson(null); }}>
                            Hủy
                          </Button>
                        </Space>
                      </Form.Item>
                    </Form>
                  </Card>
                )}

                <Table dataSource={lessons} columns={lessonColumns} rowKey="id" pagination={false} />
              </Card>
            ),
          },
        ]}
      />
    </PageContainer>
  );
};

export default EditCourse;
```

### Step 8.2: Add route to `frontend/config/routes.ts`

Inside the Instructor Portal routes array, add:

```ts
      {
        path: '/instructor/courses/:id/edit',
        name: 'Chỉnh sửa khóa học',
        component: './instructor/courses/edit',
        hideInMenu: true,
      },
```

### Step 8.3: Commit

```bash
git add frontend/src/pages/instructor/courses/edit/index.tsx frontend/config/routes.ts
git commit -m "feat(frontend): add instructor course edit page with lesson management"
```

---

## Task 9: Admin Backend API

**Files:**
- Create: `backend/src/controllers/admin.controller.ts`
- Create: `backend/src/routes/admin.routes.ts`
- Modify: `backend/src/app.ts`

### Step 9.1: Create admin controller

```ts
// backend/src/controllers/admin.controller.ts
import { Response } from 'express';
import { Op } from 'sequelize';
import { User, StudentProfile, InstructorProfile, Course, Enrollment } from '../models';
import { AuthRequest } from '../middlewares/auth.middleware';
import bcrypt from 'bcryptjs';

// GET /api/admin/users
export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const {
      page = '1',
      limit = '20',
      user_type,
      is_active,
      search,
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const where: any = {};
    if (user_type) where.user_type = user_type;
    if (is_active !== undefined) where.is_active = is_active === 'true';
    if (search) {
      where[Op.or] = [
        { full_name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }

    const { rows: users, count: total } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password_hash', 'reset_password_token', 'reset_password_expires'] },
      include: [
        { model: StudentProfile, as: 'studentProfile', required: false },
        { model: InstructorProfile, as: 'instructorProfile', required: false },
      ],
      order: [['created_at', 'DESC']],
      limit: limitNum,
      offset,
      distinct: true,
    });

    return res.status(200).json({
      success: true,
      data: users,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (error: any) {
    console.error('getUsers Error:', error);
    return res.status(500).json({ success: false, error: 'Co loi xay ra khi lay danh sach nguoi dung!' });
  }
};

// GET /api/admin/users/:id
export const getUserById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id, {
      attributes: { exclude: ['password_hash', 'reset_password_token', 'reset_password_expires'] },
      include: [
        { model: StudentProfile, as: 'studentProfile', required: false },
        { model: InstructorProfile, as: 'instructorProfile', required: false },
      ],
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'Khong tim thay nguoi dung!' });
    }

    return res.status(200).json({ success: true, data: user });
  } catch (error: any) {
    console.error('getUserById Error:', error);
    return res.status(500).json({ success: false, error: 'Co loi xay ra!' });
  }
};

// POST /api/admin/users
export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, full_name, user_type, phone, school_name, expertise } = req.body;

    if (!email || !password || !full_name || !user_type) {
      return res.status(400).json({ success: false, error: 'Vui long dien day du thong tin!' });
    }

    // Check email exists
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ success: false, error: 'Email da ton tai!' });
    }

    // Generate username from full_name
    const words = full_name.trim().split(/\s+/);
    const lastWord = words[words.length - 1].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');
    const initials = words.slice(0, -1).map((w: string) => w[0].toLowerCase()).join('');
    const username = `${lastWord}${initials}${Math.floor(Math.random() * 1000)}`;

    const password_hash = await bcrypt.hash(password, 12);

    const user = await User.create({
      email,
      username,
      password_hash,
      full_name,
      user_type,
      is_active: true,
      email_verified: false,
    });

    // Create profile
    if (user_type === 'student') {
      await StudentProfile.create({ user_id: user.id, phone, school_name });
    } else if (user_type === 'instructor') {
      await InstructorProfile.create({ user_id: user.id, expertise });
    }

    const { password_hash: _, ...userData } = user.toJSON();
    return res.status(201).json({ success: true, message: 'Tao nguoi dung thanh cong!', data: userData });
  } catch (error: any) {
    console.error('createUser Error:', error);
    return res.status(500).json({ success: false, error: 'Co loi xay ra khi tao nguoi dung!' });
  }
};

// PUT /api/admin/users/:id
export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { full_name, email, user_type } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Khong tim thay nguoi dung!' });
    }

    await user.update({ full_name, email, user_type });

    const { password_hash: _, ...userData } = user.toJSON();
    return res.status(200).json({ success: true, data: userData });
  } catch (error: any) {
    console.error('updateUser Error:', error);
    return res.status(500).json({ success: false, error: 'Co loi xay ra!' });
  }
};

// PUT /api/admin/users/:id/status
export const updateUserStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Khong tim thay nguoi dung!' });
    }

    await user.update({ is_active });
    return res.status(200).json({ success: true, message: 'Cap nhat trang thai thanh cong!' });
  } catch (error: any) {
    console.error('updateUserStatus Error:', error);
    return res.status(500).json({ success: false, error: 'Co loi xay ra!' });
  }
};

// DELETE /api/admin/users/:id
export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Khong tim thay nguoi dung!' });
    }

    await user.update({ deleted_at: new Date(), is_active: false });
    return res.status(200).json({ success: true, message: 'Xoa nguoi dung thanh cong!' });
  } catch (error: any) {
    console.error('deleteUser Error:', error);
    return res.status(500).json({ success: false, error: 'Co loi xay ra!' });
  }
};

// GET /api/admin/dashboard
export const getAdminDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const [totalStudents, totalInstructors, totalCourses, activeCourses, totalEnrollments, recentUsers] =
      await Promise.all([
        User.count({ where: { user_type: 'student' } }),
        User.count({ where: { user_type: 'instructor' } }),
        Course.count({ where: { deleted_at: null } }),
        Course.count({ where: { is_published: true, deleted_at: null } }),
        Enrollment.count(),
        User.findAll({
          attributes: ['id', 'full_name', 'email', 'user_type', 'created_at'],
          order: [['created_at', 'DESC']],
          limit: 10,
        }),
      ]);

    return res.status(200).json({
      success: true,
      data: {
        totalStudents,
        totalInstructors,
        totalCourses,
        activeCourses,
        totalEnrollments,
        recentUsers,
      },
    });
  } catch (error: any) {
    console.error('getAdminDashboard Error:', error);
    return res.status(500).json({ success: false, error: 'Co loi xay ra!' });
  }
};
```

### Step 9.2: Create admin routes

```ts
// backend/src/routes/admin.routes.ts
import { Router } from 'express';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserStatus,
  deleteUser,
  getAdminDashboard,
} from '../controllers/admin.controller';
import { authenticateToken, authorizeRole } from '../middlewares/auth.middleware';

const router = Router();

// All admin routes require authentication + admin role
router.use(authenticateToken as any);
router.use(authorizeRole('admin') as any);

// Dashboard
router.get('/dashboard', getAdminDashboard as any);

// User management
router.get('/users', getUsers as any);
router.get('/users/:id', getUserById as any);
router.post('/users', createUser as any);
router.put('/users/:id', updateUser as any);
router.put('/users/:id/status', updateUserStatus as any);
router.delete('/users/:id', deleteUser as any);

export default router;
```

### Step 9.3: Register admin routes in `app.ts`

Add import at the top of `backend/src/app.ts`:

```ts
import adminRoutes from './routes/admin.routes';
```

Add route registration after the dashboard routes line:

```ts
app.use('/api/admin', adminRoutes);
```

### Step 9.4: Verify admin API works

Start backend, login as admin, test with curl or browser:

```bash
# Login first to get token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usernameOrEmail":"sysadmin","password":"ant.design"}'

# Test admin dashboard
curl http://localhost:5000/api/admin/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test admin users list
curl http://localhost:5000/api/admin/users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected: JSON responses with `{ success: true, data: ... }`.

### Step 9.5: Commit

```bash
git add backend/src/controllers/admin.controller.ts \
        backend/src/routes/admin.routes.ts \
        backend/src/app.ts
git commit -m "feat(backend): add admin API for user management and dashboard"
```

---

## Task 10: Admin Frontend (Service + Pages Conversion)

**Files:**
- Create: `frontend/src/services/ant-design-pro/admin.ts`
- Modify: `frontend/src/pages/admin/dashboard/index.tsx`
- Modify: `frontend/src/pages/admin/users/index.tsx`

### Step 10.1: Create admin service

```ts
// frontend/src/services/ant-design-pro/admin.ts
import { request } from '@umijs/max';

export interface AdminDashboardData {
  totalStudents: number;
  totalInstructors: number;
  totalCourses: number;
  activeCourses: number;
  totalEnrollments: number;
  recentUsers: {
    id: string;
    full_name: string;
    email: string;
    user_type: string;
    created_at: string;
  }[];
}

export interface AdminUser {
  id: string;
  email: string;
  username: string;
  full_name: string;
  user_type: string;
  is_active: boolean;
  created_at: string;
  studentProfile?: {
    date_of_birth?: string;
    phone?: string;
    school_name?: string;
    grade_level?: string;
  } | null;
  instructorProfile?: {
    expertise?: string;
    experience_years?: number;
    degree?: string;
  } | null;
}

export async function getAdminDashboard() {
  return request<{ success: boolean; data: AdminDashboardData }>('/api/admin/dashboard', {
    method: 'GET',
  });
}

export async function getUsers(params?: {
  page?: number;
  limit?: number;
  user_type?: string;
  is_active?: string;
  search?: string;
}) {
  return request<{
    success: boolean;
    data: AdminUser[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }>('/api/admin/users', {
    method: 'GET',
    params,
  });
}

export async function getUserById(id: string) {
  return request<{ success: boolean; data: AdminUser }>(`/api/admin/users/${id}`, {
    method: 'GET',
  });
}

export async function createUser(data: {
  email: string;
  password: string;
  full_name: string;
  user_type: string;
  phone?: string;
  school_name?: string;
  expertise?: string;
}) {
  return request<{ success: boolean; data: AdminUser; message: string }>('/api/admin/users', {
    method: 'POST',
    data,
  });
}

export async function updateUser(id: string, data: { full_name?: string; email?: string; user_type?: string }) {
  return request<{ success: boolean; data: AdminUser }>(`/api/admin/users/${id}`, {
    method: 'PUT',
    data,
  });
}

export async function updateUserStatus(id: string, isActive: boolean) {
  return request<{ success: boolean; message: string }>(`/api/admin/users/${id}/status`, {
    method: 'PUT',
    data: { is_active: isActive },
  });
}

export async function deleteUser(id: string) {
  return request<{ success: boolean; message: string }>(`/api/admin/users/${id}`, {
    method: 'DELETE',
  });
}
```

### Step 10.2: Convert admin dashboard page

Replace the entire file at `frontend/src/pages/admin/dashboard/index.tsx`:

```tsx
// frontend/src/pages/admin/dashboard/index.tsx
import { BookOutlined, TeamOutlined, TrophyOutlined, UserOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { Card, Col, Row, Spin, Statistic, Table, Tag } from 'antd';
import React, { useEffect, useState } from 'react';
import { getAdminDashboard, AdminDashboardData } from '@/services/ant-design-pro/admin';

const AdminDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AdminDashboardData | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getAdminDashboard();
        if (res.success) setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <PageContainer title="Báo cáo hệ thống">
        <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>
      </PageContainer>
    );
  }

  const stats = [
    { title: 'Tổng học viên', value: data?.totalStudents || 0, icon: <TeamOutlined style={{ color: '#4F46E5', fontSize: 24 }} /> },
    { title: 'Tổng giảng viên', value: data?.totalInstructors || 0, icon: <UserOutlined style={{ color: '#10B981', fontSize: 24 }} /> },
    { title: 'Khóa học hoạt động', value: data?.activeCourses || 0, icon: <BookOutlined style={{ color: '#F59E0B', fontSize: 24 }} /> },
    { title: 'Tổng đăng ký', value: data?.totalEnrollments || 0, icon: <TrophyOutlined style={{ color: '#EF4444', fontSize: 24 }} /> },
  ];

  const userColumns = [
    { title: 'Họ tên', dataIndex: 'full_name', key: 'full_name', render: (t: string) => <strong>{t}</strong> },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    {
      title: 'Vai trò', dataIndex: 'user_type', key: 'user_type',
      render: (t: string) => {
        const colors: Record<string, string> = { student: 'blue', instructor: 'purple', admin: 'red' };
        return <Tag color={colors[t] || 'default'}>{t}</Tag>;
      },
    },
    {
      title: 'Ngày tạo', dataIndex: 'created_at', key: 'created_at',
      render: (t: string) => new Date(t).toLocaleDateString('vi-VN'),
    },
  ];

  return (
    <PageContainer title="Báo cáo hệ thống">
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {stats.map((stat, i) => (
          <Col xs={24} sm={12} md={6} key={i}>
            <Card hoverable>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Statistic title={stat.title} value={stat.value} valueStyle={{ fontSize: 24, fontWeight: 'bold' }} />
                {stat.icon}
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Card title="Người dùng đăng ký gần đây">
        <Table
          dataSource={data?.recentUsers || []}
          columns={userColumns}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </Card>
    </PageContainer>
  );
};

export default AdminDashboard;
```

### Step 10.3: Convert admin users page

Replace the entire file at `frontend/src/pages/admin/users/index.tsx`:

```tsx
// frontend/src/pages/admin/users/index.tsx
import { PlusOutlined } from '@ant-design/icons';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Button, Form, Input, message, Modal, Popconfirm, Select, Space, Tag } from 'antd';
import React, { useRef, useState } from 'react';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { getUsers, createUser, updateUserStatus, deleteUser, AdminUser } from '@/services/ant-design-pro/admin';

const UserManagement: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm] = Form.useForm();

  const handleToggleStatus = async (record: AdminUser) => {
    try {
      await updateUserStatus(record.id, !record.is_active);
      message.success(record.is_active ? 'Đã khóa tài khoản!' : 'Đã kích hoạt tài khoản!');
      actionRef.current?.reload();
    } catch (err: any) {
      message.error(err?.data?.error || 'Không thể cập nhật trạng thái');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteUser(id);
      message.success('Đã xóa người dùng!');
      actionRef.current?.reload();
    } catch (err: any) {
      message.error(err?.data?.error || 'Không thể xóa người dùng');
    }
  };

  const handleCreate = async (values: any) => {
    try {
      await createUser(values);
      message.success('Tạo người dùng thành công!');
      setShowCreateModal(false);
      createForm.resetFields();
      actionRef.current?.reload();
    } catch (err: any) {
      message.error(err?.data?.error || 'Không thể tạo người dùng');
    }
  };

  const columns: ProColumns<AdminUser>[] = [
    {
      title: 'Họ tên',
      dataIndex: 'full_name',
      render: (_, record) => <strong>{record.full_name}</strong>,
    },
    { title: 'Email', dataIndex: 'email', copyable: true },
    { title: 'Tên đăng nhập', dataIndex: 'username', copyable: true },
    {
      title: 'Vai trò',
      dataIndex: 'user_type',
      valueType: 'select',
      valueEnum: {
        student: { text: 'Học viên', status: 'Processing' },
        instructor: { text: 'Giảng viên', status: 'Warning' },
        admin: { text: 'Quản trị', status: 'Error' },
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'is_active',
      valueType: 'select',
      valueEnum: {
        true: { text: 'Hoạt động', status: 'Success' },
        false: { text: 'Đã khóa', status: 'Default' },
      },
      render: (_, record) => (
        <Tag color={record.is_active ? 'green' : 'default'}>
          {record.is_active ? 'Hoạt động' : 'Đã khóa'}
        </Tag>
      ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      hideInSearch: true,
      render: (_, record) => new Date(record.created_at).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Hành động',
      valueType: 'option',
      render: (_, record) => (
        <Space>
          <a onClick={() => handleToggleStatus(record)}>
            {record.is_active ? 'Khóa' : 'Kích hoạt'}
          </a>
          <Popconfirm title="Xóa người dùng này?" onConfirm={() => handleDelete(record.id)}>
            <a style={{ color: '#EF4444' }}>Xóa</a>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer title="Quản lý người dùng">
      <ProTable<AdminUser>
        headerTitle="Danh sách người dùng"
        actionRef={actionRef}
        rowKey="id"
        search={{ labelWidth: 120 }}
        toolBarRender={() => [
          <Button key="create" type="primary" icon={<PlusOutlined />} onClick={() => setShowCreateModal(true)}>
            Tạo người dùng
          </Button>,
        ]}
        request={async (params) => {
          try {
            const res = await getUsers({
              page: params.current || 1,
              limit: params.pageSize || 20,
              user_type: params.user_type || undefined,
              is_active: params.is_active || undefined,
              search: params.full_name || params.email || undefined,
            });
            return { data: res.data || [], total: res.pagination?.total || 0, success: true };
          } catch {
            return { data: [], total: 0, success: false };
          }
        }}
        columns={columns}
      />

      <Modal
        title="Tạo người dùng mới"
        open={showCreateModal}
        onCancel={() => { setShowCreateModal(false); createForm.resetFields(); }}
        footer={null}
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="full_name" label="Họ tên" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="password" label="Mật khẩu" rules={[{ required: true, min: 6 }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="user_type" label="Vai trò" rules={[{ required: true }]}>
            <Select
              options={[
                { label: 'Học viên', value: 'student' },
                { label: 'Giảng viên', value: 'instructor' },
                { label: 'Quản trị viên', value: 'admin' },
              ]}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Tạo người dùng
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default UserManagement;
```

### Step 10.4: Verify admin pages work

Login as admin, navigate to `/admin/dashboard` and `/admin/users`.

Expected: Dashboard shows real stats, users table loads from API, create/toggle/delete work.

### Step 10.5: Commit

```bash
git add frontend/src/services/ant-design-pro/admin.ts \
        frontend/src/pages/admin/dashboard/index.tsx \
        frontend/src/pages/admin/users/index.tsx
git commit -m "feat(frontend): convert admin dashboard and user management to real API"
```

---

## Verification Checklist

After all tasks are complete, verify each flow end-to-end:

- [ ] **Public courses:** `/courses` loads courses from API, filters work, pagination works
- [ ] **Course detail:** `/courses/:id` shows course info, lessons, enrollment button works
- [ ] **Enrollment:** Student can enroll, sees "Tiếp tục học" button after enrollment
- [ ] **My courses:** `/student/my-courses` shows real enrollments with progress
- [ ] **Lesson view:** `/student/courses/:courseId/lessons/:lessonId` loads lesson, video plays, progress tracks
- [ ] **Instructor courses:** `/instructor/courses` loads from API, toggle publish works, delete works
- [ ] **Create course:** `/instructor/courses/create` creates course and lessons via API
- [ ] **Edit course:** `/instructor/courses/:id/edit` loads data, edit info works, manage lessons works
- [ ] **Admin dashboard:** `/admin/dashboard` shows real stats
- [ ] **Admin users:** `/admin/users` loads users, create/toggle/delete works
