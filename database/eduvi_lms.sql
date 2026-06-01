-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: May 28, 2026 at 02:20 AM
-- Server version: 8.4.3
-- PHP Version: 8.3.26

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `eduvi_lms`
--

-- --------------------------------------------------------

--
-- Table structure for table `assignments`
--

CREATE TABLE `assignments` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `course_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `lesson_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `assignment_type` enum('quiz','essay','upload') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'quiz',
  `total_points` int DEFAULT '100',
  `passing_score` float DEFAULT '50',
  `time_limit_minutes` int DEFAULT NULL,
  `attempts_allowed` int DEFAULT '1',
  `show_answer_after` tinyint(1) NOT NULL DEFAULT '0',
  `due_date` datetime DEFAULT NULL,
  `is_published` tinyint(1) NOT NULL DEFAULT '0',
  `deleted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `assignments`
--

INSERT INTO `assignments` (`id`, `course_id`, `lesson_id`, `title`, `description`, `assignment_type`, `total_points`, `passing_score`, `time_limit_minutes`, `attempts_allowed`, `show_answer_after`, `due_date`, `is_published`, `deleted_at`, `created_at`, `updated_at`) VALUES
('b8c94ad3-5056-4882-871d-72aab6e77595', 'a5dafe62-f677-415a-8d96-a50c3cc99fa3', '59a07842-d53b-4feb-9c23-bf6c71e54164', 'Bài trắc nghiệm ôn tập chương 1', 'Kiểm tra kiến thức cơ bản về HTTP Server và NodeJS Architecture', 'quiz', 10, 5, NULL, 1, 0, NULL, 1, NULL, '2026-05-27 08:54:01', '2026-05-27 08:54:01'),
('e1a2b3c4-d5e6-f7a8-b9c0-d1e2f3a4b5c6', '4dd4e920-1e5d-47ec-a760-f9347c84cbd1', 'a57bc2c1-7e76-4144-a6ff-9d4ad4fda038', 'Bài luận về Express Middleware', 'Viết bài luận giải thích cách middleware hoạt động trong Express.js', 'essay', 100, 60, NULL, 1, 0, '2026-06-30 23:59:59', 1, NULL, '2026-06-01 00:00:00', '2026-06-01 00:00:00'),
('f2b3c4d5-e6f7-a8b9-c0d1-e2f3a4b5c6d7', 'a5dafe62-f677-415a-8d96-a50c3cc99fa3', '98008d63-71de-4975-8f6f-a396a424f882', 'Bài nộp project cuối khóa', 'Upload file source code project cuối khóa', 'upload', 100, 50, NULL, 1, 0, '2026-07-15 23:59:59', 1, NULL, '2026-06-01 00:00:00', '2026-06-01 00:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `parent_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `icon_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sort_order` int DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `name`, `slug`, `parent_id`, `icon_url`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
('cc3c0bb8-7b8a-40df-9cc7-69c467b12a59', 'Lập trình Web', 'lap-trinh-web', NULL, NULL, 3, 1, '2026-05-27 08:54:01', '2026-05-27 08:54:01'),
('d02e2a93-aa87-4393-bbe4-c2401abe5a57', 'Cơ sở dữ liệu', 'co-so-du-lieu', NULL, NULL, 2, 1, '2026-05-27 08:54:01', '2026-05-27 08:54:01'),
('f042fa03-6ceb-44ec-980e-d6c4e1125173', 'Lập trình Backend', 'lap-trinh-backend', NULL, NULL, 1, 1, '2026-05-27 08:54:01', '2026-05-27 08:54:01');

-- --------------------------------------------------------

--
-- Table structure for table `courses`
--

CREATE TABLE `courses` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `category_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `short_description` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `thumbnail` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `price` decimal(12,2) DEFAULT '0.00',
  `sale_price` decimal(12,2) DEFAULT NULL,
  `target_level` enum('beginner','intermediate','advanced','all') COLLATE utf8mb4_unicode_ci DEFAULT 'all',
  `language` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT 'vi',
  `is_published` tinyint(1) NOT NULL DEFAULT '0',
  `published_at` datetime DEFAULT NULL,
  `max_students` int DEFAULT NULL,
  `duration_weeks` int DEFAULT NULL,
  `total_lessons` int DEFAULT '0',
  `total_students` int DEFAULT '0',
  `rating_avg` decimal(3,2) DEFAULT '0.00',
  `deleted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `courses`
