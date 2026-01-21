import type { Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.js';
import { error } from '../utils/response.js';
import type { AuthRequest } from '../types/index.js';

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    error(res, '未提供认证令牌', 401, 401);
    return;
  }

  const token = authHeader.slice(7);
  const payload = verifyToken(token);

  if (!payload) {
    error(res, '认证令牌无效或已过期', 401, 401);
    return;
  }

  req.admin = {
    id: payload.adminId,
    username: payload.username,
    role: payload.role,
  };

  next();
}

// 超级管理员权限检查
export function superAdminMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  if (req.admin?.role !== 'super_admin') {
    error(res, '需要超级管理员权限', 403, 403);
    return;
  }
  next();
}
