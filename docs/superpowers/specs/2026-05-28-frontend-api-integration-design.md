# Thiết kế: Kết nối Frontend với Backend APIs

> **Ngày:** 2026-05-28
> **Phạm vi:** Chuyển đổi/mock sang API thật, xây mới các trang frontend còn thiếu
> **Nguyên tắc:** Ưu tiên luồng nghiệp vụ cốt lõi trước (học tập → quản lý → quản trị)

---

## Tổng quan

Backend hiện có **29 API endpoints** nhưng chỉ **8 endpoint** được frontend kết nối. Thiết kế này trình bày kế hoạch kết nối **20 endpoint còn lại** (và xây mới backend cho admin) theo 3 mức ưu tiên.

### Tình trạng hiện tại

| Nhóm API | Số endpoint | Frontend đã kết nối |
|---|---|---|
| Auth | 6 | 6/6 ✅ |
| Dashboard | 2 | 2/2 ✅ |
| Courses | 7 | 0/7 ❌ |
| Lessons | 6 | 0/6 ❌ |
| Enrollments | 4 | 0/4 ❌ |
| Lesson Progress | 4 | 0/4 ❌ |
| Uploads | 5 | 0/5 ❌ |
| Admin | 0 | Chưa có API |

---

## Ưu tiên 1 — Luồng học tập (Student Core Flow)

### Mục tiêu

Hoàn thiện luồng: Duyệt khóa học → Xem chi tiết → Đăng ký → Xem bài giảng → Theo dõi tiến độ → Xem video có bảo mật.

### 1.1 Trang danh sách khóa học public

**Route:** `/courses` (mới)
**Vai trò:** Public (khách và học sinh đã đăng nhập)

**API sử dụng:**
- `GET /api/courses` — phân trang, filter `category_id`, `target_level`, `search` (FULLTEXT), sort (`newest`, `price_asc`, `price_desc`, `popular`, `rating`)
- `GET /api/courses/categories` — render bộ lọc danh mục (dropdown/tag)

**UI Components:**
- Bộ lọc: danh mục (dropdown từ categories), cấp độ (beginner/intermediate/advanced), khoảng giá, sắp xếp
- Thanh tìm kiếm (FULLTEXT search)
- Grid danh sách khóa học: thumbnail, tên, giảng viên, giá, đánh giá, số học viên
- Phân trang
- Nút hành động:
  - Khách / chưa đăng nhập → "Xem chi tiết"
  - Đã đăng ký → "Tiếp tục học"
  - Chưa đăng ký → "Đăng ký ngay"

**Data flow:**
```
User → GET /api/courses?category_id=X&search=Y&page=1&limit=12
     ← { courses: [...], total, page, limit }
```

### 1.2 Trang chi tiết khóa học

**Route:** `/courses/:id` (mới)
**Vai trò:** Public (enriched nếu đã đăng nhập)

**API sử dụng:**
- `GET /api/courses/:id` — trả về khóa học kèm: category, instructors, published lessons, materials. Nếu có JWT, kèm `enrollment_status`.

**UI Components:**
- Header: thumbnail lớn, tên khóa, giảng viên, giá, đánh giá, số học viên
- Mô tả khóa học (HTML/Markdown)
- Danh sách bài giảng (sidebar hoặc section): tên, thời lượng, loại, đánh dấu preview
- Tài liệu đính kèm (nếu có)
- Nút đăng ký hoặc "Bắt đầu học":
  - Chưa đăng nhập → chuyển đến trang đăng nhập
  - Chưa đăng ký → gọi `POST /api/enrollments` với `{ course_id }`
  - Đã đăng ký → điều hướng đến trang xem bài giảng đầu tiên

**Xử lý đăng ký:**
```
POST /api/enrollments  { course_id: "..." }
← { id, user_id, course_id, status: "active", progress_percentage: 0 }
→ Chuyển hướng đến /student/courses/:courseId/lessons/:firstLessonId
```

### 1.3 Trang "Khóa học của tôi" — chuyển đổi từ mock

**Route:** `/student/my-courses` (đã tồn tại, chuyển mock → API)
**Vai trò:** Student

**API sử dụng:**
- `GET /api/enrollments/me` — danh sách khóa đã đăng ký, kèm thông tin khóa học và giảng viên

