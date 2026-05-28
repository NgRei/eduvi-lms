import { request } from '@umijs/max';
import type { DeleteResponse, Pagination } from './types';

// --- Interfaces ---

export interface CourseCategory {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  icon_url: string | null;
  sort_order: number;
  is_active: boolean;
  children?: CourseCategory[];
}

export interface CourseInstructor {
  id: string;
  full_name: string;
  username: string;
  email?: string;
  course_instructor?: {
    is_primary: boolean;
  };
}

export interface CourseItem {
  id: string;
  title: string;
  slug: string;
  short_description: string | null;
  thumbnail: string | null;
  price: number;
  sale_price: number | null;
  target_level: 'beginner' | 'intermediate' | 'advanced' | 'all';
  language: string;
  is_published: boolean;
  total_lessons: number;
  total_students: number;
  rating_avg: number;
  category?: { id: string; name: string; slug: string } | null;
  instructors?: CourseInstructor[];
  created_at: string;
  updated_at: string;
}

export interface LessonBrief {
  id: string;
  title: string;
  sort_order: number;
  lesson_type: 'video' | 'text' | 'quiz' | 'live';
  duration_minutes: number | null;
  is_preview: boolean;
}

export interface CourseMaterialBrief {
  id: string;
  title: string;
  material_type: 'pdf' | 'video' | 'slide' | 'link' | 'zip' | 'other';
  file_url: string;
  file_size_kb: number | null;
  is_downloadable: boolean;
}

export interface CourseDetail extends CourseItem {
  description: string | null;
  published_at: string | null;
  max_students: number | null;
  duration_weeks: number | null;
  deleted_at: string | null;
  lessons?: LessonBrief[];
  materials?: CourseMaterialBrief[];
  is_enrolled?: boolean;
  enrollment?: {
    status: string;
    progress_percentage: number;
  } | null;
}

export interface CoursesResponse {
  success: boolean;
  data: CourseItem[];
  pagination: Pagination;
}

export interface CourseDetailResponse {
  success: boolean;
  data: CourseDetail;
}

export interface CategoriesResponse {
  success: boolean;
  data: CourseCategory[];
}

export interface CourseMutationResponse {
  success: boolean;
  message?: string;
  data?: CourseItem;
}

// --- Functions ---

export async function getCourses(params?: {
  page?: number;
  limit?: number;
  category_id?: string;
  target_level?: string;
  search?: string;
  sort?: string;
}) {
  return request<CoursesResponse>('/api/courses', {
    method: 'GET',
    params,
  });
}

export async function getCourseById(id: string) {
  return request<CourseDetailResponse>(`/api/courses/${id}`, {
    method: 'GET',
  });
}

export async function getCategories() {
  return request<CategoriesResponse>('/api/courses/categories', {
    method: 'GET',
  });
}

export async function createCourse(data: {
  title: string;
  category_id?: string;
  short_description?: string;
  description?: string;
  thumbnail?: string;
  price?: number;
  sale_price?: number;
  target_level?: 'beginner' | 'intermediate' | 'advanced' | 'all';
  language?: string;
  max_students?: number;
  duration_weeks?: number;
}) {
  return request<CourseMutationResponse>('/api/courses', {
    method: 'POST',
    data,
  });
}

export async function updateCourse(
  id: string,
  data: {
    title?: string;
    category_id?: string;
    short_description?: string;
    description?: string;
    thumbnail?: string;
    price?: number;
    sale_price?: number;
    target_level?: 'beginner' | 'intermediate' | 'advanced' | 'all';
    language?: string;
    max_students?: number;
    duration_weeks?: number;
    is_published?: boolean;
  },
) {
  return request<CourseMutationResponse>(`/api/courses/${id}`, {
    method: 'PUT',
    data,
  });
}

export async function deleteCourse(id: string) {
  return request<DeleteResponse>(`/api/courses/${id}`, {
    method: 'DELETE',
  });
}

export async function getInstructorCourses(params?: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  return request<CoursesResponse>('/api/courses/instructor/me', {
    method: 'GET',
    params,
  });
}
