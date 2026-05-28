import { request } from '@umijs/max';

export interface StudentDashboardStats {
  total_enrollments: number;
  active_courses: number;
  completed_courses: number;
  overall_progress: number;
  lessons_completed: number;
  watch_minutes: number;
}

export interface RecentCourse {
  enrollment_id: string;
  course_id: string;
  title: string;
  slug: string;
  thumbnail: string | null;
  progress_percentage: number;
  total_lessons: number;
  instructors: string[];
  updated_at: string;
}

export interface RecentActivity {
  lesson_id: string;
  lesson_title: string;
  lesson_type: string;
  course_id: string;
  is_completed: boolean;
  last_position: number;
  updated_at: string;
}

export interface StudentDashboardData {
  stats: StudentDashboardStats;
  recent_courses: RecentCourse[];
  recent_activity: RecentActivity[];
}

export interface InstructorDashboardStats {
  total_courses: number;
  published_courses: number;
  draft_courses: number;
  total_students: number;
  active_students: number;
  average_rating: number;
}

export interface InstructorCourse {
  id: string;
  title: string;
  slug: string;
  thumbnail: string | null;
  total_students: number;
  rating_avg: number;
  is_published: boolean;
  is_primary: boolean;
}

export interface RecentEnrollment {
  enrollment_id: string;
  student_name: string;
  student_email: string;
  course_title: string;
  status: string;
  progress_percentage: number;
  enrolled_at: string;
}

export interface InstructorDashboardData {
  stats: InstructorDashboardStats;
  courses: InstructorCourse[];
  recent_enrollments: RecentEnrollment[];
}

export async function getStudentDashboard() {
  return request<{ success: boolean; data: StudentDashboardData }>('/api/dashboard/student', {
    method: 'GET',
  });
}

export async function getInstructorDashboard() {
  return request<{ success: boolean; data: InstructorDashboardData }>('/api/dashboard/instructor', {
    method: 'GET',
  });
}
