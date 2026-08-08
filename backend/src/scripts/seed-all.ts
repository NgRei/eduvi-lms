/**
 * Seed script tổng hợp — Toàn bộ 19 bảng
 * Chạy: npx ts-node src/scripts/seed-all.ts
 * Chạy với --force để xóa dữ liệu cũ trước khi seed
 */

import bcrypt from 'bcryptjs';
import { sequelize } from '../config/database';
import {
  User, StudentProfile, InstructorProfile,
  Category, Course, CourseInstructor, Lesson, CourseMaterial,
  Video, Enrollment, LessonProgress,
  Assignment, QuizQuestion, Submission,
  Certificate, UserCertificate, CourseReview, AuditLog
} from '../models';

// ============================================================
// DATA CONSTANTS
// ============================================================

const COMMON_PASSWORD = 'ant.design';

const STUDENTS_DATA = [
  { email: 'annv@gmail.com',     username: 'annv',       full_name: 'Nguyễn Văn An',     school: 'Đại học Công nghệ Thông tin', grade: 'Năm 3' },
  { email: 'cuonglh@gmail.com',  username: 'cuonglh@441', full_name: 'Lê Hoàng Cường',    school: 'Đại học Bách Khoa',          grade: 'Năm 2' },
  { email: 'ducpm@gmail.com',    username: 'ducpm@782',  full_name: 'Phạm Minh Đức',      school: 'Đại học KHTN',               grade: 'Năm 4' },
  { email: 'hangntt@gmail.com',  username: 'hangntt',    full_name: 'Nguyễn Thị Thu Hằng', school: 'Đại học Sư phạm',           grade: 'Năm 3' },
  { email: 'longnv@gmail.com',   username: 'longnv',     full_name: 'Nguyễn Việt Long',    school: 'Đại học Bách Khoa',          grade: 'Năm 1' },
];

const INSTRUCTORS_DATA = [
  { email: 'binhtt@gmail.com',   username: 'binhtt',       full_name: 'TS. Trần Thị Bình',  expertise: 'Lập trình NodeJS, Kiến trúc MVC, Microservices', years: 8, degree: 'Tiến sĩ' },
  { email: 'hongvt@gmail.com',   username: 'hongvt@921',   full_name: 'ThS. Vũ Thị Hồng',   expertise: 'Hệ quản trị CSDL MySQL, PostgreSQL, DevOps cơ bản', years: 4, degree: 'Thạc sĩ' },
];

const CATEGORIES_DATA = [
  { name: 'Lập trình Backend',   slug: 'lap-trinh-backend',   sort_order: 1 },
  { name: 'Cơ sở dữ liệu',      slug: 'co-so-du-lieu',       sort_order: 2 },
  { name: 'Lập trình Web',       slug: 'lap-trinh-web',       sort_order: 3 },
];

const COURSES_DATA = [
  {
    catIndex: 0, title: 'Lập trình Node.js thực chiến từ Zero đến Hero',
    slug: 'lap-trinh-node-js-thuc-chien',
    short_desc: 'Khóa học Node.js toàn diện nhất giúp bạn làm chủ backend.',
    description: '<h2>Nội dung khóa học</h2><p>Học viên sẽ được học qua MVC, Express routing, bảo mật JWT và cơ sở dữ liệu quan hệ.</p>',
    price: 599000, level: 'all' as const, total_lessons: 5,
  },
  {
    catIndex: 0, title: 'Xây dựng RESTful API với Express và TypeScript',
    slug: 'xay-dung-restful-api',
    short_desc: 'Tìm hiểu cấu trúc API chuẩn doanh nghiệp, validation và kiểu dữ liệu strict.',
    description: '<p>Làm chủ Express Router và tích hợp TypeScript cho kiến trúc dự án bền vững.</p>',
    price: 350000, level: 'intermediate' as const, total_lessons: 3,
  },
  {
    catIndex: 1, title: 'Cơ sở dữ liệu MySQL nâng cao cho Lập trình viên',
    slug: 'mysql-nang-cao',
    short_desc: 'Tối ưu truy vấn, thiết kế Index và xử lý transaction.',
    description: '<p>Phù hợp với lập trình viên backend muốn tối ưu hóa database.</p>',
    price: 290000, level: 'advanced' as const, total_lessons: 3,
  },
];

