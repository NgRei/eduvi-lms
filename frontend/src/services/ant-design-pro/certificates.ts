import { request } from '@umijs/max';

export interface UserCertificate {
  id: string;
  user_id: string;
  certificate_id: string;
  course_id: string;
  cert_code: string;
  issued_at: string;
  expires_at: string | null;
  file_url: string | null;
  certificate?: {
    title: string;
    description: string | null;
    template_url: string | null;
  };
  course?: {
    title: string;
    thumbnail: string | null;
  };
}

export interface CertificateVerifyResult {
  cert_code: string;
  holder_name: string;
  course_title: string;
  certificate_title: string;
  issued_at: string;
  expires_at: string | null;
  is_expired: boolean;
  is_valid: boolean;
}

// GET /api/certificates/my
export async function getMyCertificates() {
  return request<{ success: boolean; data: UserCertificate[] }>('/api/certificates/my', {
    method: 'GET',
  });
}

// POST /api/certificates/issue/:courseId
export async function issueCertificate(courseId: string) {
  return request<{ success: boolean; data: UserCertificate; message?: string }>(
    `/api/certificates/issue/${courseId}`,
    { method: 'POST' }
  );
}

// GET /api/certificates/verify/:certCode
export async function verifyCertificate(certCode: string) {
  return request<{ success: boolean; data: CertificateVerifyResult }>(
    `/api/certificates/verify/${certCode}`,
    { method: 'GET' }
  );
}

export interface CourseCompletionStatus {
  progress_percentage: number;
  lessons_completed: number;
  lessons_total: number;
  final_exam: {
    exists: boolean;
    assignment_id?: string;
    title?: string;
    submitted?: boolean;
    passed?: boolean;
    score?: number | null;
    passing_score?: number;
    total_points?: number;
  };
  certificate: {
    eligible: boolean;
    issued: boolean;
  };
}

// GET /api/certificates/course/:courseId/completion-status
export async function getCourseCompletionStatus(courseId: string) {
  return request<{ success: boolean; data: CourseCompletionStatus }>(
    `/api/certificates/course/${courseId}/completion-status`,
    { method: 'GET' }
  );
}
