/**
 * Seed script cho các bảng mở rộng: certificates, user_certificates, course_reviews, audit_logs
 * Chạy: npx ts-node src/scripts/seed-extensions.ts
 */

import { sequelize } from '../config/database';
import { Certificate, UserCertificate, CourseReview, AuditLog, Enrollment, Course, User } from '../models';

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database.');

    // Sync new tables
    await sequelize.sync({ alter: true });
    console.log('Tables synced.');

    // Lấy dữ liệu hiện có
    const courses = await Course.findAll();
    const users = await User.findAll({ where: { user_type: 'student' } });
    const enrollments = await Enrollment.findAll({ where: { status: 'completed' } });

    if (courses.length === 0) {
      console.log('No courses found. Skipping seed.');
      return;
    }

    // ===== SEED CERTIFICATES =====
    console.log('\n--- Seeding Certificates ---');
    for (const course of courses) {
      const existing = await Certificate.findOne({ where: { course_id: course.id } });
      if (!existing) {
        await Certificate.create({
          course_id: course.id,
          title: `Chứng chỉ hoàn thành: ${course.title}`,
          description: `Xác nhận đã hoàn thành khóa học "${course.title}" trên hệ thống Eduvi LMS`,
        });
        console.log(`  ✓ Certificate for "${course.title}"`);
      }
    }

    // ===== SEED USER CERTIFICATES =====
    console.log('\n--- Seeding User Certificates ---');
    let certCount = 0;
    for (const enrollment of enrollments) {
      const existing = await UserCertificate.findOne({
        where: { user_id: enrollment.user_id, course_id: enrollment.course_id }
      });
      if (!existing) {
        const certificate = await Certificate.findOne({ where: { course_id: enrollment.course_id } });
        if (certificate) {
          const cert_code = `CERT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
          await UserCertificate.create({
            user_id: enrollment.user_id,
            certificate_id: certificate.id,
            course_id: enrollment.course_id,
            cert_code,
            issued_at: new Date(),
          });
          await enrollment.update({ certificate_issued: true });
          certCount++;
        }
      }
    }
    console.log(`  ✓ ${certCount} user certificates issued`);

    // ===== SEED COURSE REVIEWS =====
    console.log('\n--- Seeding Course Reviews ---');
    const reviewComments = [
      'Khóa học rất hay và bổ ích, giảng viên dạy dễ hiểu.',
      'Nội dung đầy đủ, phù hợp cho người mới bắt đầu.',
      'Khóa học tốt, nhưng cần thêm bài tập thực hành.',
      'Giảng viên nhiệt tình, giải đáp thắc mắc nhanh.',
      'Nội dung cập nhật, phù hợp với thực tế.',
    ];

    let reviewCount = 0;
    for (const course of courses) {
      // Tạo 2-4 review mỗi khóa học
      const numReviews = 2 + Math.floor(Math.random() * 3);
      const shuffledUsers = users.sort(() => 0.5 - Math.random()).slice(0, numReviews);

      for (const user of shuffledUsers) {
        const existing = await CourseReview.findOne({
          where: { user_id: user.id, course_id: course.id }
        });
        if (!existing) {
          await CourseReview.create({
            course_id: course.id,
            user_id: user.id,
            rating: 3 + Math.floor(Math.random() * 3), // 3-5 stars
            comment: reviewComments[Math.floor(Math.random() * reviewComments.length)],
          });
          reviewCount++;
        }
      }
    }
    console.log(`  ✓ ${reviewCount} course reviews created`);

    // Cập nhật rating_avg cho tất cả courses
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
    console.log('  ✓ Updated rating_avg for all courses');

    // ===== SEED AUDIT LOGS =====
    console.log('\n--- Seeding Audit Logs ---');
    const auditActions = [
      { action: 'login', entity_type: 'user' },
      { action: 'enroll', entity_type: 'enrollment' },
      { action: 'cert_issued', entity_type: 'user_certificate' },
    ];

    let auditCount = 0;
    for (const user of users.slice(0, 10)) {
      for (const audit of auditActions) {
        await AuditLog.create({
          user_id: user.id,
          action: audit.action,
          entity_type: audit.entity_type,
          entity_id: user.id,
          detail: { seeded: true },
          ip_address: '127.0.0.1',
        });
        auditCount++;
      }
    }
    console.log(`  ✓ ${auditCount} audit log entries created`);

    console.log('\n✅ Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed();
