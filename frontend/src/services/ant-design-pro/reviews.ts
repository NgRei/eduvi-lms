import { request } from '@umijs/max';

export interface Review {
  id: string;
  course_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
}

export interface ReviewsResponse {
  success: boolean;
  data: Review[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ReviewResponse {
  success: boolean;
  data: Review;
  message?: string;
}

// GET /api/reviews/:courseId
export async function getCourseReviews(courseId: string, params?: { page?: number; limit?: number }) {
  return request<ReviewsResponse>(`/api/reviews/${courseId}`, {
    method: 'GET',
    params,
  });
}

// POST /api/reviews/:courseId
export async function createReview(courseId: string, data: { rating: number; comment?: string }) {
  return request<ReviewResponse>(`/api/reviews/${courseId}`, {
    method: 'POST',
    data,
  });
}

// PUT /api/reviews/:reviewId
export async function updateReview(reviewId: string, data: { rating?: number; comment?: string }) {
  return request<ReviewResponse>(`/api/reviews/${reviewId}`, {
    method: 'PUT',
    data,
  });
}

// DELETE /api/reviews/:reviewId
export async function deleteReview(reviewId: string) {
  return request<{ success: boolean; message: string }>(`/api/reviews/${reviewId}`, {
    method: 'DELETE',
  });
}