**Thay đổi cần làm:**
- Xóa mock data hardcoded
- Gọi API thật trong `useEffect`
- Hiển thị `progress_percentage` từ API
- Tab "Đang học" (status: active) / "Đã hoàn thành" (status: completed)
- Nút "Tiếp tục học" → điều hướng đến bài giảng tiếp theo chưa hoàn thành

**Data flow:**
```
GET /api/enrollments/me?status=active&page=1&limit=10
← {
    enrollments: [{
      id, status, progress_percentage, enrolled_at,
      course: { id, title, thumbnail, total_lessons },
      instructor: { full_name, avatar_url }
    }],
    total, page, limit
  }
```

### 1.4 Trang xem bài giảng

**Route:** `/student/courses/:courseId/lessons/:lessonId` (mới)
**Vai trò:** Student (phải đã đăng ký khóa học)

**API sử dụng:**
- `GET /api/lessons/:id` — nội dung bài giảng (title, content_url, content_text, lesson_type, duration_minutes, materials)
- `GET /api/lesson-progress/:courseId` — map tiến độ tất cả bài trong khóa
- `GET /api/uploads/video/:id/signed-url` — URL video có thời hạn 15 phút (nếu lesson_type = video)
- `POST /api/lesson-progress/complete` — đánh dấu hoàn thành
- `PUT /api/lesson-progress/position` — lưu vị trí xem video (tự động, debounce 5s)

**UI Components:**
- **Main content:**
  - Nếu `lesson_type = "video"`: Video player (signed URL từ Cloudinary), tự động lưu vị trí khi pause/tua
  - Nếu `lesson_type = "text"`: Hiển thị `content_text` (HTML)
- **Sidebar:**
  - Danh sách bài giảng trong khóa, đánh dấu bài đã hoàn thành (checkmark)
  - Click bài giảng khác → chuyển trang
- **Footer:**
  - Nút "Đánh dấu hoàn thành" / "Bỏ đánh dấu" → toggle `POST /api/lesson-progress/complete` / `PUT /api/lesson-progress/uncomplete`
  - Tiến độ tổng: "Đã hoàn thành X/Y bài giảng"

**Logic video player:**
```
1. Load lesson → lấy lesson.video_id
2. Gọi GET /api/uploads/video/:videoId/signed-url
3. Gán signed URL vào player src
4. Khi video pause → PUT /api/lesson-progress/position { last_position, watch_duration }
5. Khi video ended → POST /api/lesson-progress/complete { lesson_id, course_id }
```

**Bảo vệ route:**
- Khi trang load, gọi `GET /api/enrollments/check/:courseId` để xác nhận đã đăng ký
- Nếu chưa đăng ký và bài không phải `is_preview` → chuyển hướng về trang chi tiết khóa học
- Nếu bài là `is_preview = true` → cho phép xem mà không cần đăng ký

### 1.5 API Services mới trong frontend

```
frontend/src/services/ant-design-pro/
├── courses.ts        (mới)
│   ├── getCourses(params)         → GET /api/courses
│   ├── getCourseById(id)          → GET /api/courses/:id
│   └── getCategories()            → GET /api/courses/categories
│
├── enrollments.ts    (mới)
│   ├── enrollCourse(courseId)     → POST /api/enrollments
│   ├── unenrollCourse(id)         → DELETE /api/enrollments/:id
│   ├── getMyEnrollments(params)   → GET /api/enrollments/me
│   └── checkEnrollment(courseId)  → GET /api/enrollments/check/:courseId
│
├── lessons.ts        (mới)
│   ├── getLessonById(id)          → GET /api/lessons/:id
│   └── getLessonsByCourse(courseId) → GET /api/courses/:courseId/lessons
│
├── lessonProgress.ts (mới)
│   ├── markLessonComplete(data)   → POST /api/lesson-progress/complete
│   ├── unmarkLessonComplete(data) → PUT /api/lesson-progress/uncomplete
│   ├── updateWatchPosition(data)  → PUT /api/lesson-progress/position
│   └── getLessonProgress(courseId) → GET /api/lesson-progress/:courseId
│
└── uploads.ts        (mới)
    └── getSignedVideoUrl(videoId) → GET /api/uploads/video/:videoId/signed-url
```

