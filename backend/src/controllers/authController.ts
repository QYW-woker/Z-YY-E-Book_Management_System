import type { Request, Response } from 'express';
import { adminService } from '../services/adminService.js';
import { generateToken, generateRefreshToken, verifyToken, getTokenExpiresIn } from '../utils/jwt.js';
import { success, error } from '../utils/response.js';
import type { AuthRequest } from '../types/index.js';

export const authController = {
  // 登录
  login(req: Request, res: Response): void {
    const { username, password } = req.body;

    if (!username || !password) {
      error(res, '用户名和密码不能为空');
      return;
    }

    const admin = adminService.findByUsername(username);
    if (!admin) {
      error(res, '用户名或密码错误');
      return;
    }

    if (admin.status === 'disabled') {
      error(res, '账号已被禁用');
      return;
    }

    if (!adminService.verifyPassword(password, admin.password)) {
      error(res, '用户名或密码错误');
      return;
    }

    // 更新最后登录时间
    adminService.updateLastLogin(admin.id);

    // 生成 Token
    const payload = {
      adminId: admin.id,
      username: admin.username,
      role: admin.role,
    };

    const token = generateToken(payload);
    const refreshToken = generateRefreshToken(payload);

    success(res, {
      token,
      refresh_token: refreshToken,
      expires_in: getTokenExpiresIn(),
      admin: {
        id: admin.id,
        username: admin.username,
        nickname: admin.nickname,
        avatar: admin.avatar,
        role: admin.role,
        status: admin.status,
        last_login_at: admin.last_login_at,
        created_at: admin.created_at,
      },
    });
  },

  // 刷新 Token
  refreshToken(req: Request, res: Response): void {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      error(res, '刷新令牌不能为空', 401, 401);
      return;
    }

    const payload = verifyToken(refresh_token);
    if (!payload) {
      error(res, '刷新令牌无效或已过期', 401, 401);
      return;
    }

    const admin = adminService.findById(payload.adminId);
    if (!admin || admin.status === 'disabled') {
      error(res, '账号不存在或已被禁用', 401, 401);
      return;
    }

    const newPayload = {
      adminId: admin.id,
      username: admin.username,
      role: admin.role,
    };

    const token = generateToken(newPayload);
    const newRefreshToken = generateRefreshToken(newPayload);

    success(res, {
      token,
      refresh_token: newRefreshToken,
      expires_in: getTokenExpiresIn(),
      admin: {
        id: admin.id,
        username: admin.username,
        nickname: admin.nickname,
        avatar: admin.avatar,
        role: admin.role,
        status: admin.status,
        last_login_at: admin.last_login_at,
        created_at: admin.created_at,
      },
    });
  },

  // 获取当前用户信息
  getProfile(req: AuthRequest, res: Response): void {
    const admin = adminService.findById(req.admin!.id);
    if (!admin) {
      error(res, '用户不存在', 404, 404);
      return;
    }

    success(res, {
      id: admin.id,
      username: admin.username,
      nickname: admin.nickname,
      avatar: admin.avatar,
      role: admin.role,
      status: admin.status,
      last_login_at: admin.last_login_at,
      created_at: admin.created_at,
    });
  },

  // 更新个人信息
  updateProfile(req: AuthRequest, res: Response): void {
    const { nickname, avatar } = req.body;

    const admin = adminService.update(req.admin!.id, { nickname, avatar });

    success(res, {
      id: admin.id,
      username: admin.username,
      nickname: admin.nickname,
      avatar: admin.avatar,
      role: admin.role,
      status: admin.status,
      last_login_at: admin.last_login_at,
      created_at: admin.created_at,
    });
  },

  // 修改密码
  changePassword(req: AuthRequest, res: Response): void {
    const { old_password, new_password } = req.body;

    if (!old_password || !new_password) {
      error(res, '原密码和新密码不能为空');
      return;
    }

    if (new_password.length < 6) {
      error(res, '新密码长度不能少于6位');
      return;
    }

    const admin = adminService.findById(req.admin!.id);
    if (!admin) {
      error(res, '用户不存在', 404, 404);
      return;
    }

    if (!adminService.verifyPassword(old_password, admin.password)) {
      error(res, '原密码错误');
      return;
    }

    adminService.changePassword(admin.id, new_password);
    success(res, null, '密码修改成功');
  },

  // 退出登录
  logout(_req: AuthRequest, res: Response): void {
    // JWT 无状态，客户端删除 Token 即可
    success(res, null, '退出成功');
  },
};
