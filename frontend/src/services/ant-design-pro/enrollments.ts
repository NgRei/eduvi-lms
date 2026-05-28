import { request } from '@umijs/max';
import type { DeleteResponse, EnrollmentStatus, Pagination } from './types';

// --- Interfaces ---

export interface EnrollmentCourse {
  id: string;
  title: string;
  slug: string;
  thumbnail: string | null;
  price: number;
  sale_price: number | null;
  total_lessons: number;
  rating_avg: number;
  instructors?: {
    id: string;
    full_name: string;
    username: string;
  }[];
}

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  status: EnrollmentStatus;
  progress_percentage: number;
  completed_at: string | null;
  certificate_issued: boolean;
  enrolled_at: string;
  expired_at: string | null;
  course?: EnrollmentCourse;
}

export interface MyEnrollmentsResponse {
  success: boolean;
  data: Enrollment[];
  pagination: Pagination;
}

export interface EnrollResponse {
  success: boolean;
  message?: string;
  data?: Enrollment;
}

export interface CheckEnrollmentData {
  enrolled: boolean;
  enrollment: {
    id: string;
    status: EnrollmentStatus;
    progress_percentage: number;
    enrolled_at: string;
  } | null;
}

export interface CheckEnrollmentResponse {
  success: boolean;
  data: CheckEnrollmentData;
}

// --- Functions ---

export async function enrollCourse(courseId: string) {
  return request<EnrollResponse>('/api/enrollments', {
    method: 'POST',
    data: { course_id: courseId },
  });
}

export async function unenrollCourse(enrollmentId: string) {
  return request<DeleteResponse>(`/api/enrollments/${enrollmentId}`, {
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