### 1.6 Routes mới trong `config/routes.ts`

```
{ path: '/courses', component: '@/pages/courses/list' }
{ path: '/courses/:id', component: '@/pages/courses/detail' }
{ path: '/student/courses/:courseId/lessons/:lessonId', component: '@/pages/student/lesson-view' }
```

---

## Ưu tiên 2 — Quản lý khóa học (Instructor Course Management)

### Mục tiêu

Giảng viên có thể tạo/sửa/xóa/xuất bản khóa học và quản lý bài giảng thông qua UI thật.

### 2.1 Trang quản lý khóa học giảng viên — chuyển đổi từ mock

**Route:** `/instructor/courses` (đã tồn tại, chuyển mock → API)
**Vai trò:** Instructor

**API sử dụng:**
- `GET /api/courses/instructor/me` — danh sách khóa học của giảng viên, filter theo `status` (published/draft), phân trang
- `PUT /api/courses/:id` — cập nhật trạng thái xuất bản (`is_published`)
- `DELETE /api/courses/:id` — xóa mềm khóa học

**Thay đổi cần làm:**
- Xóa mock data
- Gọi API thật, hỗ trợ filter và phân trang từ server
- Toggle xuất bản: gọi `PUT /api/courses/:id` với `{ is_published: true/false }`
- Xóa: hiện modal xác nhận → gọi `DELETE /api/courses/:id`
- Nút "Chỉnh sửa" → điều hướng `/instructor/courses/:id/edit`

### 2.2 Trang tạo khóa học — chuyển đổi từ mock

**Route:** `/instructor/courses/create` (đã tồn tại, chuyển mock → API)
**Vai trò:** Instructor

**Quy trình tạo khóa học (StepsForm):**

**Bước 1 — Thông tin cơ bản:**
- Form: tiêu đề, danh mục (dropdown từ `GET /api/courses/categories`), mô tả ngắn, mô tả đầy đủ, giá, cấp độ, thời lượng
- Submit → `POST /api/courses` → nhận về `course.id`

**Bước 2 — Thêm bài giảng:**
- Form lặp: tiêu đề bài giảng, loại (video/text), thời lượng
- Submit từng bài → `POST /api/courses/:courseId/lessons` cho mỗi bài
- Hỗ trợ thêm/xóa bài giảng trong form

**Bước 3 — Upload video (nếu bài giảng loại video):**
- Chọn file video → `POST /api/uploads/video` (multipart, field `video`, kèm `course_id`)
- Upload thành công → nhận `video.id`, gọi `PUT /api/lessons/:lessonId` để gán `video_id`

**Bước 4 — Xuất bản:**
- Tổng quan khóa học
- Nút "Lưu nháp" → không làm gì thêm (course đã tạo với `is_published: false`)
- Nút "Xuất bản" → `PUT /api/courses/:id` với `{ is_published: true }`

### 2.3 Trang sửa khóa học

**Route:** `/instructor/courses/:id/edit` (mới)
**Vai trò:** Instructor (chỉ khóa học mình quản lý)

**API sử dụng:**
- `GET /api/courses/:id` — tải dữ liệu hiện có
- `PUT /api/courses/:id` — cập nhật thông tin
- `GET /api/courses/:courseId/lessons` — danh sách bài giảng hiện có
- `POST /api/courses/:courseId/lessons` — thêm bài giảng mới
- `PUT /api/lessons/:id` — sửa bài giảng
- `DELETE /api/lessons/:id` — xóa bài giảng
- `PUT /api/courses/:courseId/lessons/reorder` — kéo thả sắp xếp bài giảng

**UI Components:**
- Tab "Thông tin": form chỉnh sửa thông tin khóa học
- Tab "Bài giảng":
  - Danh sách bài giảng hiện có (sortable)
  - Nút thêm/sửa/xóa bài giảng
  - Upload video cho từng bài giảng
- Nút "Lưu thay đổi" / "Xuất bản"

### 2.4 API Services mở rộng trong frontend

