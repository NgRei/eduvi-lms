import { request } from '@umijs/max';

// --- Interfaces ---

export interface AdminDashboardData {
  totalStudents: number;
  totalInstructors: number;
  totalCourses: number;
  activeCourses: number;
  totalEnrollments: number;
  recentUsers: {
    id: string;
    full_name: string;
    email: string;
    user_type: string;
    created_at: string;
  }[];
}

export interface AdminUser {
  id: string;
  email: string;
  username: string;
  full_name: string;
  user_type: string;
  is_active: boolean;
  created_at: string;
  studentProfile?: {
    date_of_birth?: string;
    phone?: string;
    school_name?: string;
    grade_level?: string;
  } | null;
  instructorProfile?: {
    expertise?: string;
    experience_years?: number;
    degree?: string;
  } | null;
}

export interface AdminUsersResponse {
  success: boolean;
  data: AdminUser[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface AdminDashboardResponse {
  success: boolean;
  data: AdminDashboardData;
}

export interface AdminUserResponse {
  success: boolean;
  data: AdminUser;
}

export interface AdminActionResponse {
  success: boolean;
  message?: string;
  data?: AdminUser;
}

// --- Functions ---

export async function getAdminDashboard() {
  return request<AdminDashboardResponse>('/api/admin/dashboard', {
    method: 'GET',
  });
}

export async function getUsers(params?: {
  page?: number;
  limit?: number;
  user_type?: string;
  is_active?: string;
  search?: string;
}) {
  return request<AdminUsersResponse>('/api/admin/users', {
    method: 'GET',
    params,
  });
}

export async function getUserById(id: string) {
  return request<AdminUserResponse>(`/api/admin/users/${id}`, {
    method: 'GET',
  });
}

export async function createUser(data: {
  email: string;
  password: string;
  full_name: string;
  user_type: string;
  phone?: string;
  school_name?: string;
  expertise?: string;
}) {
  return request<AdminActionResponse>('/api/admin/users', {
    method: 'POST',
    data,
  });
}

export async function updateUser(id: string, data: { full_name?: string; email?: string; user_type?: string }) {
  return request<AdminActionResponse>(`/api/admin/users/${id}`, {
    method: 'PUT',
    data,
  });
}

export async function updateUserStatus(id: string, isActive: boolean) {
  return request<{ success: boolean; message?: string }>(`/api/admin/users/${id}/status`, {
    method: 'PUT',
    data: { is_active: isActive },
  });
}

export async function deleteUser(id: string) {
  return request<{ success: boolean; message?: string }>(`/api/admin/users/${id}`, {
    method: 'DELETE',
  });
}