const LESSONS_DATA = [
  // Course 0: Node.js (5 lessons)
  { course: 0, title: 'Bài 1: Giới thiệu kiến trúc Runtime Node.js',     order: 1, type: 'video' as const, preview: true,  url: 'https://www.youtube.com/watch?v=MVC1' },
  { course: 0, title: 'Bài 2: Hướng dẫn cài đặt NPM và Node Module',     order: 2, type: 'video' as const, preview: false, url: 'https://www.youtube.com/watch?v=NPM2' },
  { course: 0, title: 'Bài 3: Xây dựng server HTTP đầu tiên',            order: 3, type: 'video' as const, preview: false, url: 'https://www.youtube.com/watch?v=HTTP3' },
  { course: 0, title: 'Bài 4: Routing và Middleware trong Express',       order: 4, type: 'video' as const, preview: false, url: 'https://www.youtube.com/watch?v=ROUTE4' },
  { course: 0, title: 'Bài 5: Kết nối MySQL với Sequelize ORM',          order: 5, type: 'video' as const, preview: false, url: 'https://www.youtube.com/watch?v=SQL5' },
  // Course 1: Express (3 lessons)
  { course: 1, title: 'Bài 1: Khởi tạo Project Express & TypeScript',     order: 1, type: 'video' as const, preview: true,  url: 'https://www.youtube.com/watch?v=EX1' },
  { course: 1, title: 'Bài 2: Định cấu hình Middleware Express BodyParser', order: 2, type: 'video' as const, preview: false, url: 'https://www.youtube.com/watch?v=EX2' },
  { course: 1, title: 'Bài 3: Error Handling và Validation',              order: 3, type: 'video' as const, preview: false, url: 'https://www.youtube.com/watch?v=EX3' },
  // Course 2: MySQL (3 lessons)
  { course: 2, title: 'Bài 1: Khái niệm Indexes và Phân tích EXPLAIN',  order: 1, type: 'video' as const, preview: true,  url: 'https://www.youtube.com/watch?v=SQL1' },
  { course: 2, title: 'Bài 2: Cách tối ưu hóa JOIN nhiều bảng',          order: 2, type: 'video' as const, preview: false, url: 'https://www.youtube.com/watch?v=SQL2' },
  { course: 2, title: 'Bài 3: Transaction và Stored Procedures',          order: 3, type: 'video' as const, preview: false, url: 'https://www.youtube.com/watch?v=SQL3' },
];

