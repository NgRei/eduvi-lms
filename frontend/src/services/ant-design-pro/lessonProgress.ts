import { request } from '@umijs/max';

// --- Interfaces ---

export interface LessonProgressItem {
  is_completed: boolean;
  watch_duration: number;
  last_position: number;
  completed_at: string | null;
}

/** Map of lesson_id -> LessonProgressItem */
export interface LessonProgressMapResponse {
  success: boolean;
  data: Record<string, LessonProgressItem>;
}

export interface ProgressActionResponse {
  success: boolean;
  message?: string;
  data?: {
    id: string;
    user_id: string;
    lesson_id: string;
    course_id: string;
    is_completed: boolean;
    watch_duration: number;
    last_position: number;
    completed_at: string | null;
  };
}

// --- Functions ---

export async function markLessonComplete(lessonId: string, courseId: string) {
  return request<ProgressActionResponse>('/api/lesson-progress/complete', {
    method: 'POST',
    data: { lesson_id: lessonId, course_id: courseId },
  });
}

export async function unmarkLessonComplete(lessonId: string, courseId: string) {
  return request<ProgressActionResponse>('/api/lesson-progress/uncomplete', {
    method: 'PUT',
    data: { lesson_id: lessonId, course_id: courseId },
  });
}

export async function updateWatchPosition(data: {
  lesson_id: string;
  course_id: string;
  last_position?: number;
  watch_duration?: number;
}) {
  return request<ProgressActionResponse>('/api/lesson-progress/position', {
    method: 'PUT',
    data,
  });
}

export async function getLessonProgress(courseId: string) {
  return request<LessonProgressMapResponse>(`/api/lesson-progress/${courseId}`, {
    method: 'GET',
  });
}
