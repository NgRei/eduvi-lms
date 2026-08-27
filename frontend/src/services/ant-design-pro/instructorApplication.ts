import { request } from '@umijs/max';

export interface InstructorApplication {
  id: string;
  user_id: string;
  headline: string;
  bio: string;
  expertise: string;
  experience_years: number;
  education_degree?: string | null;
  phone_number?: string | null;
  linkedin_url?: string | null;
  portfolio_url?: string | null;
  cv_url?: string | null;
  intro_video_url?: string | null;
  teaching_reason?: string | null;
  course_proposal?: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'need_info';
  rejection_reason?: string | null;
  admin_notes?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  updated_at: string;
  candidate?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string | null;
    user_type: string;
    created_at: string;
  };
  reviewer?: {
    id: string;
    full_name: string;
    email: string;
  };
}

export interface SubmitApplicationParams {
  headline: string;
  bio: string;
  expertise: string;
  experience_years: number;
  education_degree?: string;
  phone_number?: string;
  linkedin_url?: string;
  portfolio_url?: string;
  cv_url?: string;
  intro_video_url?: string;
  teaching_reason?: string;
  course_proposal?: string;
}

export interface ApplicationResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: InstructorApplication;
}

export interface AdminApplicationsResponse {
  success: boolean;
  data: InstructorApplication[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface RegisterAndApplyParams extends SubmitApplicationParams {
  email: string;
  password: string;
  full_name: string;
}

export interface RegisterAndApplyResponse {
  success: boolean;
  message?: string;
  error?: string;
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  user?: {
    id: string;
    email: string;
    username: string;
    full_name: string;
    user_type: string;
  };
  data?: InstructorApplication;
}

/**
 * Public / Guest: Register Account & Submit Instructor Application in one flow
 */
export async function registerAndApplyInstructor(data: RegisterAndApplyParams) {
  return request<RegisterAndApplyResponse>('/api/instructor-applications/register-and-apply', {
    method: 'POST',
    data,
  });
}

/**
 * Candidate: Submit a new Instructor Application
 */
export async function submitInstructorApplication(data: SubmitApplicationParams) {
  return request<ApplicationResponse>('/api/instructor-applications', {
    method: 'POST',
    data,
  });
}

/**
 * Candidate: Get current user's latest application
 */
export async function getMyInstructorApplication() {
  return request<ApplicationResponse>('/api/instructor-applications/my-application', {
    method: 'GET',
  });
}

/**
 * Candidate: Update and resubmit an application
 */
export async function updateMyInstructorApplication(data: Partial<SubmitApplicationParams>) {
  return request<ApplicationResponse>('/api/instructor-applications/my-application', {
    method: 'PUT',
    data,
  });
}

/**
 * Admin: Get list of applications
 */
export async function getAdminInstructorApplications(params?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}) {
  return request<AdminApplicationsResponse>('/api/instructor-applications/admin', {
    method: 'GET',
    params,
  });
}

/**
 * Admin: Get single application details
 */
export async function getAdminInstructorApplicationById(id: string) {
  return request<ApplicationResponse>(`/api/instructor-applications/admin/${id}`, {
    method: 'GET',
  });
}

/**
 * Admin: Approve instructor application
 */
export async function approveInstructorApplication(id: string, data?: { admin_notes?: string }) {
  return request<ApplicationResponse>(`/api/instructor-applications/admin/${id}/approve`, {
    method: 'POST',
    data,
  });
}

/**
 * Admin: Reject instructor application with reason
 */
export async function rejectInstructorApplication(id: string, data: { rejection_reason: string; admin_notes?: string }) {
  return request<ApplicationResponse>(`/api/instructor-applications/admin/${id}/reject`, {
    method: 'POST',
    data,
  });
}