const QUIZ_QUESTIONS_DATA = [
  // Quiz for Node.js course
  {
    course: 0, lesson: 2, // Bài 3
    title: 'Bài trắc nghiệm ôn tập chương Node.js cơ bản',
    description: 'Kiểm tra kiến thức cơ bản về HTTP Server và NodeJS Architecture',
    questions: [
      {
        text: 'Kiến trúc chạy (Runtime) của Node.js là đơn luồng hay đa luồng?',
        type: 'single' as const,
        options: [
          { id: 'A', text: 'Hoàn toàn Đơn luồng', is_correct: true },
          { id: 'B', text: 'Hoàn toàn Đa luồng', is_correct: false },
          { id: 'C', text: 'Chạy đơn luồng JS engine nhưng đa luồng xử lý IO', is_correct: false },
        ],
        explanation: 'Node.js hoạt động dựa trên cơ chế đơn luồng (Single-thread event loop) để thông dịch JavaScript.',
        points: 5,
      },
      {
        text: 'Thư viện nào cung cấp nhân ThreadPool xử lý bất đồng bộ trong Node.js?',
        type: 'single' as const,
        options: [
          { id: 'A', text: 'V8 Engine', is_correct: false },
          { id: 'B', text: 'libuv', is_correct: true },
          { id: 'C', text: 'OpenSSL', is_correct: false },
        ],
        explanation: 'Thư viện C++ libuv cung cấp cơ chế Event Loop và Thread Pool 4 luồng mặc định cho Node.js.',
        points: 5,
      },
    ],
  },
  // Quiz for Express course
  {
    course: 1, lesson: 2, // Bài 3
    title: 'Bài trắc nghiệm Express & TypeScript',
    description: 'Kiểm tra kiến thức về Express middleware và TypeScript',
    questions: [
      {
        text: 'Thứ tự thực thi middleware trong Express được xác định bởi gì?',
        type: 'single' as const,
        options: [
          { id: 'A', text: 'Tên middleware', is_correct: false },
          { id: 'B', text: 'Thứ tự đăng ký (app.use)', is_correct: true },
          { id: 'C', text: 'Loại HTTP method', is_correct: false },
        ],
        explanation: 'Express thực thi middleware theo thứ tự đăng ký bằng app.use() hoặc router.use().',
        points: 5,
      },
      {
        text: 'Trong TypeScript, kiểu nào dùng để định nghĩa object không có thuộc tính cụ thể?',
        type: 'single' as const,
        options: [
          { id: 'A', text: 'interface', is_correct: false },
          { id: 'B', text: 'Record<string, any>', is_correct: true },
          { id: 'C', text: 'enum', is_correct: false },
        ],
        explanation: 'Record<string, any> tạo ra một object type với key là string và value là bất kỳ kiểu nào.',
        points: 5,
      },
    ],
  },
  // Quiz for MySQL course
  {
    course: 2, lesson: 2, // Bài 3
    title: 'Bài trắc nghiệm MySQL nâng cao',
    description: 'Kiểm tra kiến thức về Index, EXPLAIN và Transaction',
    questions: [
      {
        text: 'Loại index nào phù hợp cho truy vấn tìm kiếm chuỗi ký tự?',
        type: 'single' as const,
        options: [
          { id: 'A', text: 'B-Tree Index', is_correct: false },
          { id: 'B', text: 'FULLTEXT Index', is_correct: true },
          { id: 'C', text: 'Hash Index', is_correct: false },
        ],
        explanation: 'FULLTEXT Index hỗ trợ tìm kiếm chuỗi ký tự hiệu quả với MATCH...AGAINST.',
        points: 5,
      },
      {
        text: 'ACID trong transaction bao gồm những thuộc tính nào?',
        type: 'multiple' as const,
        options: [
          { id: 'A', text: 'Atomicity', is_correct: true },
          { id: 'B', text: 'Consistency', is_correct: true },
          { id: 'C', text: 'Isolation', is_correct: true },
          { id: 'D', text: 'Durability', is_correct: true },
        ],
        explanation: 'ACID = Atomicity, Consistency, Isolation, Durability — 4 thuộc tính cơ bản của transaction.',
        points: 5,
      },
    ],
  },
];

