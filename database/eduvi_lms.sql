-- ========================================================
-- EDUVI LMS DATABASE INITIALIZATION & SEED SCRIPT
-- Compatible with MySQL (phpMyAdmin)
-- Designed based on ke_hoach_xay_dung_DB_LMS_v3.md
-- ========================================================

CREATE DATABASE IF NOT EXISTS `eduvi_lms` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `eduvi_lms`;

-- Disable foreign key checks temporarily during table setup
SET FOREIGN_KEY_CHECKS = 0;

-- --------------------------------------------------------
-- 1. Table `users`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(150) NOT NULL,
  `username` VARCHAR(150) NOT NULL UNIQUE,
  `user_type` ENUM('student', 'instructor', 'admin') NOT NULL DEFAULT 'student',
  `avatar_url` VARCHAR(500) DEFAULT NULL,
  `timezone` VARCHAR(50) DEFAULT 'Asia/Ho_Chi_Minh',
  `bio` TEXT DEFAULT NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `email_verified` BOOLEAN NOT NULL DEFAULT FALSE,
  `last_login_at` TIMESTAMP NULL DEFAULT NULL,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_users_email` (`email`),
  INDEX `idx_users_type` (`user_type`),
  INDEX `idx_users_active` (`is_active`, `deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 2. Table `student_profiles`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `student_profiles`;
