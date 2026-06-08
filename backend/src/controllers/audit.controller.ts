import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { AuditLog, User } from '../models';

// GET /api/audit-logs — Lấy danh sách audit log (admin only)
export const getAuditLogs = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.user_type !== 'admin') {
      return res.status(403).json({ success: false, error: 'Chỉ admin mới có quyền xem audit logs!' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;
    const action = req.query.action as string | undefined;
    const userId = req.query.user_id as string | undefined;

    const where: any = {};
    if (action) where.action = action;
    if (userId) where.user_id = userId;

    const { count, rows } = await AuditLog.findAndCountAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'full_name', 'email', 'user_type'] },
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    return res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error: any) {
    console.error('getAuditLogs Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra khi lấy audit logs!' });
  }
};
