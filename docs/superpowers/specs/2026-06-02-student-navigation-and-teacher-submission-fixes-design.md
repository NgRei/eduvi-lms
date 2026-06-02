# Thiết kế sửa lỗi: Học sinh điều hướng & Giáo viên xem bài nộp

**Ngày:** 2026-06-02
**Phạm vi:** Sửa 2 lỗi UX trong hệ thống Eduvi LMS

---

## Tóm tắt vấn đề

### Vấn đề 1: Học sinh không tìm thấy trang đăng ký khóa học

Trang danh sách khóa học (`/courses`) và hệ thống enrollment đã được xây dựng đầy đủ, nhưng học sinh không thể tìm thấy vì thiếu liên kết điều hướng. Sidebar học sinh chỉ hiện mục trong `/student/`, không có link đến `/courses`.

### Vấn đề 2: Giáo viên không xem được chi tiết bài nộp

Khi giáo viên bấm "Bài nộp" trên trang quản lý bài tập:
- Bài tập loại upload: bảng trống (chưa có submission nào được seed)
- Bài tập thuộc khóa học khác giáo viên phụ trách: lỗi 403 bị nuốt im lặng, hiện bảng trống
- Frontend catch block trả `{ data: [], total: 0 }` khiến giáo viên không hiểu tại sao không có dữ liệu

---

## Thiết kế giải pháp

### Phần 1: Học sinh điều hướng đến danh sách khóa học

#### 1.1 Thêm route "Danh sách khóa học" vào sidebar học sinh

**File:** `frontend/config/routes.ts`

Thêm mục menu trong nhóm `/student/` (sau "Khóa học của tôi"):

```typescript
{
  path: '/courses',
  name: '📚 Danh sách khóa học',
  icon: 'SearchOutlined',
  component: './courses/list',
},
```

**Lưu ý kỹ thuật:**
- Route `/courses` hiện tại là route top-level (dòng 42-57). Cần giữ nguyên route top-level để khách vãng lai vẫn xem được, đồng thời thêm reference trong nhóm `/student/` để sidebar học sinh hiện mục này.
- UmiJS hỗ trợ cùng một component ở nhiều route path, nên có thể thêm `{ path: '/courses', name: 'Danh sách khóa học', component: './courses/list' }` vào trong routes của `/student/`.
- Không cần `access: 'canStudent'` vì trang khóa học là public.

#### 1.2 Thêm banner "Tìm khóa học" trên Dashboard

**File:** `frontend/src/pages/student/dashboard/index.tsx`

Thêm một Card nổi bật giữa phần thống kê (sau dòng 108) và bảng khóa học (trước dòng 110):

```tsx
<Row gutter={16} style={{ marginTop: 24 }}>
  <Col span={24}>
    <Card
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        border: 'none',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ color: '#fff', margin: 0, fontSize: 18 }}>Khám phá khóa học mới</h3>
          <p style={{ color: 'rgba(255,255,255,0.85)', margin: '8px 0 0' }}>
            Hàng trăm khóa học đang chờ bạn khám phá
          </p>
        </div>
        <Button
          type="primary"
          ghost
          size="large"
          style={{ borderColor: '#fff', color: '#fff' }}
          onClick={() => history.push('/courses')}
        >
          Tìm khóa học
        </Button>
      </div>
    </Card>
  </Col>
</Row>
```

Cần thêm import: `import { history } from '@umijs/max';` và `import { Button } from 'antd';` (Button đã có trong import ở dòng 3).

#### 1.3 Thêm link trong trang trống "Khóa học của tôi"

**File:** `frontend/src/pages/student/my-courses/index.tsx` (dòng 35)

Thay đổi Empty component từ:

```tsx
<Empty description={isCompleted ? 'Bạn chưa hoàn thành khóa học nào.' : 'Bạn chưa đăng ký khóa học nào.'} />
```

Thành:

```tsx
<Empty description={isCompleted ? 'Bạn chưa hoàn thành khóa học nào.' : 'Bạn chưa đăng ký khóa học nào.'}>
  {!isCompleted && (
    <Button type="primary" onClick={() => history.push('/courses')}>
      Khám phá khóa học
    </Button>
  )}
</Empty>
```

`history` đã được import từ `@umijs/max` ở dòng 3. `Button` đã có trong import antd ở dòng 2.

---

### Phần 2: Cải thiện hiển thị lỗi cho giáo viên

#### 2.1 Hiển thị lỗi rõ ràng khi giáo viên không có quyền

**File:** `frontend/src/pages/instructor/assignments/submissions/index.tsx` (dòng 147-149)

Thay đổi catch block từ:

```typescript
catch (err) {
  return { data: [], total: 0, success: false };
}
```

Thành:

```typescript
catch (err: any) {
  const statusCode = err?.response?.status || err?.status;
  if (statusCode === 403) {
    message.error('Bạn không có quyền xem bài nộp của khóa học này');
  } else {
    message.error('Không thể tải danh sách bài nộp');
  }
  return { data: [], total: 0, success: false };
}
```