```
courses.ts — thêm:
  ├── createCourse(data)           → POST /api/courses
  ├── updateCourse(id, data)       → PUT /api/courses/:id
  ├── deleteCourse(id)             → DELETE /api/courses/:id
  └── getInstructorCourses(params) → GET /api/courses/instructor/me

lessons.ts — thêm:
  ├── createLesson(courseId, data) → POST /api/courses/:courseId/lessons
  ├── updateLesson(id, data)       → PUT /api/lessons/:id
  ├── deleteLesson(id)             → DELETE /api/lessons/:id
  └── reorderLessons(courseId, ids) → PUT /api/courses/:courseId/lessons/reorder

uploads.ts — thêm:
  ├── uploadVideo(formData)        → POST /api/uploads/video (multipart)
  ├── uploadImage(formData)        → POST /api/uploads/image (multipart)
  ├── getVideosByCourse(courseId)  → GET /api/uploads/video/course/:courseId
  └── deleteVideo(id)              → DELETE /api/uploads/video/:id
```

### 2.5 Routes mới/sửa đổi trong `config/routes.ts`

```
{ path: '/instructor/courses', component: '@/pages/instructor/courses' }           (giữ nguyên)
{ path: '/instructor/courses/create', component: '@/pages/instructor/courses/create' } (giữ nguyên)
{ path: '/instructor/courses/:id/edit', component: '@/pages/instructor/courses/edit' }  (mới)
```

---

## Ưu tiên 3 — Quản trị (Admin Management)

### Mục tiêu

Quản trị viên có thể quản lý người dùng và xem thống kê hệ thống. Cần xây cả API backend lẫn frontend.

### 3.1 Backend API mới cần xây dựng

**File mới:**
```
backend/src/
├── controllers/admin.controller.ts
├── routes/admin.routes.ts
```

**Route registration trong app.ts:**
```
app.use('/api/admin', adminRoutes);
```

**Middleware:** Tất cả route admin yêu cầu JWT + `authorizeRole('admin')`.

#### Admin Users API

| Method | Path | Controller | Mô tả |
|---|---|---|---|
| GET | `/api/admin/users` | `getUsers` | Danh sách người dùng, phân trang, filter `user_type`, `is_active`, search `full_name`/`email` |
| GET | `/api/admin/users/:id` | `getUserById` | Chi tiết người dùng kèm profile (student hoặc instructor) |
| POST | `/api/admin/users` | `createUser` | Tạo người dùng mới (admin tạo hộ), tự động tạo profile tương ứng |
| PUT | `/api/admin/users/:id` | `updateUser` | Cập nhật thông tin cơ bản (`full_name`, `email`, `user_type`) |
| PUT | `/api/admin/users/:id/status` | `updateUserStatus` | Bật/tắt `is_active` |
| DELETE | `/api/admin/users/:id` | `deleteUser` | Xóa mềm (`deleted_at`) |

**Logic `getUsers`:**
```
Query params: page, limit, user_type, is_active, search
- search: dùng Op.like trên full_name và email
- trả về: { users: [...], total, page, limit }
- mỗi user kèm StudentProfile hoặc InstructorProfile tùy user_type
```

**Logic `createUser`:**
```
Body: { email, password, full_name, user_type, phone?, school_name?, expertise? }
- Tự động generate username (từ full_name)
- Hash password (bcrypt, salt 12)
- Tạo profile tương ứng (StudentProfile hoặc InstructorProfile)
- Trả về user (không gồm password_hash)
```

#### Admin Dashboard API

| Method | Path | Controller | Mô tả |
|---|---|---|---|
| GET | `/api/admin/dashboard` | `getAdminDashboard` | Thống kê tổng quan hệ thống |

**Logic `getAdminDashboard`:**
```
Trả về:
- totalStudents: COUNT users WHERE user_type = 'student'
- totalInstructors: COUNT users WHERE user_type = 'instructor'
- totalCourses: COUNT courses WHERE deleted_at IS NULL
- activeCourses: COUNT courses WHERE is_published = true
- totalEnrollments: COUNT enrollments
- recentUsers: TOP 10 users ORDER BY created_at DESC (id, full_name, email, user_type, created_at)
```

### 3.2 Frontend chuyển đổi

