/**
 * @name Umi Routing Configuration for Eduvi LMS
 * Maps portals for Student, Instructor, and Admin roles.
 */
export default [
  {
    path: '/user',
    layout: false,
    routes: [
      {
        path: '/user/login',
        name: 'Đăng nhập',
        component: './user/login',
      },
      {
        path: '/user/register',
        name: 'Đăng ký',
        component: './user/register',
      },
      {
        path: '/user/register-result',
        name: 'Đăng ký thành công',
        component: './user/register-result',
      },
      {
        path: '/user/forgot-password',
        name: 'Quên mật khẩu',
        component: './user/forgot-password',
      },
      {
        path: '/user/reset-password',
        name: 'Đặt lại mật khẩu',
        component: './user/reset-password',
      },
      {
        path: '/user',
        redirect: '/user/login',
      },
    ],
  },
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
  // ================= TEACH / BECOME INSTRUCTOR (Public / Dedicated Candidate Portal) =================
  {
    path: '/teach',
    name: 'Trở thành Giảng viên',
    component: './student/become-instructor',
    layout: false,
  },
  {
    path: '/become-instructor',
    redirect: '/teach',
  },
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
        path: '/student/payments',
        name: 'Lịch sử thanh toán',
        icon: 'credit-card',
        component: './student/payments',
      },
      {
        path: '/student/courses',
        name: 'Danh sách khóa học',
        icon: 'search',
        redirect: '/courses',
      },
      {
        path: '/student/courses/:courseId/lessons/:lessonId',
        name: 'Xem bài giảng',
        component: './student/lesson-view',
        hideInMenu: true,
      },
      {
        path: '/student/courses/:courseId/completion',
        name: 'Hoàn thành khóa học',
        component: './student/my-courses/completion',
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
      {
        path: '/student/certificates',
        name: 'Chứng chỉ',
        icon: 'safety-certificate',
        component: './student/certificates',
      },
      {
        path: '/student/become-instructor',
        name: 'Trở thành Giảng viên',
        icon: 'solution',
        component: './student/become-instructor',
      },
    ],
  },
  // ================= INSTRUCTOR PORTAL =================
  {
    path: '/instructor',
    name: 'Giảng viên',
    icon: 'crown',
    access: 'canInstructor',
    routes: [
      {
        path: '/instructor',
        redirect: '/instructor/dashboard',
      },
      {
        path: '/instructor/dashboard',
        name: 'Tổng quan giảng dạy',
        icon: 'dashboard',
        component: './instructor/dashboard',
      },
      {
        path: '/instructor/courses',
        name: 'Quản lý khóa học',
        icon: 'table',
        component: './instructor/courses',
      },
      {
        path: '/instructor/payments',
        name: 'Doanh thu & Giao dịch',
        icon: 'dollar',
        component: './instructor/payments',
      },
      {
        path: '/instructor/courses/create',
        name: 'Tạo khóa học mới',
        component: './instructor/courses/create',
        hideInMenu: true,
      },
      {
        path: '/instructor/courses/:id/edit',
        name: 'Chỉnh sửa khóa học',
        component: './instructor/courses/edit',
        hideInMenu: true,
      },
      {
        path: '/instructor/assignments',
        name: 'Quản lý bài tập',
        icon: 'FileText',
        component: './instructor/assignments',
      },
      {
        path: '/instructor/assignments/create',
        name: 'Tạo bài tập',
        component: './instructor/assignments/create',
        hideInMenu: true,
      },
      {
        path: '/instructor/assignments/:id/edit',
        name: 'Chỉnh sửa bài tập',
        component: './instructor/assignments/edit',
        hideInMenu: true,
      },
      {
        path: '/instructor/assignments/:id/submissions',
        name: 'Bài nộp',
        component: './instructor/assignments/submissions',
        hideInMenu: true,
      },
    ],
  },
  // ================= ADMIN PORTAL =================
  {
    path: '/admin',
    name: 'Quản trị viên',
    icon: 'setting',
    access: 'canAdmin',
    routes: [
      {
        path: '/admin',
        redirect: '/admin/dashboard',
      },
      {
        path: '/admin/dashboard',
        name: 'Báo cáo hệ thống',
        icon: 'dashboard',
        component: './admin/dashboard',
      },
      {
        path: '/admin/payments',
        name: 'Quản lý giao dịch & Doanh thu',
        icon: 'pay-circle',
        component: './admin/payments',
      },
      {
        path: '/admin/users',
        name: 'Quản lý người dùng',
        icon: 'team',
        component: './admin/users',
      },
      {
        path: '/admin/audit-logs',
        name: 'Nhật ký hệ thống',
        icon: 'file-text',
        component: './admin/audit-logs',
      },
      {
        path: '/admin/instructor-applications',
        name: 'Duyệt hồ sơ giảng viên',
        icon: 'crown',
        component: './admin/instructor-applications',
      },
    ],
  },
  // ================= ACCOUNT SETTINGS (All roles) =================
  {
    path: '/account',
    hideInMenu: true,
    routes: [
      {
        path: '/account/settings',
        name: 'Cài đặt tài khoản',
        component: './account/settings',
      },
    ],
  },
  // ================= EXCEPTIONS & FALLBACKS =================
  {
    path: '/exception',
    name: 'Lỗi hệ thống',
    icon: 'warning',
    hideInMenu: true,
    routes: [
      {
        path: '/exception',
        redirect: '/exception/404',
      },
      {
        path: '/exception/403',
        name: '403',
        component: './exception/403',
      },
      {
        path: '/exception/404',
        name: '404',
        component: './exception/404',
      },
      {
        path: '/exception/500',
        name: '500',
        component: './exception/500',
      },
    ],
  },
  {
    path: '/',
    component: './PublicHome',
    layout: false,
  },
  {
    component: './exception/404',
    path: '/*',
  },
];
