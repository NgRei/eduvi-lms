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