**1. Trang Dashboard Admin** (`/admin/dashboard`) — chuyển đổi từ mock
- Gọi `GET /api/admin/dashboard` thay vì hardcode
- Hiển thị 4 stat cards từ API response
- Bảng người đăng ký gần đây từ `recentUsers`

**2. Trang quản lý người dùng** (`/admin/users`) — chuyển đổi từ mock
- Gọi `GET /api/admin/users` với phân trang, filter, search
- Tạo người dùng: modal form → `POST /api/admin/users`
- Bật/tắt trạng thái: toggle switch → `PUT /api/admin/users/:id/status`
- Xóa: xác nhận → `DELETE /api/admin/users/:id`

### 3.3 API Service mới trong frontend

```
frontend/src/services/ant-design-pro/
└── admin.ts (mới)
    ├── getAdminDashboard()          → GET /api/admin/dashboard
    ├── getUsers(params)             → GET /api/admin/users
    ├── getUserById(id)              → GET /api/admin/users/:id
    ├── createUser(data)             → POST /api/admin/users
    ├── updateUser(id, data)         → PUT /api/admin/users/:id
    ├── updateUserStatus(id, active) → PUT /api/admin/users/:id/status
    └── deleteUser(id)               → DELETE /api/admin/users/:id
```

### 3.4 Routes trong `config/routes.ts`

```
{ path: '/admin/dashboard', component: '@/pages/admin/dashboard' } (giữ nguyên)
{ path: '/admin/users', component: '@/pages/admin/users' }         (giữ nguyên)
```

---

## Tổng hợp API Services mới trong frontend

```
frontend/src/services/ant-design-pro/
├── api.ts            (giữ nguyên — auth + utilities)
├── dashboard.ts      (giữ nguyên — student/instructor dashboard)
├── courses.ts        (mới — 7 functions)
├── enrollments.ts    (mới — 4 functions)
├── lessons.ts        (mới — 6 functions)
├── lessonProgress.ts (mới — 4 functions)
├── uploads.ts        (mới — 5 functions)
└── admin.ts          (mới — 7 functions)
```

**Tổng: 33 API service functions mới.**

## Tổng hợp Backend mới cần xây dựng

```
backend/src/
├── controllers/admin.controller.ts  (mới — 7 functions)
├── routes/admin.routes.ts           (mới)
```

**Tổng: 7 API endpoint mới cho admin.**

## Tổng hợp Routes mới trong frontend

| Route | Trang | Ưu tiên |
|---|---|---|
| `/courses` | Danh sách khóa học public | 1 |
| `/courses/:id` | Chi tiết khóa học | 1 |
| `/student/courses/:courseId/lessons/:lessonId` | Xem bài giảng | 1 |
| `/instructor/courses/:id/edit` | Sửa khóa học | 2 |

**Tổng: 4 route mới + 3 route chuyển đổi từ mock sang API.**

---

## Khả năng mở rộng — Tính năng bổ sung khi dự án hoàn thành sớm

> Các tính năng dưới đây xếp theo **mức giá trị khi bảo vệ tiểu luận** (hội đồng chấm điểm). Mỗi tính năng có thể thêm độc lập sau khi hoàn thành Ưu tiên 1-3, không ảnh hưởng kiến trúc hiện có.

### Mức giá trị cao ⭐

#### E1. Hệ thống Quiz/Bài tập (Tuần 4 trong kế hoạch DB)

**Giá trị bảo vệ:** Thể hiện luồng học tập hoàn chỉnh (đăng ký → học → làm quiz → hoàn thành). Hội đồng thường hỏi "học viên làm bài kiểm tra như thế nào?"

**Hiện có:**
- Models `Assignment` và `QuizQuestion` đã tồn tại trong backend
- Associations đã thiết lập (Course 1:N Assignment, Assignment 1:N QuizQuestion)

**Cần xây:**

Backend:
- `controllers/assignment.controller.ts` — CRUD bài tập, CRUD câu hỏi, chấm điểm tự động
- `routes/assignment.routes.ts`

