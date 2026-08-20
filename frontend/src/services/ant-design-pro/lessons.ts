import { request } from '@umijs/max';
import type { DeleteResponse } from './types';

// --- Interfaces ---

export interface LessonMaterial {
  id: string;
  title: string;
  material_type: 'pdf' | 'video' | 'slide' | 'link' | 'zip' | 'other';
  file_url: string;
  file_size_kb: number | null;
  is_downloadable: boolean;
}

export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  sort_order: number;
  lesson_type: 'video' | 'text' | 'pdf' | 'slide' | 'quiz';
  content_url: string | null;
  content_text: string | null;
  duration_minutes: number | null;
  is_preview: boolean;
  is_published: boolean;
  video_id: string | null;
  created_at: string;
  updated_at: string;
  course?: { id: string; title: string; slug: string };
  materials?: LessonMaterial[];
}

export interface LessonDetailResponse {
  success: boolean;
  data: Lesson;
}

export interface LessonsListResponse {
  success: boolean;
  data: Lesson[];
}

export interface LessonMutationResponse {
  success: boolean;
  message?: string;
  data?: Lesson;
}

// --- Functions ---

export async function getLessonById(id: string) {
  return request<LessonDetailResponse>(`/api/lessons/${id}`, {
    method: 'GET',
  });
}

export async function getLessonsByCourse(courseId: string) {
  return request<LessonsListResponse>(`/api/courses/${courseId}/lessons`, {
    method: 'GET',
  });
}

export async function createLesson(
  courseId: string,
  data: {
    title: string;
    sort_order?: number;
    lesson_type?: 'video' | 'text' | 'pdf' | 'slide' | 'quiz';
    content_url?: string;
    content_text?: string;
    duration_minutes?: number;
    is_preview?: boolean;
  },
) {
  return request<LessonMutationResponse>(`/api/courses/${courseId}/lessons`, {
    method: 'POST',
    data,
  });
}

export async function updateLesson(
  id: string,
  data: {
    title?: string;
    sort_order?: number;
    lesson_type?: 'video' | 'text' | 'pdf' | 'slide' | 'quiz';
    content_url?: string;
    content_text?: string;
    duration_minutes?: number;
    is_preview?: boolean;
    is_published?: boolean;
  },
) {
  return request<LessonMutationResponse>(`/api/lessons/${id}`, {
    method: 'PUT',
    data,
  });
}

export async function deleteLesson(id: string) {
  return request<DeleteResponse>(`/api/lessons/${id}`, {
    method: 'DELETE',
  });
}

export async function reorderLessons(courseId: string, lessonIds: string[]) {
  return request<DeleteResponse>(
    `/api/courses/${courseId}/lessons/reorder`,
    {
      method: 'PUT',
      data: { lessonIds },
    },
  );
}

export async function addLessonMaterial(
  lessonId: string,
  data: {
    title: string;
    material_type: 'pdf' | 'video' | 'slide' | 'link' | 'zip' | 'other';
    file_url: string;
    file_size_kb?: number;
    is_downloadable?: boolean;
  },
) {
  return request<any>(`/api/lessons/${lessonId}/materials`, {
    method: 'POST',
    data,
  });
}

export async function deleteLessonMaterial(lessonId: string, materialId: string) {
  return request<any>(`/api/lessons/${lessonId}/materials/${materialId}`, {
    method: 'DELETE',
  });
}