`message` đã được import từ antd ở dòng 3.

#### 2.2 Hiển thị trạng thái trống có ý nghĩa

**File:** `frontend/src/pages/instructor/assignments/submissions/index.tsx`

ProTable hiện tại không có prop `locale` để tùy chỉnh text trống. Sử dụng cách thêm `tableRender` hoặc `emptyText` trong request:

Trong hàm request (sau dòng 146), khi trả về data rỗng:

```typescript
return {
  data: res.data || [],
  total: res.pagination?.total || 0,
  success: true,
};
```

Thêm prop `rowKey="id"` đã có. Thêm prop `locale` cho ProTable:

```tsx
<ProTable<Submission>
  headerTitle="Danh sách bài nộp"
  // ... existing props ...
  tableAlertRender={false}
  search={false}
  options={false}
/>
```

Hoặc đơn giản hơn: hiển thị `Empty` component khi bảng trống bằng cách kiểm tra `dataSource` sau khi load xong. Tuy nhiên, cách tốt hơn là để ProTable tự xử lý với message rõ ràng qua prop `locale`:

```tsx
<ProTable<Submission>
  locale={{
    emptyText: <Empty description="Chưa có học sinh nào nộp bài tập này" />,
  }}
  // ... rest of props
/>
```

---

### Phần 3: Seed thêm submission mẫu

#### 3.1 Cập nhật course-seeder.ts

**File:** `backend/src/seeders/course-seeder.ts` (sau dòng 229)

Thêm submissions mới sau submission hiện có:

```typescript
// Thêm submission cho quiz - student2 (graded)
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

// Thêm submission cho quiz - student3 (submitted, chưa chấm)
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

// Thêm submission cho essay - student2 (graded)
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

// Thêm submission cho upload - student1 (submitted)
await Submission.create({
  assignment_id: uploadAssignment.id,
  user_id: student1.id,
  attempt_number: 1,
  answers: { file_url: '/uploads/project-student1.zip', file_name: 'project-student1.zip' },
  status: 'submitted',
  submitted_at: new Date(),
});

// Thêm submission cho upload - student2 (graded)
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

#### 3.2 Cập nhật log count

**File:** `backend/src/seeders/course-seeder.ts` (dòng 242)

Thay đổi:
```typescript
console.log(`Submissions: 2`);
```

Thành:
```typescript
console.log(`Submissions: 7`);
```

#### 3.3 Cập nhật database SQL dump

**File:** `database/eduvi_lms.sql`

Thêm 5 rows mới vào bảng `submissions` tương ứng với dữ liệu seed phía trên. Cần đảm bảo UUID format và foreign key references hợp lệ.

---

## Bảng tổng hợp thay đổi

| # | File | Thay đổi | Vấn đề |
|---|---|---|---|
| 1 | `frontend/config/routes.ts` | Thêm route `/courses` vào nhóm student | Học sinh điều hướng |
| 2 | `frontend/src/pages/student/dashboard/index.tsx` | Thêm banner "Tìm khóa học" | Học sinh điều hướng |
| 3 | `frontend/src/pages/student/my-courses/index.tsx` | Thêm nút "Khám phá khóa học" vào Empty state | Học sinh điều hướng |
| 4 | `frontend/src/pages/instructor/assignments/submissions/index.tsx` | Hiển thị lỗi 403 rõ ràng | Giáo viên xem bài nộp |
| 5 | `frontend/src/pages/instructor/assignments/submissions/index.tsx` | Hiển thị Empty khi bảng trống | Giáo viên xem bài nộp |
| 6 | `backend/src/seeders/course-seeder.ts` | Thêm 5 submission mẫu | Giáo viên xem bài nộp |
| 7 | `database/eduvi_lms.sql` | Thêm 5 rows vào bảng submissions | Giáo viên xem bài nộp |

---

## Kết quả mong đợi

### Học sinh
- Sidebar hiện mục "📚 Danh sách khóa học" → bấm vào → thấy danh sách khóa học → đăng ký
- Dashboard có banner nổi bật dẫn đến trang khóa học
- Trang "Khóa học của tôi" khi trống có nút "Khám phá khóa học"

### Giáo viên (binhtt - phụ trách Node.js, MySQL)
| Bài tập | Loại | Số bài nộp hiện |
|---|---|---|
| Ôn tập chương 1 | Quiz | 3 (2 graded + 1 submitted) |
| Project cuối khóa | Upload | 2 (1 graded + 1 submitted) |

### Giáo viên (hongvt - phụ trách Express)
| Bài tập | Loại | Số bài nộp hiện |
|---|---|---|
| Express Middleware | Essay | 2 (1 graded + 1 submitted) |

### Khi giáo viên xem bài nộp của khóa học không phụ trách
- Hiển thị thông báo lỗi: "Bạn không có quyền xem bài nộp của khóa học này"
- Bảng vẫn hiện (trống) nhưng giáo viên hiểu lý do
