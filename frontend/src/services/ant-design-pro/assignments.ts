import { request } from '@umijs/max';
import type { Pagination, DeleteResponse } from './types';

// --- Interfaces ---

export interface AssignmentOption {
  id: string;
  text: string;
  is_correct: boolean;
}

export interface QuizQuestion {
  id: string;
  assignment_id: string;
  question_text: string;
  question_type: 'single' | 'multiple' | 'true_false';
  options: AssignmentOption[];
  explanation: string | null;
  points: number;
  sort_order: number;
}

export interface Assignment {
  id: string;
  course_id: string;
  lesson_id: string | null;
  title: string;
  description: string | null;
  assignment_type: 'quiz' | 'essay' | 'upload';
  total_points: number;
  passing_score: number;
  time_limit_minutes: number | null;
  attempts_allowed: number;
  show_answer_after: boolean;
  due_date: string | null;
  is_published: boolean;
  questions?: QuizQuestion[];
  course?: { id: string; title: string };
  lesson?: { id: string; title: string };
  submissions_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Submission {
  id: string;
  assignment_id: string;
  user_id: string;
  attempt_number: number;
  answers: any;
  score: number | null;
  status: 'in_progress' | 'submitted' | 'graded';
  feedback: string | null;
  graded_by: string | null;
  graded_at: string | null;
  submitted_at: string;
  user?: { id: string; full_name: string; username: string };
  grader?: { id: string; full_name: string };
  assignment?: Assignment;
  question_results?: any[];
}

export interface AssignmentsResponse {
  success: boolean;
  data: Assignment[];
  pagination: Pagination;
}

export interface AssignmentDetailResponse {
  success: boolean;
  data: Assignment;
}

export interface SubmissionsResponse {
  success: boolean;
  data: Submission[];
  pagination: Pagination;
}

export interface SubmissionDetailResponse {
  success: boolean;
  data: Submission;
}

export interface SubmitResponse {
  success: boolean;
  message: string;
  data: {
    submission: Submission;
    grading?: {
      score: number;
      total: number;
      passed: boolean;
      results: any[];
    };
  };
}

// --- Functions ---

export async function getAssignments(params?: {
  lesson_id?: string;
  course_id?: string;
  type?: string;
  is_published?: string;
  page?: number;
  limit?: number;
}) {
  return request<AssignmentsResponse>('/api/assignments', {
    method: 'GET',
    params,
  });
}

export async function getAssignment(id: string) {
  return request<AssignmentDetailResponse>(`/api/assignments/${id}`, {
    method: 'GET',
  });
}

export async function createAssignment(data: {
  lesson_id?: string;
  course_id?: string;
  title: string;
  description?: string;
  assignment_type?: 'quiz' | 'essay' | 'upload';
  total_points?: number;
  passing_score?: number;
  time_limit_minutes?: number;
  attempts_allowed?: number;
  show_answer_after?: boolean;
  due_date?: string;
}) {
  return request<{ success: boolean; data: Assignment }>('/api/assignments', {
    method: 'POST',
    data,
  });
}

export async function updateAssignment(id: string, data: Partial<Assignment>) {
  return request<{ success: boolean; data: Assignment }>(`/api/assignments/${id}`, {
    method: 'PUT',
    data,
  });
}

export async function deleteAssignment(id: string) {
  return request<DeleteResponse>(`/api/assignments/${id}`, {
    method: 'DELETE',
  });
}

export async function publishAssignment(id: string) {
  return request<{ success: boolean; data: Assignment }>(`/api/assignments/${id}/publish`, {
    method: 'PATCH',
  });
}

export async function addQuestion(assignmentId: string, data: Partial<QuizQuestion>) {
  return request<{ success: boolean; data: QuizQuestion }>(`/api/assignments/${assignmentId}/questions`, {
    method: 'POST',
    data,
  });
}

export async function updateQuestion(id: string, data: Partial<QuizQuestion>) {
  return request<{ success: boolean; data: QuizQuestion }>(`/api/assignments/questions/${id}`, {
    method: 'PUT',
    data,
  });
}

export async function deleteQuestion(id: string) {
  return request<DeleteResponse>(`/api/assignments/questions/${id}`, {
    method: 'DELETE',
  });
}

export async function reorderQuestions(assignmentId: string, order: string[]) {
  return request<{ success: boolean }>(`/api/assignments/${assignmentId}/questions/reorder`, {
    method: 'PUT',
    data: { order },
  });
}

export async function submitAssignment(assignmentId: string, answers: any) {
  return request<SubmitResponse>(`/api/assignments/${assignmentId}/submit`, {
    method: 'POST',
    data: { answers },
  });
}

export async function getMySubmissions(assignmentId: string) {
  return request<{ success: boolean; data: Submission[] }>(`/api/assignments/${assignmentId}/submissions`, {
    method: 'GET',
  });
}

export async function getSubmission(id: string) {
  return request<SubmissionDetailResponse>(`/api/submissions/${id}`, {
    method: 'GET',
  });
}

export async function getSubmissionsForGrading(assignmentId: string, params?: {
  status?: string;
  page?: number;
  limit?: number;
}) {
  return request<SubmissionsResponse>(`/api/assignments/${assignmentId}/grading`, {
    method: 'GET',
    params,
  });
}

export async function gradeSubmission(id: string, data: { score: number; feedback?: string }) {
  return request<{ success: boolean; data: Submission }>(`/api/submissions/${id}/grade`, {
    method: 'PUT',
    data,
  });
}