const REVIEW_COMMENTS = [
  'Khóa học rất hay và bổ ích, giảng viên dạy dễ hiểu.',
  'Nội dung đầy đủ, phù hợp cho người mới bắt đầu.',
  'Khóa học tốt, nhưng cần thêm bài tập thực hành.',
  'Giảng viên nhiệt tình, giải đáp thắc mắc nhanh.',
  'Nội dung cập nhật, phù hợp với thực tế.',
  'Khóa học rất chi tiết, tôi đã học được nhiều kiến thức mới.',
  'Giảng viên giải thích rõ ràng, dễ hiểu cho người mới.',
  'Nội dung hay nhưng video hơi dài, nên chia nhỏ hơn.',
];

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateCertCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'CERT-';
  for (let i = 0; i < 12; i++) {
    if (i === 4 || i === 8) code += '-';
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ============================================================
// MAIN SEED FUNCTION
// ============================================================

async function seedAll() {
  const isForce = process.argv.includes('--force');

  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database.\n');

    // Drop all tables if --force
    if (isForce) {
      console.log('⚠️  --force flag detected. Dropping all tables...');
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');
      const [tables] = await sequelize.query('SHOW TABLES;');
      for (const table of tables as any[]) {
        const tableName = Object.values(table)[0];
        await sequelize.query(`DROP TABLE IF EXISTS \`${tableName}\`;`);
      }
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');
      console.log('   All tables dropped.\n');
    }

    // Sync all models
    await sequelize.sync({ force: false });
    console.log('✅ Tables synced.\n');

    const salt = await bcrypt.genSalt(10);
    const commonHash = await bcrypt.hash(COMMON_PASSWORD, salt);

    // ========================================================
    // 1. USERS + PROFILES
    // ========================================================
    console.log('━━━ 1. Seeding Users & Profiles ━━━');

    // Admin
    const admin = await User.create({
      email: 'admin@eduvi.com', username: 'sysadmin',
      password_hash: commonHash, full_name: 'Quản trị viên Hệ thống',
      user_type: 'admin', is_active: true,
    });
    console.log(`  ✓ Admin: admin@eduvi.com / ${COMMON_PASSWORD}`);

    // Instructors
    const instructors: User[] = [];
    for (const data of INSTRUCTORS_DATA) {
      const user = await User.create({
        email: data.email, username: data.username,
        password_hash: commonHash, full_name: data.full_name,
        user_type: 'instructor', is_active: true,
      });
      await InstructorProfile.create({
        user_id: user.id, expertise: data.expertise,
        experience_years: data.years, degree: data.degree,
      });
      instructors.push(user);
      console.log(`  ✓ Instructor: ${data.email} / ${COMMON_PASSWORD}`);
    }

    // Students
    const students: User[] = [];
    for (const data of STUDENTS_DATA) {
      const user = await User.create({
        email: data.email, username: data.username,
        password_hash: commonHash, full_name: data.full_name,
        user_type: 'student', is_active: true,
      });
      await StudentProfile.create({
        user_id: user.id, school_name: data.school, grade_level: data.grade,
      });
      students.push(user);
      console.log(`  ✓ Student: ${data.email} / ${COMMON_PASSWORD}`);
    }

    console.log(`  → Total: 1 admin + ${instructors.length} instructors + ${students.length} students\n`);

    // ========================================================
    // 2. CATEGORIES
    // ========================================================
    console.log('━━━ 2. Seeding Categories ━━━');
    const categories: Category[] = [];
    for (const data of CATEGORIES_DATA) {
      const cat = await Category.create(data);
      categories.push(cat);
      console.log(`  ✓ ${data.name}`);
    }
    console.log('');

    // ========================================================
    // 3. COURSES + COURSE INSTRUCTORS
    // ========================================================
    console.log('━━━ 3. Seeding Courses & Instructors ━━━');
    const courses: Course[] = [];
    for (let i = 0; i < COURSES_DATA.length; i++) {
      const data = COURSES_DATA[i];
      const course = await Course.create({
        category_id: categories[data.catIndex].id,
        title: data.title, slug: data.slug,
        short_description: data.short_desc, description: data.description,
        price: data.price, target_level: data.level,
        is_published: true, published_at: new Date(),
        total_lessons: data.total_lessons, total_students: 0,
        rating_avg: 0,
      });
      courses.push(course);

      // Assign instructor
      const instructor = instructors[i % instructors.length];
      await CourseInstructor.create({
        course_id: course.id, instructor_id: instructor.id, is_primary: true,
      });
      console.log(`  ✓ "${data.title}" → GV: ${instructor.full_name}`);
    }
    console.log('');

    // ========================================================
    // 4. LESSONS + COURSE MATERIALS
    // ========================================================
    console.log('━━━ 4. Seeding Lessons & Materials ━━━');
    const lessons: Lesson[] = [];
    for (const data of LESSONS_DATA) {
      const lesson = await Lesson.create({
        course_id: courses[data.course].id,
        title: data.title, sort_order: data.order,
        lesson_type: data.type, content_url: data.url,
        is_preview: data.preview, is_published: true,
      });
      lessons.push(lesson);
    }
    console.log(`  ✓ ${lessons.length} lessons created`);

    // Course materials
    const materialsData = [
      { course: 0, lesson: 0, title: 'Slide giới thiệu Node.js',   type: 'slide' as const, url: '/materials/nodejs-intro.pdf' },
      { course: 0, lesson: 1, title: 'Tài liệu NPM cơ bản',        type: 'pdf' as const,   url: '/materials/npm-guide.pdf' },
      { course: 1, lesson: 5, title: 'Slide Express TypeScript',    type: 'slide' as const, url: '/materials/express-ts.pdf' },
      { course: 2, lesson: 8, title: 'Bài tập thực hành Index',     type: 'pdf' as const,   url: '/materials/index-exercises.pdf' },
    ];
    for (const m of materialsData) {
      await CourseMaterial.create({
        course_id: courses[m.course].id,
        lesson_id: lessons[m.lesson].id,
        title: m.title, material_type: m.type, file_url: m.url,
      });
    }
    console.log(`  ✓ ${materialsData.length} course materials created\n`);

    // ========================================================
    // 5. ENROLLMENTS + LESSON PROGRESS
    // ========================================================
    console.log('━━━ 5. Seeding Enrollments & Lesson Progress ━━━');

    // Enrollment patterns: student 0,1 enroll all 3 courses; student 2,3 enroll 2; student 4 enroll 1
    const enrollmentConfigs = [
      { student: 0, course: 0, status: 'active' as const,     progress: 80 },
      { student: 0, course: 1, status: 'active' as const,     progress: 66.67 },
      { student: 0, course: 2, status: 'completed' as const,  progress: 100 },
      { student: 1, course: 0, status: 'active' as const,     progress: 60 },
      { student: 1, course: 1, status: 'active' as const,     progress: 33.33 },
      { student: 1, course: 2, status: 'completed' as const,  progress: 100 },
      { student: 2, course: 0, status: 'active' as const,     progress: 40 },
      { student: 2, course: 2, status: 'active' as const,     progress: 33.33 },
      { student: 3, course: 0, status: 'dropped' as const,    progress: 20 },
      { student: 3, course: 1, status: 'active' as const,     progress: 0 },
      { student: 4, course: 0, status: 'active' as const,     progress: 0 },
    ];

    const enrollments: Enrollment[] = [];
    for (const cfg of enrollmentConfigs) {
      const enrollment = await Enrollment.create({
        user_id: students[cfg.student].id,
        course_id: courses[cfg.course].id,
        status: cfg.status,
        progress_percentage: cfg.progress,
        enrolled_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random within 30 days
        completed_at: cfg.status === 'completed' ? new Date() : null,
      });
      enrollments.push(enrollment);
    }
    console.log(`  ✓ ${enrollments.length} enrollments created`);

    // Lesson progress — mark lessons as completed based on enrollment progress
    let progressCount = 0;
    for (const cfg of enrollmentConfigs) {
      if (cfg.progress === 0) continue;
      const courseLessons = lessons.filter(l => l.course_id === courses[cfg.course].id);
      const completedCount = Math.ceil((cfg.progress / 100) * courseLessons.length);
      for (let i = 0; i < completedCount && i < courseLessons.length; i++) {
        await LessonProgress.create({
          user_id: students[cfg.student].id,
          lesson_id: courseLessons[i].id,
          course_id: courses[cfg.course].id,
          is_completed: true,
          watch_duration: Math.floor(Math.random() * 1800) + 300, // 5-35 minutes
          last_position: Math.floor(Math.random() * 1800) + 300,
          completed_at: new Date(),
        });
        progressCount++;
      }
    }
    console.log(`  ✓ ${progressCount} lesson progress records created\n`);

    // Update total_students for each course
    for (let i = 0; i < courses.length; i++) {
      const count = enrollmentConfigs.filter(c => c.course === i).length;
      await courses[i].update({ total_students: count });
    }

    // ========================================================
    // 6. ASSIGNMENTS + QUIZ QUESTIONS
    // ========================================================
    console.log('━━━ 6. Seeding Assignments & Quiz Questions ━━━');

    const createdAssignments: Assignment[] = [];

    for (const quizData of QUIZ_QUESTIONS_DATA) {
      const assignment = await Assignment.create({
        course_id: courses[quizData.course].id,
        lesson_id: lessons[quizData.lesson].id,
        title: quizData.title,
        description: quizData.description,
        assignment_type: 'quiz',
        total_points: quizData.questions.reduce((sum, q) => sum + q.points, 0),
        passing_score: 50,
        attempts_allowed: 2,
        show_answer_after: true,
        is_published: true,
      });
      createdAssignments.push(assignment);

      for (let qi = 0; qi < quizData.questions.length; qi++) {
        const q = quizData.questions[qi];
        await QuizQuestion.create({
          assignment_id: assignment.id,
          question_text: q.text,
          question_type: q.type,
          options: q.options,
          explanation: q.explanation,
          points: q.points,
          sort_order: qi + 1,
        });
      }
    }
    console.log(`  ✓ ${createdAssignments.length} quiz assignments created`);
    console.log(`  ✓ ${QUIZ_QUESTIONS_DATA.reduce((sum, q) => sum + q.questions.length, 0)} quiz questions created`);

    // Essay assignment
    const essayAssignment = await Assignment.create({
      course_id: courses[1].id,
      lesson_id: lessons[6].id, // Bài 2 Express
      title: 'Bài luận về Express Middleware',
      description: 'Viết bài luận giải thích cách middleware hoạt động trong Express.js',
      assignment_type: 'essay',
      total_points: 100, passing_score: 60,
      attempts_allowed: 1, is_published: true,
    });
    createdAssignments.push(essayAssignment);
    console.log(`  ✓ 1 essay assignment created`);

    // Upload assignment
    const uploadAssignment = await Assignment.create({
      course_id: courses[0].id,
      lesson_id: lessons[4].id, // Bài 5 Node.js
      title: 'Bài nộp project cuối khóa',
      description: 'Upload file source code project cuối khóa Node.js',
      assignment_type: 'upload',
      total_points: 100, passing_score: 50,
      attempts_allowed: 1, is_published: true,
    });
    createdAssignments.push(uploadAssignment);
    console.log(`  ✓ 1 upload assignment created\n`);

    // ========================================================
    // 7. SUBMISSIONS
    // ========================================================
    console.log('━━━ 7. Seeding Submissions ━━━');

    // Quiz submissions
    const quizSubmissions = [
      { assign: 0, student: 0, answers: [{ question_id: 'q1', selected: ['A'] }, { question_id: 'q2', selected: ['B'] }], score: 10, status: 'graded' as const },
      { assign: 0, student: 1, answers: [{ question_id: 'q1', selected: ['C'] }, { question_id: 'q2', selected: ['B'] }], score: 5, status: 'graded' as const },
      { assign: 0, student: 2, answers: [{ question_id: 'q1', selected: ['A'] }, { question_id: 'q2', selected: ['B'] }], score: null, status: 'submitted' as const },
      { assign: 1, student: 0, answers: [{ question_id: 'q3', selected: ['B'] }, { question_id: 'q4', selected: ['B'] }], score: 10, status: 'graded' as const },
      { assign: 2, student: 1, answers: [{ question_id: 'q5', selected: ['B'] }, { question_id: 'q6', selected: ['A', 'B', 'C', 'D'] }], score: 10, status: 'graded' as const },
    ];

    let subCount = 0;
    for (const sub of quizSubmissions) {
      await Submission.create({
        assignment_id: createdAssignments[sub.assign].id,
        user_id: students[sub.student].id,
        attempt_number: 1, answers: sub.answers,
        score: sub.score, status: sub.status,
        submitted_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      });
      subCount++;
    }

    // Essay submissions
    await Submission.create({
      assignment_id: essayAssignment.id,
      user_id: students[0].id, attempt_number: 1,
      answers: { text: 'Middleware trong Express.js là các hàm có thể truy cập vào đối tượng request, response và hàm next. Middleware được sử dụng để xử lý các tác vụ như xác thực, logging, parse body request, xử lý lỗi.' },
      score: 80, status: 'graded', feedback: 'Bài viết tốt, cần bổ sung thêm ví dụ code.',
      submitted_at: new Date(),
    });
    subCount++;

    await Submission.create({
      assignment_id: essayAssignment.id,
      user_id: students[1].id, attempt_number: 1,
      answers: { text: 'Express middleware là functions xử lý request theo thứ tự đăng ký. Chúng có thể modify request/response, gọi next() để chuyển tiếp, hoặc trả về response.' },
      score: 75, status: 'graded', feedback: 'Cần mở rộng thêm nội dung.',
      submitted_at: new Date(),
    });
    subCount++;

    // Upload submissions
    await Submission.create({
      assignment_id: uploadAssignment.id,
      user_id: students[0].id, attempt_number: 1,
      answers: { file_url: '/uploads/project-student1.zip', file_name: 'project-student1.zip' },
      score: 85, status: 'graded', feedback: 'Project tốt, code sạch sẽ.',
      submitted_at: new Date(),
    });
    subCount++;

    await Submission.create({
      assignment_id: uploadAssignment.id,
      user_id: students[1].id, attempt_number: 1,
      answers: { file_url: '/uploads/project-student2.zip', file_name: 'project-student2.zip' },
      status: 'submitted',
      submitted_at: new Date(),
    });
    subCount++;

    console.log(`  ✓ ${subCount} submissions created\n`);

    // ========================================================
    // 8. CERTIFICATES + USER CERTIFICATES
    // ========================================================
    console.log('━━━ 8. Seeding Certificates & User Certificates ━━━');

    // Create certificate templates for all courses
    const certificates: Certificate[] = [];
    for (const course of courses) {
      const cert = await Certificate.create({
        course_id: course.id,
        title: `Chứng chỉ hoàn thành: ${course.title}`,
        description: `Xác nhận đã hoàn thành khóa học "${course.title}" trên hệ thống EduVi LMS`,
      });
      certificates.push(cert);
    }
    console.log(`  ✓ ${certificates.length} certificate templates created`);

    // Issue certificates for completed enrollments
    let certCount = 0;
    for (const enrollment of enrollments) {
      if (enrollment.status === 'completed') {
        const cert = certificates.find(c => c.course_id === enrollment.course_id);
        if (cert) {
          await UserCertificate.create({
            user_id: enrollment.user_id,
            certificate_id: cert.id,
            course_id: enrollment.course_id,
            cert_code: generateCertCode(),
            issued_at: new Date(),
          });
          await enrollment.update({ certificate_issued: true });
          certCount++;
        }
      }
    }
    console.log(`  ✓ ${certCount} certificates issued to students\n`);

    // ========================================================
    // 9. COURSE REVIEWS
    // ========================================================
    console.log('━━━ 9. Seeding Course Reviews ━━━');

    let reviewCount = 0;
    for (let ci = 0; ci < courses.length; ci++) {
      // Each course gets 3-5 reviews from random students
      const reviewers = [...students].sort(() => 0.5 - Math.random()).slice(0, 3 + Math.floor(Math.random() * 3));
      for (const student of reviewers) {
        await CourseReview.create({
          course_id: courses[ci].id,
          user_id: student.id,
          rating: 3 + Math.floor(Math.random() * 3), // 3-5 stars
          comment: pickRandom(REVIEW_COMMENTS),
        });
        reviewCount++;
      }
    }
    console.log(`  ✓ ${reviewCount} course reviews created`);

    // Update rating_avg for all courses
    const { fn, col } = require('sequelize');
    for (const course of courses) {
      const result = await CourseReview.findOne({
        where: { course_id: course.id, is_visible: true },
        attributes: [[fn('AVG', col('rating')), 'avgRating']],
        raw: true,
      }) as any;
      const avgRating = result?.avgRating ? parseFloat(parseFloat(result.avgRating).toFixed(2)) : 0;
      await course.update({ rating_avg: avgRating });
    }
    console.log('  ✓ Updated rating_avg for all courses\n');

    // ========================================================
    // 10. AUDIT LOGS
    // ========================================================
    console.log('━━━ 10. Seeding Audit Logs ━━━');

    const auditEntries = [
      // Login logs
      ...students.slice(0, 4).map(s => ({ user_id: s.id, action: 'login', entity_type: 'user', entity_id: s.id })),
      ...instructors.map(i => ({ user_id: i.id, action: 'login', entity_type: 'user', entity_id: i.id })),
      { user_id: admin.id, action: 'login', entity_type: 'user', entity_id: admin.id },
      // Enroll logs
      ...enrollmentConfigs.slice(0, 6).map(e => ({
        user_id: students[e.student].id, action: 'enroll',
        entity_type: 'enrollment', entity_id: courses[e.course].id,
      })),
      // Cert issued logs
      ...enrollments.filter(e => e.status === 'completed').map(e => ({
        user_id: e.user_id, action: 'cert_issued',
        entity_type: 'user_certificate', entity_id: e.course_id,
      })),
    ];

    for (const entry of auditEntries) {
      await AuditLog.create({
        ...entry,
        detail: { seeded: true, timestamp: new Date().toISOString() },
        ip_address: '127.0.0.1',
      });
    }
    console.log(`  ✓ ${auditEntries.length} audit log entries created\n`);

    // ========================================================
    // SUMMARY
    // ========================================================
    const totalUsers = 1 + instructors.length + students.length;
    const totalQuizQuestions = QUIZ_QUESTIONS_DATA.reduce((s, q) => s + q.questions.length, 0);

    console.log('\n=========================================');
    console.log('  EduVi LMS - Seed completed!');
    console.log('=========================================');
    console.log(`  Users:             ${totalUsers}  (1 admin + ${instructors.length} GV + ${students.length} HV)`);
    console.log(`  Categories:        ${categories.length}`);
    console.log(`  Courses:           ${courses.length}`);
    console.log(`  Lessons:           ${lessons.length}`);
    console.log(`  Course Materials:  ${materialsData.length}`);
    console.log(`  Enrollments:       ${enrollments.length}`);
    console.log(`  Lesson Progress:   ${progressCount}`);
    console.log(`  Assignments:       ${createdAssignments.length}  (${QUIZ_QUESTIONS_DATA.length} quiz + 1 essay + 1 upload)`);
    console.log(`  Quiz Questions:    ${totalQuizQuestions}`);
    console.log(`  Submissions:       ${subCount}`);
    console.log(`  Certificates:      ${certificates.length}  templates`);
    console.log(`  User Certificates: ${certCount}  issued`);
    console.log(`  Course Reviews:    ${reviewCount}`);
    console.log(`  Audit Logs:        ${auditEntries.length}`);
    console.log('=========================================');
    console.log('  Login accounts:');
    console.log('    admin@eduvi.com / ant.design');
    console.log('    binhtt@gmail.com / ant.design');
    console.log('    annv@gmail.com / ant.design');
    console.log('=========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seed error:', error);
    process.exit(1);
  }
}

seedAll();