API endpoints mới:
| Method | Path | Mô tả |
|---|---|---|
| POST | `/api/courses/:courseId/assignments` | Giảng viên tạo bài tập |
| GET | `/api/courses/:courseId/assignments` | Danh sách bài tập theo khóa |
| GET | `/api/assignments/:id` | Chi tiết bài tập kèm câu hỏi |
| PUT | `/api/assignments/:id` | Sửa bài tập |
| DELETE | `/api/assignments/:id` | Xóa bài tập |
| POST | `/api/assignments/:id/questions` | Thêm câu hỏi |
| PUT | `/api/questions/:id` | Sửa câu hỏi |
| DELETE | `/api/questions/:id` | Xóa câu hỏi |
| POST | `/api/assignments/:id/submit` | Học viên nộp bài |
| GET | `/api/submissions/:id/result` | Xem kết quả bài nộp |

Frontend:
- Trang giảng viên quản lý bài tập (tạo quiz, thêm câu hỏi)
- Trang học viên làm quiz (hiển thị câu hỏi, đếm giờ, nộp bài)
- Trang kết quả quiz (điểm, đáp án, giải thích)

**Ước lượng:** 3-4 ngày

---

#### E2. Hệ thống Chứng chỉ (Tuần 5 trong kế hoạch DB)

**Giá trị bảo vệ:** Output trực quan, dễ demo. Hội đồng đánh giá cao tính năng "đầu ra" của khóa học.

**Hiện có:**
- Bảng `certificates` và `user_certificates` đã được thiết kế trong DB v3

**Cần xây:**

Backend:
- Migration tạo bảng `certificates`, `user_certificates`
- `controllers/certificate.controller.ts`
- Logic tự động cấp chứng chỉ khi `progress_percentage = 100`
- API xác thực chứng chỉ theo `cert_code` (public, không cần đăng nhập)

API endpoints mới:
| Method | Path | Mô tả |
|---|---|---|
| POST | `/api/courses/:courseId/certificate` | Giảng viên tạo template chứng chỉ |
| GET | `/api/courses/:courseId/certificate` | Xem template chứng chỉ |
| GET | `/api/certificates/verify/:cert_code` | Xác thực chứng chỉ (public) |
| GET | `/api/users/me/certificates` | Danh chứng chỉ của học viên |

Frontend:
- Trang quản lý chứng chỉ cho giảng viên
- Trang danh sách chứng chỉ cho học viên
- Trang xác thực chứng chỉ public (ai cũng tra cứu được)

**Ước lượng:** 2-3 ngày

---

#### E3. Refresh Tokens (Bảo mật JWT)

**Giá trị bảo vệ:** Hội đồng hay hỏi "access token hết hạn thì xử lý thế nào?" — cần có câu trả lời thực tế.

**Hiện có:**
- Bảng `refresh_tokens` đã được thiết kế trong DB v3

**Cần xây:**

Backend:
- Migration tạo bảng `refresh_tokens`
- Sửa logic login: trả thêm `refresh_token` (7 ngày)
- API `POST /api/auth/refresh` — refresh access token
- API `POST /api/auth/logout` — thu hồi refresh token
- Middleware kiểm tra refresh token chưa bị revoke

Frontend:
- Interceptor tự động gọi refresh khi access token hết hạn (401)
- Logout thu hồi refresh token thay vì chỉ xóa localStorage

**Ước lượng:** 1-2 ngày

---

### Mức giá trị trung bình 🔵

#### E4. Đánh giá khóa học (Course Reviews)

**Giá trị bảo vệ:** Tính năng phổ biến, thể hiện hệ thống feedback. Dễ implement.

**Cần xây:**

Backend:
- Migration tạo bảng `course_reviews`
- `controllers/review.controller.ts`

API endpoints mới:
| Method | Path | Mô tả |
|---|---|---|
| POST | `/api/courses/:courseId/reviews` | Học viên đánh giá khóa học |
| GET | `/api/courses/:courseId/reviews` | Danh sách đánh giá |
| PUT | `/api/reviews/:id` | Sửa đánh giá |
| DELETE | `/api/reviews/:id` | Xóa đánh giá |

Frontend:
- Component đánh giá (stars + comment) trên trang chi tiết khóa học
- Danh sách đánh giá
- Tự động cập nhật `rating_avg` trong bảng `courses`

**Ước lượng:** 1 ngày

---

#### E5. Audit Logs (Nhật ký bảo mật)

