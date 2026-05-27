import { sequelize } from '../config/database';
import { Category, Course, Lesson, CourseMaterial, CourseInstructor, Enrollment, LessonProgress, Assignment, QuizQuestion } from '../models';
import { User } from '../models';

const seedCourseData = async () => {
  try {
    console.log('Starting course data seeder...');
    
    // Connect to database
    await sequelize.authenticate();
    console.log('Database connected.');

    // Find existing users
    const instructor1 = await User.findOne({ where: { username: 'binhtt' } });
    const instructor2 = await User.findOne({ where: { username: 'hongvt@921' } });
    const student1 = await User.findOne({ where: { username: 'annv' } });
    const student2 = await User.findOne({ where: { username: 'cuonglh@441' } });
    const student3 = await User.findOne({ where: { username: 'ducpm@782' } });

    if (!instructor1 || !instructor2 || !student1 || !student2 || !student3) {
      console.error('Users not found. Please run demo-seeder first.');
      process.exit(1);
    }

    // 1. Seed Categories
    console.log('Seeding categories...');
    const categories = await Category.bulkCreate([
      { name: 'Lập trình Backend', slug: 'lap-trinh-backend', sort_order: 1 },
      { name: 'Cơ sở dữ liệu', slug: 'co-so-du-lieu', sort_order: 2 },
      { name: 'Lập trình Web', slug: 'lap-trinh-web', sort_order: 3 },
    ]);
    console.log(`- Seeded ${categories.length} categories`);

    // 2. Seed Courses
    console.log('Seeding courses...');
    const courses = await Course.bulkCreate([
      {
        category_id: categories[0].id,
        title: 'Lập trình Node.js thực chiến từ Zero đến Hero',
        slug: 'lap-trinh-node-js-thuc-chien',
        short_description: 'Khóa học Node.js toàn diện nhất giúp bạn làm chủ backend.',
        description: '<h2>Nội dung khóa học</h2><p>Học viên sẽ được học qua MVC, Express routing, bảo mật JWT và cơ sở dữ liệu quan hệ.</p>',
        thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3',
        price: 599000,
        target_level: 'all',
        is_published: true,
        published_at: new Date(),
        total_lessons: 3,
        total_students: 2,
        rating_avg: 4.8,
      },
      {
        category_id: categories[0].id,
        title: 'Xây dựng RESTful API với Express và TypeScript',
        slug: 'xay-dung-restful-api',
        short_description: 'Tìm hiểu cấu trúc API chuẩn doanh nghiệp, validation và kiểu dữ liệu strict.',
        description: '<p>Làm chủ Express Router và tích hợp TypeScript cho kiến trúc dự án bền vững.</p>',
        thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c',
        price: 350000,
        target_level: 'intermediate',
        is_published: true,
        published_at: new Date(),
        total_lessons: 2,
        total_students: 1,
        rating_avg: 4.7,
      },
      {
        category_id: categories[1].id,
        title: 'Cơ sở dữ liệu MySQL nâng cao cho Lập trình viên',
        slug: 'mysql-nang-cao',
        short_description: 'Tối ưu truy vấn, thiết kế Index và xử lý transaction.',
        description: '<p>Phù hợp với lập trình viên backend muốn tối ưu hóa database.</p>',
        thumbnail: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d',
        price: 290000,
        target_level: 'advanced',
        is_published: true,
        published_at: new Date(),
        total_lessons: 2,
        total_students: 1,
        rating_avg: 4.9,
      },
    ]);
    console.log(`- Seeded ${courses.length} courses`);

    // 3. Seed Course Instructors
    console.log('Seeding course instructors...');
    await CourseInstructor.bulkCreate([
      { course_id: courses[0].id, instructor_id: instructor1.id, is_primary: true },
      { course_id: courses[1].id, instructor_id: instructor2.id, is_primary: true },
      { course_id: courses[2].id, instructor_id: instructor1.id, is_primary: true },
    ]);
    console.log('- Seeded 3 course instructors');

    // 4. Seed Lessons
    console.log('Seeding lessons...');
    const lessons = await Lesson.bulkCreate([
      // Node.js course - 3 lessons
      { course_id: courses[0].id, title: 'Bài 1: Giới thiệu kiến trúc Runtime Node.js', sort_order: 1, lesson_type: 'video', content_url: 'https://www.youtube.com/watch?v=MVC1', is_preview: true, is_published: true },
      { course_id: courses[0].id, title: 'Bài 2: Hướng dẫn cài đặt NPM và Node Module', sort_order: 2, lesson_type: 'video', content_url: 'https://www.youtube.com/watch?v=NPM2', is_preview: false, is_published: true },
      { course_id: courses[0].id, title: 'Bài 3: Xây dựng server HTTP đầu tiên', sort_order: 3, lesson_type: 'video', content_url: 'https://www.youtube.com/watch?v=HTTP3', is_preview: false, is_published: true },
      // Express course - 2 lessons
      { course_id: courses[1].id, title: 'Bài 1: Khởi tạo Project Express & TypeScript', sort_order: 1, lesson_type: 'video', content_url: 'https://www.youtube.com/watch?v=EX1', is_preview: true, is_published: true },
      { course_id: courses[1].id, title: 'Bài 2: Định cấu hình Middleware Express BodyParser', sort_order: 2, lesson_type: 'video', content_url: 'https://www.youtube.com/watch?v=EX2', is_preview: false, is_published: true },
      // MySQL course - 2 lessons
      { course_id: courses[2].id, title: 'Bài 1: Khái niệm Indexes và Phân tích EXPLAIN Query', sort_order: 1, lesson_type: 'video', content_url: 'https://www.youtube.com/watch?v=SQL1', is_preview: true, is_published: true },
      { course_id: courses[2].id, title: 'Bài 2: Cách tối ưu hóa JOIN nhiều bảng', sort_order: 2, lesson_type: 'video', content_url: 'https://www.youtube.com/watch?v=SQL2', is_preview: false, is_published: true },
    ]);
    console.log(`- Seeded ${lessons.length} lessons`);

    // 5. Seed Enrollments
    console.log('Seeding enrollments...');
    await Enrollment.bulkCreate([
      { user_id: student1.id, course_id: courses[0].id, status: 'active', progress_percentage: 66.67 },
      { user_id: student2.id, course_id: courses[0].id, status: 'active', progress_percentage: 33.33 },
      { user_id: student1.id, course_id: courses[1].id, status: 'active', progress_percentage: 50.00 },
      { user_id: student3.id, course_id: courses[2].id, status: 'active', progress_percentage: 0.00 },
    ]);
    console.log('- Seeded 4 enrollments');

    // 6. Seed Lesson Progress
    console.log('Seeding lesson progress...');
    await LessonProgress.bulkCreate([
      { user_id: student1.id, lesson_id: lessons[0].id, course_id: courses[0].id, is_completed: true },
      { user_id: student1.id, lesson_id: lessons[1].id, course_id: courses[0].id, is_completed: true },
      { user_id: student2.id, lesson_id: lessons[0].id, course_id: courses[0].id, is_completed: true },
      { user_id: student1.id, lesson_id: lessons[3].id, course_id: courses[1].id, is_completed: true },
    ]);
    console.log('- Seeded 4 lesson progress records');

    // 7. Seed Assignment
    console.log('Seeding assignments...');
    const assignments = await Assignment.bulkCreate([
      {
        course_id: courses[0].id,
        lesson_id: lessons[2].id,
        title: 'Bài trắc nghiệm ôn tập chương 1',
        description: 'Kiểm tra kiến thức cơ bản về HTTP Server và NodeJS Architecture',
        assignment_type: 'quiz',
        total_points: 10,
        passing_score: 5,
        is_published: true,
      },
    ]);
    console.log(`- Seeded ${assignments.length} assignment`);

    // 8. Seed Quiz Questions
    console.log('Seeding quiz questions...');
    await QuizQuestion.bulkCreate([
      {
        assignment_id: assignments[0].id,
        question_text: 'Kiến trúc chạy (Runtime) của Node.js là đơn luồng (Single Thread) hay đa luồng (Multi Thread)?',
        question_type: 'single',
        options: JSON.stringify([
          { id: 'A', text: 'Hoàn toàn Đơn luồng', is_correct: true },
          { id: 'B', text: 'Hoàn toàn Đa luồng', is_correct: false },
          { id: 'C', text: 'Chạy đơn luồng JS engine nhưng đa luồng xử lý IO', is_correct: false },
        ]),
        explanation: 'Node.js hoạt động dựa trên cơ chế đơn luồng (Single-thread event loop) để thông dịch JavaScript.',
        points: 5,
        sort_order: 1,
      },
      {
        assignment_id: assignments[0].id,
        question_text: 'Thư viện nào cung cấp nhân ThreadPool xử lý bất đồng bộ trong Node.js?',
        question_type: 'single',
        options: JSON.stringify([
          { id: 'A', text: 'V8 Engine', is_correct: false },
          { id: 'B', text: 'libuv', is_correct: true },
          { id: 'C', text: 'OpenSSL', is_correct: false },
        ]),
        explanation: 'Thư viện C++ libuv cung cấp cơ chế Event Loop và Thread Pool 4 luồng mặc định cho Node.js.',
        points: 5,
        sort_order: 2,
      },
    ]);
    console.log('- Seeded 2 quiz questions');

    console.log('\n=========================================');
    console.log('Eduvi LMS Course Data seeded successfully!');
    console.log('=========================================');
    console.log(`Categories: ${categories.length}`);
    console.log(`Courses: ${courses.length}`);
    console.log(`Lessons: ${lessons.length}`);
    console.log(`Enrollments: 4`);
    console.log(`Lesson Progress: 4`);
    console.log(`Assignments: ${assignments.length}`);
    console.log(`Quiz Questions: 2`);
    console.log('=========================================');
    
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedCourseData();
