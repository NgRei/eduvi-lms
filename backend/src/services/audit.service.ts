import { AuditLog } from '../models';

interface AuditLogInput {
  user_id?: string | null;
  action: string;
  entity_type?: string | null;
  entity_id?: string | null;
  detail?: object | null;
  ip_address?: string | null;
}

/**
 * Ghi audit log cho các thao tác nhạy cảm.
 * Các action được log: login, logout, grade_update, user_delete, enroll, cert_issued
 */
export const createAuditLog = async (input: AuditLogInput): Promise<void> => {
  try {
    await AuditLog.create({
      user_id: input.user_id || null,
      action: input.action,
      entity_type: input.entity_type || null,
      entity_id: input.entity_id || null,
      detail: input.detail || null,
      ip_address: input.ip_address || null,
    });
  } catch (error) {
    // Audit log không được phép crash ứng dụng
    console.error('[AUDIT LOG ERROR]:', error);
  }
};

/**
 * Lấy IP address từ request
 */
export const getClientIp = (req: any): string | null => {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.connection?.remoteAddress
    || req.socket?.remoteAddress
    || null;
};
