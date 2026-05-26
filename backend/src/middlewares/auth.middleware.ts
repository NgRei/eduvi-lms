import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    username: string;
    user_type: 'student' | 'instructor' | 'admin';
  };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'Vui lòng cung cấp mã xác thực JWT!' });
  }

  const jwtSecret = process.env.JWT_SECRET || 'eduvi_lms_jwt_secret_key_2026_super_secure';

  jwt.verify(token, jwtSecret, (err, decoded: any) => {
    if (err) {
      return res.status(403).json({ success: false, error: 'Mã xác thực JWT không hợp lệ hoặc đã hết hạn!' });
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      username: decoded.username,
      user_type: decoded.user_type,
    };
    next();
  });
};

export const authorizeRole = (...allowedRoles: ('student' | 'instructor' | 'admin')[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Chưa xác thực người dùng!' });
    }

    if (!allowedRoles.includes(req.user.user_type)) {
      return res.status(403).json({ success: false, error: 'Bạn không có quyền truy cập chức năng này!' });
    }

    next();
  };
};
