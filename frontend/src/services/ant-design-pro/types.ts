// Shared types for API service files

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export type DeleteResponse = { success: boolean; message?: string };

export type EnrollmentStatus = 'active' | 'completed' | 'dropped' | 'expired';
