import { request } from '@umijs/max';

export interface AuditLogEntry {
  id: number;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  detail: Record<string, any> | null;
  ip_address: string | null;
  created_at: string;
  user?: {
    id: string;
    full_name: string;
    email: string;
    user_type: string;
  };
}

export interface AuditLogsResponse {
  success: boolean;
  data: AuditLogEntry[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// GET /api/audit-logs
export async function getAuditLogs(params?: {
  page?: number;
  limit?: number;
  action?: string;
  user_id?: string;
}) {
  return request<AuditLogsResponse>('/api/audit-logs', {
    method: 'GET',
    params,
  });
}