--

INSERT INTO `courses` (`id`, `category_id`, `title`, `slug`, `short_description`, `description`, `thumbnail`, `price`, `sale_price`, `target_level`, `language`, `is_published`, `published_at`, `max_students`, `duration_weeks`, `total_lessons`, `total_students`, `rating_avg`, `deleted_at`, `created_at`, `updated_at`) VALUES
('4dd4e920-1e5d-47ec-a760-f9347c84cbd1', 'f042fa03-6ceb-44ec-980e-d6c4e1125173', 'Xây dựng RESTful API với Express và TypeScript', 'xay-dung-restful-api', 'Tìm hiểu cấu trúc API chuẩn doanh nghiệp, validation và kiểu dữ liệu strict.', '<p>Làm chủ Express Router và tích hợp TypeScript cho kiến trúc dự án bền vững.</p>', 'https://images.unsplash.com/photo-1555066931-4365d14bab8c', 350000.00, NULL, 'intermediate', 'vi', 1, '2026-05-27 08:54:01', NULL, NULL, 2, 1, 4.70, NULL, '2026-05-27 08:54:01', '2026-05-27 08:54:01'),
('a5dafe62-f677-415a-8d96-a50c3cc99fa3', 'f042fa03-6ceb-44ec-980e-d6c4e1125173', 'Lập trình Node.js thực chiến từ Zero đến Hero', 'lap-trinh-node-js-thuc-chien', 'Khóa học Node.js toàn diện nhất giúp bạn làm chủ backend.', '<h2>Nội dung khóa học</h2><p>Học viên sẽ được học qua MVC, Express routing, bảo mật JWT và cơ sở dữ liệu quan hệ.</p>', 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3', 599000.00, NULL, 'all', 'vi', 1, '2026-05-27 08:54:01', NULL, NULL, 3, 2, 4.80, NULL, '2026-05-27 08:54:01', '2026-05-27 08:54:01'),
('b3fb521c-3a21-4f38-a216-a5730ffb8b48', 'd02e2a93-aa87-4393-bbe4-c2401abe5a57', 'Cơ sở dữ liệu MySQL nâng cao cho Lập trình viên', 'mysql-nang-cao', 'Tối ưu truy vấn, thiết kế Index và xử lý transaction.', '<p>Phù hợp với lập trình viên backend muốn tối ưu hóa database.</p>', 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d', 290000.00, NULL, 'advanced', 'vi', 1, '2026-05-27 08:54:01', NULL, NULL, 2, 1, 4.90, NULL, '2026-05-27 08:54:01', '2026-05-27 08:54:01');

-- --------------------------------------------------------

--
-- Table structure for table `course_instructors`
--

CREATE TABLE `course_instructors` (
  `course_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `instructor_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `course_instructors`
--

INSERT INTO `course_instructors` (`course_id`, `instructor_id`, `is_primary`, `created_at`) VALUES
('4dd4e920-1e5d-47ec-a760-f9347c84cbd1', 'u-instru-000000000000000000000000002', 1, '2026-05-27 08:54:01'),
('a5dafe62-f677-415a-8d96-a50c3cc99fa3', 'u-instru-000000000000000000000000001', 1, '2026-05-27 08:54:01'),
('b3fb521c-3a21-4f38-a216-a5730ffb8b48', 'u-instru-000000000000000000000000001', 1, '2026-05-27 08:54:01');

-- --------------------------------------------------------

--
-- Table structure for table `course_materials`
--

CREATE TABLE `course_materials` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `course_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `lesson_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `material_type` enum('pdf','video','slide','link','zip','other') COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_size_kb` int DEFAULT NULL,
  `sort_order` int DEFAULT '0',
  `is_downloadable` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `enrollments`
--

CREATE TABLE `enrollments` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `course_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `status` enum('active','completed','dropped','expired') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `progress_percentage` float DEFAULT '0',
  `completed_at` datetime DEFAULT NULL,
  `certificate_issued` tinyint(1) NOT NULL DEFAULT '0',
  `enrolled_at` datetime NOT NULL,
  `expired_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `enrollments`
--

INSERT INTO `enrollments` (`id`, `user_id`, `course_id`, `status`, `progress_percentage`, `completed_at`, `certificate_issued`, `enrolled_at`, `expired_at`, `created_at`, `updated_at`) VALUES
('0098f2fa-475b-4963-a534-86715f0b37a9', 'u-studen-000000000000000000000000001', '4dd4e920-1e5d-47ec-a760-f9347c84cbd1', 'active', 50, NULL, 0, '2026-05-27 08:54:01', NULL, '2026-05-27 08:54:01', '2026-05-27 08:54:01'),
('299550c6-b925-4e71-8df6-e14060d7c74e', 'u-studen-000000000000000000000000001', 'a5dafe62-f677-415a-8d96-a50c3cc99fa3', 'active', 66.67, NULL, 0, '2026-05-27 08:54:01', NULL, '2026-05-27 08:54:01', '2026-05-27 08:54:01'),
('4179e6cc-adfd-4b92-bed5-ea4e68c8cd12', 'u-studen-000000000000000000000000002', 'a5dafe62-f677-415a-8d96-a50c3cc99fa3', 'active', 33.33, NULL, 0, '2026-05-27 08:54:01', NULL, '2026-05-27 08:54:01', '2026-05-27 08:54:01'),
('7bda56ea-e8ab-4864-aa41-9339aab9a83a', 'u-studen-000000000000000000000000003', 'b3fb521c-3a21-4f38-a216-a5730ffb8b48', 'active', 0, NULL, 0, '2026-05-27 08:54:01', NULL, '2026-05-27 08:54:01', '2026-05-27 08:54:01');

-- --------------------------------------------------------

--
-- Table structure for table `instructor_profiles`
--

CREATE TABLE `instructor_profiles` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `expertise` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `experience_years` int DEFAULT '0',
  `degree` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `linkedin_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `total_students` int DEFAULT '0',
  `rating_avg` decimal(3,2) DEFAULT '0.00',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `instructor_profiles`
--

INSERT INTO `instructor_profiles` (`id`, `user_id`, `expertise`, `experience_years`, `degree`, `linkedin_url`, `total_students`, `rating_avg`, `created_at`, `updated_at`) VALUES
('0070b1dd-aa33-414d-90a7-ab1006b6f040', 'u-instru-000000000000000000000000001', 'Lập trình NodeJS, Kiến trúc MVC, Microservices', 8, 'Tiến sĩ', NULL, 0, 0.00, '2026-05-27 08:53:58', '2026-05-27 08:53:58'),
('39838f86-0eca-4641-b300-16e9ce20c08e', 'u-instru-000000000000000000000000002', 'Hệ quản trị CSDL MySQL, PostgreSQL, DevOps cơ bản', 4, 'Thạc sĩ', NULL, 0, 0.00, '2026-05-27 08:53:58', '2026-05-27 08:53:58');

-- --------------------------------------------------------

--
-- Table structure for table `lessons`
--

CREATE TABLE `lessons` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `course_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sort_order` int NOT NULL DEFAULT '0',
  `lesson_type` enum('video','text','quiz','live') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'video',
  `content_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `content_text` text COLLATE utf8mb4_unicode_ci,
  `duration_minutes` int DEFAULT NULL,
  `is_preview` tinyint(1) NOT NULL DEFAULT '0',
  `is_published` tinyint(1) NOT NULL DEFAULT '0',
  `deleted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `lessons`
--

INSERT INTO `lessons` (`id`, `course_id`, `title`, `sort_order`, `lesson_type`, `content_url`, `content_text`, `duration_minutes`, `is_preview`, `is_published`, `deleted_at`, `created_at`, `updated_at`) VALUES
('59a07842-d53b-4feb-9c23-bf6c71e54164', 'a5dafe62-f677-415a-8d96-a50c3cc99fa3', 'Bài 3: Xây dựng server HTTP đầu tiên', 3, 'video', 'https://www.youtube.com/watch?v=HTTP3', NULL, NULL, 0, 1, NULL, '2026-05-27 08:54:01', '2026-05-27 08:54:01'),
('7e8b5938-7665-44f3-938b-291fec857120', 'a5dafe62-f677-415a-8d96-a50c3cc99fa3', 'Bài 1: Giới thiệu kiến trúc Runtime Node.js', 1, 'video', 'https://www.youtube.com/watch?v=MVC1', NULL, NULL, 1, 1, NULL, '2026-05-27 08:54:01', '2026-05-27 08:54:01'),
('8eba03d7-6398-430f-8145-60c7869e9f5e', '4dd4e920-1e5d-47ec-a760-f9347c84cbd1', 'Bài 1: Khởi tạo Project Express & TypeScript', 1, 'video', 'https://www.youtube.com/watch?v=EX1', NULL, NULL, 1, 1, NULL, '2026-05-27 08:54:01', '2026-05-27 08:54:01'),
('98008d63-71de-4975-8f6f-a396a424f882', 'a5dafe62-f677-415a-8d96-a50c3cc99fa3', 'Bài 2: Hướng dẫn cài đặt NPM và Node Module', 2, 'video', 'https://www.youtube.com/watch?v=NPM2', NULL, NULL, 0, 1, NULL, '2026-05-27 08:54:01', '2026-05-27 08:54:01'),
('a57bc2c1-7e76-4144-a6ff-9d4ad4fda038', '4dd4e920-1e5d-47ec-a760-f9347c84cbd1', 'Bài 2: Định cấu hình Middleware Express BodyParser', 2, 'video', 'https://www.youtube.com/watch?v=EX2', NULL, NULL, 0, 1, NULL, '2026-05-27 08:54:01', '2026-05-27 08:54:01'),
('af94ad67-ea01-4cb5-9d22-8c8859b2e1a9', 'b3fb521c-3a21-4f38-a216-a5730ffb8b48', 'Bài 2: Cách tối ưu hóa JOIN nhiều bảng', 2, 'video', 'https://www.youtube.com/watch?v=SQL2', NULL, NULL, 0, 1, NULL, '2026-05-27 08:54:01', '2026-05-27 08:54:01'),
('c40f7662-548c-4d9d-8b4f-0da281aa9e01', 'b3fb521c-3a21-4f38-a216-a5730ffb8b48', 'Bài 1: Khái niệm Indexes và Phân tích EXPLAIN Query', 1, 'video', 'https://www.youtube.com/watch?v=SQL1', NULL, NULL, 1, 1, NULL, '2026-05-27 08:54:01', '2026-05-27 08:54:01');

-- --------------------------------------------------------

--
-- Table structure for table `lesson_progress`
--

CREATE TABLE `lesson_progress` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `lesson_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `course_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `is_completed` tinyint(1) NOT NULL DEFAULT '0',
  `watch_duration` int DEFAULT '0',
  `last_position` int DEFAULT '0',
  `quiz_score` float DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `lesson_progress`
--

INSERT INTO `lesson_progress` (`id`, `user_id`, `lesson_id`, `course_id`, `is_completed`, `watch_duration`, `last_position`, `quiz_score`, `completed_at`, `created_at`, `updated_at`) VALUES
('1c587993-0c5d-43d6-88f0-9be6084ca8e2', 'u-studen-000000000000000000000000001', '7e8b5938-7665-44f3-938b-291fec857120', 'a5dafe62-f677-415a-8d96-a50c3cc99fa3', 1, 0, 0, NULL, NULL, '2026-05-27 08:54:01', '2026-05-27 08:54:01'),
('4316f29a-98d7-4ee3-bf17-62af1788453d', 'u-studen-000000000000000000000000001', '8eba03d7-6398-430f-8145-60c7869e9f5e', '4dd4e920-1e5d-47ec-a760-f9347c84cbd1', 1, 0, 0, NULL, NULL, '2026-05-27 08:54:01', '2026-05-27 08:54:01'),
('7430e145-3d05-45ae-893c-cf23921c1445', 'u-studen-000000000000000000000000001', '98008d63-71de-4975-8f6f-a396a424f882', 'a5dafe62-f677-415a-8d96-a50c3cc99fa3', 1, 0, 0, NULL, NULL, '2026-05-27 08:54:01', '2026-05-27 08:54:01'),
('fa7c9631-4770-4e56-8e9e-af6e3a7f2fe5', 'u-studen-000000000000000000000000002', '7e8b5938-7665-44f3-938b-291fec857120', 'a5dafe62-f677-415a-8d96-a50c3cc99fa3', 1, 0, 0, NULL, NULL, '2026-05-27 08:54:01', '2026-05-27 08:54:01');

-- --------------------------------------------------------

--
-- Table structure for table `quiz_questions`
--

CREATE TABLE `quiz_questions` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `assignment_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `question_text` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `question_type` enum('single','multiple','true_false') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'single',
  `options` json NOT NULL,
  `explanation` text COLLATE utf8mb4_unicode_ci,
  `points` int DEFAULT '1',
  `sort_order` int DEFAULT '0',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `quiz_questions`
--

INSERT INTO `quiz_questions` (`id`, `assignment_id`, `question_text`, `question_type`, `options`, `explanation`, `points`, `sort_order`, `created_at`, `updated_at`) VALUES
('d6ed85b9-4a1c-4b30-8f23-6994371b8748', 'b8c94ad3-5056-4882-871d-72aab6e77595', 'Kiến trúc chạy (Runtime) của Node.js là đơn luồng (Single Thread) hay đa luồng (Multi Thread)?', 'single', '\"[{\\\"id\\\":\\\"A\\\",\\\"text\\\":\\\"Hoàn toàn Đơn luồng\\\",\\\"is_correct\\\":true},{\\\"id\\\":\\\"B\\\",\\\"text\\\":\\\"Hoàn toàn Đa luồng\\\",\\\"is_correct\\\":false},{\\\"id\\\":\\\"C\\\",\\\"text\\\":\\\"Chạy đơn luồng JS engine nhưng đa luồng xử lý IO\\\",\\\"is_correct\\\":false}]\"', 'Node.js hoạt động dựa trên cơ chế đơn luồng (Single-thread event loop) để thông dịch JavaScript.', 5, 1, '2026-05-27 08:54:01', '2026-05-27 08:54:01'),
('e772a082-b7b2-487d-a8c3-26beaece2c86', 'b8c94ad3-5056-4882-871d-72aab6e77595', 'Thư viện nào cung cấp nhân ThreadPool xử lý bất đồng bộ trong Node.js?', 'single', '\"[{\\\"id\\\":\\\"A\\\",\\\"text\\\":\\\"V8 Engine\\\",\\\"is_correct\\\":false},{\\\"id\\\":\\\"B\\\",\\\"text\\\":\\\"libuv\\\",\\\"is_correct\\\":true},{\\\"id\\\":\\\"C\\\",\\\"text\\\":\\\"OpenSSL\\\",\\\"is_correct\\\":false}]\"', 'Thư viện C++ libuv cung cấp cơ chế Event Loop và Thread Pool 4 luồng mặc định cho Node.js.', 5, 2, '2026-05-27 08:54:01', '2026-05-27 08:54:01');

-- --------------------------------------------------------

--
-- Table structure for table `submissions`
--

CREATE TABLE `submissions` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `assignment_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `attempt_number` int NOT NULL DEFAULT 1,
  `answers` json NOT NULL,
  `score` float NULL DEFAULT NULL,
  `status` enum('in_progress','submitted','graded') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'submitted',
  `feedback` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `graded_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `graded_at` datetime NULL DEFAULT NULL,
  `submitted_at` datetime NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

--
-- Dumping data for table `submissions`
--

INSERT INTO `submissions` (`id`, `assignment_id`, `user_id`, `attempt_number`, `answers`, `score`, `status`, `feedback`, `graded_by`, `graded_at`, `submitted_at`, `created_at`, `updated_at`) VALUES
('sub00001-0000-0000-0000-000000000001', 'b8c94ad3-5056-4882-871d-72aab6e77595', 'u-studen-000000000000000000000000001', 1, '[{\"question_id\":\"d6ed85b9-4a1c-4b30-8f23-6994371b8748\",\"selected_options\":[\"A\"]},{\"question_id\":\"e772a082-b7b2-487d-a8c3-26beaece2c86\",\"selected_options\":[\"B\"]}]', 10, 'graded', NULL, NULL, '2026-06-01 10:00:00', '2026-06-01 10:00:00', '2026-06-01 10:00:00', '2026-06-01 10:00:00'),
('sub00001-0000-0000-0000-000000000002', 'e1a2b3c4-d5e6-f7a8-b9c0-d1e2f3a4b5c6', 'u-studen-000000000000000000000000001', 1, '{\"text\":\"Middleware trong Express.js là các hàm có thể truy cập vào đối tượng request, response và hàm next. Middleware được sử dụng để xử lý các tác vụ như xác thực, logging, parse body request, xử lý lỗi và nhiều tác vụ khác.\"}', NULL, 'submitted', NULL, NULL, NULL, '2026-06-01 11:00:00', '2026-06-01 11:00:00', '2026-06-01 11:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `student_profiles`
--

CREATE TABLE `student_profiles` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `date_of_birth` date DEFAULT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `school_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `grade_level` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `student_profiles`
--

INSERT INTO `student_profiles` (`id`, `user_id`, `date_of_birth`, `phone`, `address`, `school_name`, `grade_level`, `created_at`, `updated_at`) VALUES
('3b5039ae-6ed5-42aa-a1b1-ad04b3dfb120', 'u-studen-000000000000000000000000001', NULL, NULL, NULL, 'Đại học Công nghệ Thông tin', 'Năm 3', '2026-05-27 08:53:58', '2026-05-27 08:53:58'),
('abdf6d07-db76-4d61-861d-705adeec9d10', 'u-studen-000000000000000000000000002', NULL, NULL, NULL, 'Đại học Bách Khoa', 'Năm 2', '2026-05-27 08:53:58', '2026-05-27 08:53:58'),
('bdefea64-fdba-4616-b6b2-159a16dea392', 'u-studen-000000000000000000000000003', NULL, NULL, NULL, 'Đại học KHTN', 'Năm 4', '2026-05-27 08:53:58', '2026-05-27 08:53:58');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_type` enum('student','instructor','admin') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'student',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `reset_password_token` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reset_password_expires` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `username`, `password_hash`, `full_name`, `user_type`, `is_active`, `reset_password_token`, `reset_password_expires`, `created_at`, `updated_at`) VALUES
('u-admin-0000000000000000000000000001', 'admin@eduvi.com', 'sysadmin', '$2a$10$XvaC7rVX3KibE9Uxhm9gFep2Uer5PSDNmc/Gu9XW0fAw2cMTGNWoK', 'Quản trị viên Hệ thống', 'admin', 1, NULL, NULL, '2026-05-27 08:53:58', '2026-05-27 08:53:58'),
('u-instru-000000000000000000000000001', 'binhtt@gmail.com', 'binhtt', '$2a$10$XvaC7rVX3KibE9Uxhm9gFep2Uer5PSDNmc/Gu9XW0fAw2cMTGNWoK', 'TS. Trần Thị Bình', 'instructor', 1, NULL, NULL, '2026-05-27 08:53:58', '2026-05-27 08:53:58'),
('u-instru-000000000000000000000000002', 'hongvt@gmail.com', 'hongvt@921', '$2a$10$XvaC7rVX3KibE9Uxhm9gFep2Uer5PSDNmc/Gu9XW0fAw2cMTGNWoK', 'ThS. Vũ Thị Hồng', 'instructor', 1, NULL, NULL, '2026-05-27 08:53:58', '2026-05-27 08:53:58'),
('u-studen-000000000000000000000000001', 'annv@gmail.com', 'annv', '$2a$10$XvaC7rVX3KibE9Uxhm9gFep2Uer5PSDNmc/Gu9XW0fAw2cMTGNWoK', 'Nguyễn Văn An', 'student', 1, NULL, NULL, '2026-05-27 08:53:58', '2026-05-27 08:53:58'),
('u-studen-000000000000000000000000002', 'cuonglh@gmail.com', 'cuonglh@441', '$2a$10$XvaC7rVX3KibE9Uxhm9gFep2Uer5PSDNmc/Gu9XW0fAw2cMTGNWoK', 'Lê Hoàng Cường', 'student', 1, NULL, NULL, '2026-05-27 08:53:58', '2026-05-27 08:53:58'),
('u-studen-000000000000000000000000003', 'ducpm@gmail.com', 'ducpm@782', '$2a$10$XvaC7rVX3KibE9Uxhm9gFep2Uer5PSDNmc/Gu9XW0fAw2cMTGNWoK', 'Phạm Minh Đức', 'student', 1, NULL, NULL, '2026-05-27 08:53:58', '2026-05-27 08:53:58');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `assignments`
--
ALTER TABLE `assignments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `course_id` (`course_id`),
  ADD KEY `lesson_id` (`lesson_id`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD KEY `parent_id` (`parent_id`);

--
-- Indexes for table `courses`
--
ALTER TABLE `courses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD KEY `category_id` (`category_id`);
ALTER TABLE `courses` ADD FULLTEXT KEY `ft_courses_search` (`title`,`short_description`);

--
-- Indexes for table `course_instructors`
--
ALTER TABLE `course_instructors`
  ADD PRIMARY KEY (`course_id`,`instructor_id`),
  ADD UNIQUE KEY `course_instructors_instructor_id_course_id_unique` (`course_id`,`instructor_id`),
  ADD KEY `instructor_id` (`instructor_id`);

--
-- Indexes for table `course_materials`
--
ALTER TABLE `course_materials`
  ADD PRIMARY KEY (`id`),
  ADD KEY `course_id` (`course_id`),
  ADD KEY `lesson_id` (`lesson_id`);

--
-- Indexes for table `enrollments`
--
ALTER TABLE `enrollments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `enrollments_user_id_course_id` (`user_id`,`course_id`),
  ADD KEY `enrollments_user_id` (`user_id`),
  ADD KEY `enrollments_course_id` (`course_id`),
  ADD KEY `enrollments_status` (`status`);

--
-- Indexes for table `instructor_profiles`
--
ALTER TABLE `instructor_profiles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`);

--
-- Indexes for table `lessons`
--
ALTER TABLE `lessons`
  ADD PRIMARY KEY (`id`),
  ADD KEY `course_id` (`course_id`);

--
-- Indexes for table `lesson_progress`
--
ALTER TABLE `lesson_progress`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `lesson_progress_user_id_lesson_id` (`user_id`,`lesson_id`),
  ADD KEY `lesson_id` (`lesson_id`),
  ADD KEY `course_id` (`course_id`),
  ADD KEY `lesson_progress_user_id_course_id` (`user_id`,`course_id`);

--
-- Indexes for table `quiz_questions`
--
ALTER TABLE `quiz_questions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `assignment_id` (`assignment_id`);

--
-- Indexes for table `submissions`
--
ALTER TABLE `submissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_assignment_user_attempt` (`assignment_id`,`user_id`,`attempt_number`),
  ADD KEY `idx_submission_assignment` (`assignment_id`),
  ADD KEY `idx_submission_user` (`user_id`),
  ADD KEY `idx_submission_graded_by` (`graded_by`);

--
-- Indexes for table `student_profiles`
--
ALTER TABLE `student_profiles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Constraints for dumped tables
--

--
-- Constraints for table `assignments`
--
ALTER TABLE `assignments`
  ADD CONSTRAINT `assignments_ibfk_1` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `assignments_ibfk_2` FOREIGN KEY (`lesson_id`) REFERENCES `lessons` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `categories`
--
ALTER TABLE `categories`
  ADD CONSTRAINT `categories_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `courses`
--
ALTER TABLE `courses`
  ADD CONSTRAINT `courses_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `course_instructors`
--
ALTER TABLE `course_instructors`
  ADD CONSTRAINT `course_instructors_ibfk_1` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `course_instructors_ibfk_2` FOREIGN KEY (`instructor_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `course_materials`
--
ALTER TABLE `course_materials`
  ADD CONSTRAINT `course_materials_ibfk_1` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `course_materials_ibfk_2` FOREIGN KEY (`lesson_id`) REFERENCES `lessons` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `enrollments`
--
ALTER TABLE `enrollments`
  ADD CONSTRAINT `enrollments_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `enrollments_ibfk_2` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `instructor_profiles`
--
ALTER TABLE `instructor_profiles`
  ADD CONSTRAINT `instructor_profiles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `lessons`
--
ALTER TABLE `lessons`
  ADD CONSTRAINT `lessons_ibfk_1` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `lesson_progress`
--
ALTER TABLE `lesson_progress`
  ADD CONSTRAINT `lesson_progress_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `lesson_progress_ibfk_2` FOREIGN KEY (`lesson_id`) REFERENCES `lessons` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `lesson_progress_ibfk_3` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `quiz_questions`
--
ALTER TABLE `quiz_questions`
  ADD CONSTRAINT `quiz_questions_ibfk_1` FOREIGN KEY (`assignment_id`) REFERENCES `assignments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `submissions`
--
ALTER TABLE `submissions`
  ADD CONSTRAINT `fk_submissions_assignment` FOREIGN KEY (`assignment_id`) REFERENCES `assignments` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  ADD CONSTRAINT `fk_submissions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  ADD CONSTRAINT `fk_submissions_graded_by` FOREIGN KEY (`graded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

--
-- Constraints for table `student_profiles`
--
ALTER TABLE `student_profiles`
  ADD CONSTRAINT `student_profiles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
