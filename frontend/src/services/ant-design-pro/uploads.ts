import { request } from '@umijs/max';
import type { DeleteResponse } from './types';

// --- Interfaces ---

export interface VideoUploadResponse {
  success: boolean;
  message?: string;
  data?: {
    id: string;
    cloudinary_id: string;
    original_name: string;
    format: string;
    duration: number;
    size_bytes: number;
    thumbnail_url: string | null;
  };
}

export interface ImageUploadResponse {
  success: boolean;
  message?: string;
  data?: {
    url: string;
    public_id: string;
    format: string;
    width: number;
    height: number;
  };
}

export interface SignedUrlResponse {
  success: boolean;
  data?: {
    url: string;
    expires_in: number;
    video: {
      id: string;
      duration: number;
      format: string;
      thumbnail_url: string | null;
    };
  };
}

export interface VideoItem {
  id: string;
  original_name: string;
  format: string;
  duration: number;
  size_bytes: number;
  thumbnail_url: string | null;
  lesson_id: string | null;
  created_at: string;
}

export interface VideosByCourseResponse {
  success: boolean;
  data: VideoItem[];
}

// --- Functions ---

export async function uploadVideo(file: File, courseId: string, lessonId?: string) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('course_id', courseId);
  if (lessonId) {
    formData.append('lesson_id', lessonId);
  }

  return request<VideoUploadResponse>('/api/uploads/video', {
    method: 'POST',
    data: formData,
    requestType: 'form',
  });
}

export async function uploadImage(file: File, folder?: string) {
  const formData = new FormData();
  formData.append('file', file);
  if (folder) {
    formData.append('folder', folder);
  }

  return request<ImageUploadResponse>('/api/uploads/image', {
    method: 'POST',
    data: formData,
    requestType: 'form',
  });
}

export async function uploadRawFile(file: File, folder?: string) {
  const formData = new FormData();
  formData.append('file', file);
  if (folder) {
    formData.append('folder', folder);
  }

  return request<any>('/api/uploads/raw', {
    method: 'POST',
    data: formData,
    requestType: 'form',
  });
}

export async function getSignedVideoUrl(videoId: string, courseId: string) {
  return request<SignedUrlResponse>(`/api/uploads/video/${videoId}/signed-url`, {
    method: 'GET',
    params: { course_id: courseId },
  });
}

export async function getVideosByCourse(courseId: string) {
  return request<VideosByCourseResponse>(`/api/uploads/video/course/${courseId}`, {
    method: 'GET',
  });
}

export async function deleteVideo(videoId: string) {
  return request<DeleteResponse>(`/api/uploads/video/${videoId}`, {
    method: 'DELETE',
  });
}