CREATE TABLE `student_profiles` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `user_id` CHAR(36) NOT NULL UNIQUE,
  `date_of_birth` DATE DEFAULT NULL,
  `phone` VARCHAR(20) DEFAULT NULL,
  `address` TEXT DEFAULT NULL,
  `school_name` VARCHAR(255) DEFAULT NULL,
  `grade_level` VARCHAR(50) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  INDEX `idx_student_profiles_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 3. Table `instructor_profiles`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `instructor_profiles`;
CREATE TABLE `instructor_profiles` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `user_id` CHAR(36) NOT NULL UNIQUE,
  `expertise` VARCHAR(500) DEFAULT NULL,
  `experience_years` INT DEFAULT '0',
  `degree` VARCHAR(255) DEFAULT NULL,
  `linkedin_url` VARCHAR(500) DEFAULT NULL,
  `total_students` INT DEFAULT '0',
  `rating_avg` DECIMAL(3,2) DEFAULT '0.00',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  INDEX `idx_instructor_profiles_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 4. Table `categories`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `name` VARCHAR(150) NOT NULL,
  `slug` VARCHAR(150) NOT NULL UNIQUE,
  `parent_id` CHAR(36) DEFAULT NULL,
  `icon_url` VARCHAR(500) DEFAULT NULL,
  `sort_order` INT DEFAULT '0',
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL,
  INDEX `idx_categories_parent` (`parent_id`),
  INDEX `idx_categories_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 5. Table `courses`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `courses`;
CREATE TABLE `courses` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `category_id` CHAR(36) DEFAULT NULL,
  `title` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL UNIQUE,
  `short_description` VARCHAR(500) DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  `thumbnail` VARCHAR(500) DEFAULT NULL,
  `price` DECIMAL(12,2) DEFAULT '0.00',
  `sale_price` DECIMAL(12,2) DEFAULT NULL,
  `target_level` ENUM('beginner', 'intermediate', 'advanced', 'all') DEFAULT 'all',
  `language` VARCHAR(10) DEFAULT 'vi',
  `is_published` BOOLEAN NOT NULL DEFAULT FALSE,
  `published_at` TIMESTAMP NULL DEFAULT NULL,
  `max_students` INT DEFAULT NULL,
  `duration_weeks` INT DEFAULT NULL,
  `total_lessons` INT DEFAULT '0',
  `total_students` INT DEFAULT '0',
  `rating_avg` DECIMAL(3,2) DEFAULT '0.00',
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL,
  INDEX `idx_courses_category` (`category_id`),
  INDEX `idx_courses_published` (`is_published`, `deleted_at`),
  INDEX `idx_courses_slug` (`slug`),
  FULLTEXT INDEX `ft_courses_search` (`title`, `short_description`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 6. Table `course_instructors`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `course_instructors`;
CREATE TABLE `course_instructors` (
  `course_id` CHAR(36) NOT NULL,
  `instructor_id` CHAR(36) NOT NULL,
  `is_primary` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`course_id`, `instructor_id`),
  FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`instructor_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  INDEX `idx_course_instructors_instructor` (`instructor_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 7. Table `lessons`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `lessons`;
CREATE TABLE `lessons` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `course_id` CHAR(36) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `sort_order` INT NOT NULL DEFAULT '0',
  `lesson_type` ENUM('video', 'text', 'quiz', 'live') NOT NULL DEFAULT 'video',
  `content_url` VARCHAR(500) DEFAULT NULL,
  `content_text` TEXT DEFAULT NULL,
  `duration_minutes` INT DEFAULT NULL,
  `is_preview` BOOLEAN NOT NULL DEFAULT FALSE,
  `is_published` BOOLEAN NOT NULL DEFAULT FALSE,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE,
  INDEX `idx_lessons_course_order` (`course_id`, `sort_order`),
  INDEX `idx_lessons_type` (`lesson_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 8. Table `course_materials`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `course_materials`;
CREATE TABLE `course_materials` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `course_id` CHAR(36) NOT NULL,
  `lesson_id` CHAR(36) DEFAULT NULL,
  `title` VARCHAR(255) NOT NULL,
  `material_type` ENUM('pdf', 'video', 'slide', 'link', 'zip', 'other') NOT NULL,
  `file_url` VARCHAR(500) NOT NULL,
  `file_size_kb` INT DEFAULT NULL,
  `sort_order` INT DEFAULT '0',
  `is_downloadable` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`lesson_id`) REFERENCES `lessons` (`id`) ON DELETE SET NULL,
  INDEX `idx_course_materials_course` (`course_id`),
  INDEX `idx_course_materials_lesson` (`lesson_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 9. Table `enrollments`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `enrollments`;
CREATE TABLE `enrollments` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `user_id` CHAR(36) NOT NULL,
  `course_id` CHAR(36) NOT NULL,
  `status` ENUM('active', 'completed', 'dropped', 'expired') NOT NULL DEFAULT 'active',
  `progress_percentage` FLOAT DEFAULT '0',
  `completed_at` TIMESTAMP NULL DEFAULT NULL,
  `certificate_issued` BOOLEAN NOT NULL DEFAULT FALSE,
  `enrolled_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expired_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_enrollments_user_course` (`user_id`, `course_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE,
  INDEX `idx_enrollments_user` (`user_id`),
  INDEX `idx_enrollments_course` (`course_id`),
  INDEX `idx_enrollments_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 10. Table `lesson_progress`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `lesson_progress`;
CREATE TABLE `lesson_progress` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `user_id` CHAR(36) NOT NULL,
  `lesson_id` CHAR(36) NOT NULL,
  `course_id` CHAR(36) NOT NULL,
  `is_completed` BOOLEAN NOT NULL DEFAULT FALSE,
  `watch_duration` INT DEFAULT '0',
  `last_position` INT DEFAULT '0',
  `quiz_score` FLOAT DEFAULT NULL,
  `completed_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_lesson_progress` (`user_id`, `lesson_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`lesson_id`) REFERENCES `lessons` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE,
  INDEX `idx_lesson_progress_user_course` (`user_id`, `course_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 11. Table `assignments`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `assignments`;
CREATE TABLE `assignments` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `course_id` CHAR(36) NOT NULL,
  `lesson_id` CHAR(36) DEFAULT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `assignment_type` ENUM('quiz', 'essay', 'upload') NOT NULL DEFAULT 'quiz',
  `total_points` INT DEFAULT '100',
  `passing_score` FLOAT DEFAULT '50',
  `time_limit_minutes` INT DEFAULT NULL,
  `attempts_allowed` INT DEFAULT '1',
  `show_answer_after` BOOLEAN NOT NULL DEFAULT FALSE,
  `due_date` TIMESTAMP NULL DEFAULT NULL,
  `is_published` BOOLEAN NOT NULL DEFAULT FALSE,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`lesson_id`) REFERENCES `lessons` (`id`) ON DELETE SET NULL,
  INDEX `idx_assignments_course` (`course_id`),
  INDEX `idx_assignments_lesson` (`lesson_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 12. Table `quiz_questions`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `quiz_questions`;
CREATE TABLE `quiz_questions` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `assignment_id` CHAR(36) NOT NULL,
  `question_text` TEXT NOT NULL,
  `question_type` ENUM('single', 'multiple', 'true_false') NOT NULL DEFAULT 'single',
  `options` JSON NOT NULL,
  `explanation` TEXT DEFAULT NULL,
  `points` INT DEFAULT '1',
  `sort_order` INT DEFAULT '0',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`assignment_id`) REFERENCES `assignments` (`id`) ON DELETE CASCADE,
  INDEX `idx_quiz_questions_assignment` (`assignment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 13. Table `submissions`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `submissions`;
CREATE TABLE `submissions` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `assignment_id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  `attempt_number` INT NOT NULL DEFAULT '1',
  `answers` JSON DEFAULT NULL,
  `file_url` VARCHAR(500) DEFAULT NULL,
  `score` FLOAT DEFAULT NULL,
  `status` ENUM('submitted', 'graded', 'late', 'invalid') NOT NULL DEFAULT 'submitted',
  `feedback` TEXT DEFAULT NULL,
  `graded_by` CHAR(36) DEFAULT NULL,
  `graded_at` TIMESTAMP NULL DEFAULT NULL,
  `submitted_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`assignment_id`) REFERENCES `assignments` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`graded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  INDEX `idx_submissions_assignment_user` (`assignment_id`, `user_id`),
  INDEX `idx_submissions_status` (`status`),
  INDEX `idx_submissions_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 14. Table `refresh_tokens`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `refresh_tokens`;
CREATE TABLE `refresh_tokens` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `user_id` CHAR(36) NOT NULL,
  `token_hash` VARCHAR(255) NOT NULL UNIQUE,
  `expires_at` TIMESTAMP NOT NULL,
  `revoked_at` TIMESTAMP NULL DEFAULT NULL,
  `user_agent` VARCHAR(500) DEFAULT NULL,
  `ip_address` VARCHAR(50) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  INDEX `idx_refresh_tokens_user` (`user_id`),
  INDEX `idx_refresh_tokens_expires` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Re-enable foreign key checks after table setup is complete
-- --------------------------------------------------------
SET FOREIGN_KEY_CHECKS = 1;


-- ========================================================
-- DATA SEEDER SCRIPTS (MOCK DATA FOR TESTING)
-- Password for all accounts is 'ant.design'
-- BCrypt-10 Hash of 'ant.design' is: $2a$10$qHNROXuKsNV0yJJB.U39jOC8OWo6hvmJwRXlyVch.noPV3AJIkZju
-- ========================================================

-- 1. Insert into table `users`
INSERT INTO `users` (`id`, `email`, `password_hash`, `full_name`, `username`, `user_type`, `avatar_url`, `bio`) VALUES
('u-admin-0000000000000000000000000001', 'admin@eduvi.com', '$2a$10$qHNROXuKsNV0yJJB.U39jOC8OWo6hvmJwRXlyVch.noPV3AJIkZju', 'Quản trị viên Hệ thống', 'sysadmin', 'admin', 'https://gw.alipayobjects.com/zos/antfincdn/XAosXuNZyF/BiazfanxmamNRoxxVxka.png', 'Tôi chịu trách nhiệm bảo mật và vận hành hệ thống LMS Eduvi.'),
('u-instru-000000000000000000000000001', 'binhtt@gmail.com', '$2a$10$qHNROXuKsNV0yJJB.U39jOC8OWo6hvmJwRXlyVch.noPV3AJIkZju', 'TS. Trần Thị Bình', 'binhtt', 'instructor', 'https://gw.alipayobjects.com/zos/rmsportal/sfjbOqnsXXJgNCjCzDBL.png', 'Giảng viên cấp cao Khoa Công nghệ Thông tin. Hơn 8 năm giảng dạy kỹ thuật lập trình.'),
('u-instru-000000000000000000000000002', 'hongvt@gmail.com', '$2a$10$qHNROXuKsNV0yJJB.U39jOC8OWo6hvmJwRXlyVch.noPV3AJIkZju', 'ThS. Vũ Thị Hồng', 'hongvt@921', 'instructor', 'https://gw.alipayobjects.com/zos/rmsportal/ZiESqWwCXBRQoaPONSJe.png', 'Nghiên cứu viên và giảng dạy chuyên môn Cơ sở dữ liệu và Web.'),
('u-studen-000000000000000000000000001', 'annv@gmail.com', '$2a$10$qHNROXuKsNV0yJJB.U39jOC8OWo6hvmJwRXlyVch.noPV3AJIkZju', 'Nguyễn Văn An', 'annv', 'student', 'https://gw.alipayobjects.com/zos/rmsportal/BiazfanxmamNRoxxVxka.png', 'Học viên đam mê xây dựng hệ thống phân phối lớn.'),
('u-studen-000000000000000000000000002', 'cuonglh@gmail.com', '$2a$10$qHNROXuKsNV0yJJB.U39jOC8OWo6hvmJwRXlyVch.noPV3AJIkZju', 'Lê Hoàng Cường', 'cuonglh@441', 'student', 'https://gw.alipayobjects.com/zos/rmsportal/zOsKZmFRdUtvpqCImOVY.png', 'Thành viên lớp Lập trình Web Node.js.'),
('u-studen-000000000000000000000000003', 'ducpm@gmail.com', '$2a$10$qHNROXuKsNV0yJJB.U39jOC8OWo6hvmJwRXlyVch.noPV3AJIkZju', 'Phạm Minh Đức', 'ducpm@782', 'student', 'https://gw.alipayobjects.com/zos/rmsportal/dURIMkkrRFpPgTuzkwnB.png', 'Yêu thích học hỏi kiến thức Backend nâng cao.');

-- 2. Insert into table `student_profiles`
INSERT INTO `student_profiles` (`id`, `user_id`, `school_name`, `grade_level`) VALUES
(UUID(), 'u-studen-000000000000000000000000001', 'Đại học Công nghệ Thông tin', 'Năm 3'),
(UUID(), 'u-studen-000000000000000000000000002', 'Đại học Bách Khoa', 'Năm 2'),
(UUID(), 'u-studen-000000000000000000000000003', 'Đại học KHTN', 'Năm 4');

-- 3. Insert into table `instructor_profiles`
INSERT INTO `instructor_profiles` (`id`, `user_id`, `expertise`, `experience_years`, `degree`) VALUES
(UUID(), 'u-instru-000000000000000000000000001', 'Lập trình NodeJS, Kiến trúc MVC, Microservices', 8, 'Tiến sĩ'),
(UUID(), 'u-instru-000000000000000000000000002', 'Hệ quản trị CSDL MySQL, PostgreSQL, DevOps cơ bản', 4, 'Thạc sĩ');

-- 4. Insert into table `categories`
INSERT INTO `categories` (`id`, `name`, `slug`, `sort_order`) VALUES
('c-backen-0000000000000000000000000001', 'Lập trình Backend', 'lap-trinh-backend', 1),
('c-databa-0000000000000000000000000001', 'Cơ sở dữ liệu', 'co-so-du-lieu', 2),
('c-webdev-0000000000000000000000000001', 'Lập trình Web', 'lap-trinh-web', 3);

-- 5. Insert into table `courses`
INSERT INTO `courses` (`id`, `category_id`, `title`, `slug`, `short_description`, `description`, `thumbnail`, `price`, `target_level`, `is_published`, `total_lessons`, `total_students`, `rating_avg`) VALUES
('course-node-000000000000000000000001', 'c-backen-0000000000000000000000000001', 'Lập trình Node.js thực chiến từ Zero đến Hero', 'lap-trinh-node-js-thuc-chien', 'Khóa học Node.js toàn diện nhất giúp bạn làm chủ backend.', '<h2>Nội dung khóa học</h2><p>Học viên sẽ được học qua MVC, Express routing, bảo mật JWT và cơ sở dữ liệu quan hệ.</p>', 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3', 599000.00, 'all', 1, 3, 2, 4.80),
('course-expre-000000000000000000000001', 'c-backen-0000000000000000000000000001', 'Xây dựng RESTful API với Express và TypeScript', 'xay-dung-restful-api', 'Tìm hiểu cấu trúc API chuẩn doanh nghiệp, validation và kiểu dữ liệu strict.', '<p>Làm chủ Express Router và tích hợp TypeScript cho kiến trúc dự án bền vững.</p>', 'https://images.unsplash.com/photo-1555066931-4365d14bab8c', 350000.00, 'intermediate', 1, 2, 1, 4.70),
('course-mysql-000000000000000000000001', 'c-databa-0000000000000000000000000001', 'Cơ sở dữ liệu MySQL nâng cao cho Lập trình viên', 'mysql-nang-cao', 'Tối ưu truy vấn, thiết kế Index và xử lý transaction.', '<p>Phù hợp với lập trình viên backend muốn tối ưu hóa database.</p>', 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d', 290000.00, 'advanced', 1, 2, 1, 4.90);

-- 6. Insert into table `course_instructors`
INSERT INTO `course_instructors` (`course_id`, `instructor_id`, `is_primary`) VALUES
('course-node-000000000000000000000001', 'u-instru-000000000000000000000000001', 1),
('course-expre-000000000000000000000001', 'u-instru-000000000000000000000000002', 1),
('course-mysql-000000000000000000000001', 'u-instru-000000000000000000000000001', 1);

-- 7. Insert into table `lessons`
INSERT INTO `lessons` (`id`, `course_id`, `title`, `sort_order`, `lesson_type`, `content_url`, `is_preview`, `is_published`) VALUES
('l-node-01', 'course-node-000000000000000000000001', 'Bài 1: Giới thiệu kiến trúc Runtime Node.js', 1, 'video', 'https://www.youtube.com/watch?v=MVC1', 1, 1),
('l-node-02', 'course-node-000000000000000000000001', 'Bài 2: Hướng dẫn cài đặt NPM và Node Module', 2, 'video', 'https://www.youtube.com/watch?v=NPM2', 0, 1),
('l-node-03', 'course-node-000000000000000000000001', 'Bài 3: Xây dựng server HTTP đầu tiên', 3, 'video', 'https://www.youtube.com/watch?v=HTTP3', 0, 1),
('l-expre-01', 'course-expre-000000000000000000000001', 'Bài 1: Khởi tạo Project Express & TypeScript', 1, 'video', 'https://www.youtube.com/watch?v=EX1', 1, 1),
('l-expre-02', 'course-expre-000000000000000000000001', 'Bài 2: Định cấu hình Middleware Express BodyParser', 2, 'video', 'https://www.youtube.com/watch?v=EX2', 0, 1),
('l-mysql-01', 'course-mysql-000000000000000000000001', 'Bài 1: Khái niệm Indexes và Phân tích EXPLAIN Query', 1, 'video', 'https://www.youtube.com/watch?v=SQL1', 1, 1),
('l-mysql-02', 'course-mysql-000000000000000000000001', 'Bài 2: Cách tối ưu hóa JOIN nhiều bảng', 2, 'video', 'https://www.youtube.com/watch?v=SQL2', 0, 1);

-- 8. Insert into table `enrollments`
INSERT INTO `enrollments` (`id`, `user_id`, `course_id`, `status`, `progress_percentage`) VALUES
(UUID(), 'u-studen-000000000000000000000000001', 'course-node-000000000000000000000001', 'active', 66.67),
(UUID(), 'u-studen-000000000000000000000000002', 'course-node-000000000000000000000001', 'active', 33.33),
(UUID(), 'u-studen-000000000000000000000000001', 'course-expre-000000000000000000000001', 'active', 50.00),
(UUID(), 'u-studen-000000000000000000000000003', 'course-mysql-000000000000000000000001', 'active', 0.00);

-- 9. Insert into table `lesson_progress`
INSERT INTO `lesson_progress` (`id`, `user_id`, `lesson_id`, `course_id`, `is_completed`) VALUES
(UUID(), 'u-studen-000000000000000000000000001', 'l-node-01', 'course-node-000000000000000000000001', 1),
(UUID(), 'u-studen-000000000000000000000000001', 'l-node-02', 'course-node-000000000000000000000001', 1),
(UUID(), 'u-studen-000000000000000000000000002', 'l-node-01', 'course-node-000000000000000000000001', 1),
(UUID(), 'u-studen-000000000000000000000000001', 'l-expre-01', 'course-expre-000000000000000000000001', 1);

-- 10. Insert into table `assignments`
INSERT INTO `assignments` (`id`, `course_id`, `lesson_id`, `title`, `description`, `assignment_type`, `total_points`, `passing_score`) VALUES
('a-quiz-node-000000000000000000000001', 'course-node-000000000000000000000001', 'l-node-03', 'Bài trắc nghiệm ôn tập chương 1', 'Kiểm tra kiến thức cơ bản về HTTP Server và NodeJS Architecture', 'quiz', 10, 5);

-- 11. Insert into table `quiz_questions`
INSERT INTO `quiz_questions` (`id`, `assignment_id`, `question_text`, `question_type`, `options`, `explanation`) VALUES
(UUID(), 'a-quiz-node-000000000000000000000001', 'Kiến trúc chạy (Runtime) của Node.js là đơn luồng (Single Thread) hay đa luồng (Multi Thread)?', 'single', 
 '[{"id": "A", "text": "Hoàn toàn Đơn luồng", "is_correct": true}, {"id": "B", "text": "Hoàn toàn Đa luồng", "is_correct": false}, {"id": "C", "text": "Chạy đơn luồng JS engine nhưng đa luồng xử lý IO", "is_correct": false}]', 
 'Node.js hoạt động dựa trên cơ chế đơn luồng (Single-thread event loop) để thông dịch JavaScript.'),
(UUID(), 'a-quiz-node-000000000000000000000001', 'Thư viện nào cung cấp nhân ThreadPool xử lý bất đồng bộ trong Node.js?', 'single', 
 '[{"id": "A", "text": "V8 Engine", "is_correct": false}, {"id": "B", "text": "libuv", "is_correct": true}, {"id": "C", "text": "OpenSSL", "is_correct": false}]', 
 'Thư viện C++ libuv cung cấp cơ chế Event Loop và Thread Pool 4 luồng mặc định cho Node.js.');
