import type { Request, Response, NextFunction } from 'express';
import { userService } from '../services/userService.js';
import type { UserAuthRequest } from '../types/index.js';

// 必须登录的认证中间件
export const userAuthMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      code: 401,
      message: '请先登录',
      data: null,
    });
    return;
  }

  const token = authHeader.substring(7);
  const payload = userService.verifyToken(token);

  if (!payload) {
    res.status(401).json({
      code: 401,
      message: 'token无效或已过期',
      data: null,
    });
    return;
  }

  // 检查用户状态
  const user = userService.getById(payload.userId);
  if (!user || user.status !== 'active') {
    res.status(401).json({
      code: 401,
      message: '用户不存在或已被禁用',
      data: null,
    });
    return;
  }

  (req as UserAuthRequest).user = {
    userId: payload.userId,
    username: payload.username,
  };

  next();
};

// 可选登录的认证中间件（不强制要求登录，但如果有token会解析用户信息）
export const optionalUserAuthMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const payload = userService.verifyToken(token);

    if (payload) {
      const user = userService.getById(payload.userId);
      if (user && user.status === 'active') {
        (req as UserAuthRequest).user = {
          userId: payload.userId,
          username: payload.username,
        };
      }
    }
  }

  next();
};