**Giá trị bảo vệ:** Tiêu chí bảo mật cơ bản. Thể hiện hệ thống có theo dõi thao tác nhạy cảm.

**Cần xây:**

Backend:
- Migration tạo bảng `audit_logs`
- Middleware ghi log tự động cho các action: `login`, `logout`, `grade_update`, `user_delete`, `enroll`, `cert_issued`
- API xem audit log cho admin

| Method | Path | Mô tả |
|---|---|---|
| GET | `/api/admin/audit-logs` | Danh sách nhật ký (admin only) |

**Ước lượng:** 1 ngày

---

#### E6. Admin quản lý khóa học

**Giá trị bảo vệ:** Thể hiện quyền quản trị đầy đủ. Hiện admin chỉ quản lý người dùng.

**Cần xây:**

Backend (mở rộng admin.controller.ts):
| Method | Path | Mô tả |
|---|---|---|
| GET | `/api/admin/courses` | Danh sách tất cả khóa học |
| PUT | `/api/admin/courses/:id/status` | Duyệt/từ chối khóa học |
| DELETE | `/api/admin/courses/:id` | Xóa khóa học bất kỳ |

Frontend:
- Trang `/admin/courses` — bảng quản lý khóa học

**Ước lượng:** 1 ngày

---

### Mức giá trị thấp 🟡

#### E7. Hệ thống thông báo

**Cần xây:**
- Bảng `notifications` (in-app)
- API tạo/đánh dấu đã đọc/thông báo chưa đọc
- Component chuông thông báo trong header

**Ước lượng:** 1-2 ngày

---

### Bảng tổng hợp mở rộng

| STT | Tính năng | Ước lượng | Giá trị bảo vệ | Phụ thuộc |
|---|---|---|---|---|
| E1 | Quiz/Bài tập | 3-4 ngày | ⭐ Cao | Hoàn thành Ưu tiên 1 |
| E2 | Chứng chỉ | 2-3 ngày | ⭐ Cao | E1 (cần quiz để hoàn thành khóa) |
| E3 | Refresh Tokens | 1-2 ngày | ⭐ Cao | Không |
| E4 | Đánh giá khóa học | 1 ngày | 🔵 Trung bình | Hoàn thành Ưu tiên 1 |
| E5 | Audit Logs | 1 ngày | 🔵 Trung bình | Không |
| E6 | Admin quản lý khóa học | 1 ngày | 🔵 Trung bình | Hoàn thành Ưu tiên 3 |
| E7 | Thông báo | 1-2 ngày | 🟡 Thấp | Không |

**Tổng thời gian ước lượng nếu làm tất cả:** 10-14 ngày

### Lưu ý kiến trúc khi mở rộng

- **State management:** Khi số lượng tính năng tăng, nên bổ sung `@tanstack/react-query` (đã có trong project) để quản lý server state thay vì `useEffect` + `useState` thủ công. Hiện chỉ trang Register dùng react-query.
- **Middleware phân quyền:** Logic kiểm tra "giảng viên chỉ sửa khóa học của mình" nằm rải rác trong controller. Khi thêm nhiều API, nên tách thành middleware `authorizeCourseOwner` tái sử dụng.
- **Error handling thống nhất:** Backend nên có error handler middleware chung, trả về format `{ error: string, code: string }` nhất quán cho tất cả API.

---

## Thứ tự thực hiện đề xuất

```
Ưu tiên 1:
  1. Tạo API services (courses, enrollments, lessons, lessonProgress, uploads)
  2. Trang /courses (danh sách public)
  3. Trang /courses/:id (chi tiết + đăng ký)
  4. Chuyển đổi /student/my-courses (mock → API)
  5. Trang /student/courses/:courseId/lessons/:lessonId (xem bài giảng + video)

Ưu tiên 2:
  6. Chuyển đổi /instructor/courses (mock → API)
  7. Chuyển đổi /instructor/courses/create (mock → API)
  8. Trang /instructor/courses/:id/edit (mới)

Ưu tiên 3:
  9. Xây backend admin API (controllers + routes)
  10. Tạo API service admin.ts
  11. Chuyển đổi /admin/dashboard (mock → API)
  12. Chuyển đổi /admin/users (mock → API)
```
