import { http } from '@/utils/request';
import type { LoginResponse, User } from '@/types';

export const authApi = {
  // 用户注册
  register(data: { username: string; password: string; email?: string; phone?: string }): Promise<LoginResponse> {
    return http.post('/user/register', data);
  },

  // 用户登录
  login(data: { account: string; password: string }): Promise<LoginResponse> {
    return http.post('/user/login', data);
  },

  // 刷新Token
  refreshToken(refresh_token: string): Promise<{ token: string; refresh_token: string; expires_in: number }> {
    return http.post('/user/refresh-token', { refresh_token });
  },

  // 获取个人资料
  getProfile(): Promise<User> {
    return http.get('/user/profile');
  },

  // 更新个人资料
  updateProfile(data: { nickname?: string; avatar?: string; email?: string; phone?: string }): Promise<User> {
    return http.put('/user/profile', data);
  },

  // 修改密码
  changePassword(data: { old_password: string; new_password: string }): Promise<void> {
    return http.post('/user/change-password', data);
  },

  // 退出登录
  logout(): Promise<void> {
    return http.post('/user/logout');
  },
};
