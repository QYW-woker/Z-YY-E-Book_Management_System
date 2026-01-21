import { request } from '@/utils/request'
import type { LoginRequest, LoginResponse, Admin } from '@/types'

export const authApi = {
  /**
   * 登录
   */
  login(data: LoginRequest): Promise<LoginResponse> {
    return request.post('/admin/login', data)
  },

  /**
   * 刷新Token
   */
  refreshToken(refreshToken: string): Promise<LoginResponse> {
    return request.post('/admin/refresh-token', { refresh_token: refreshToken })
  },

  /**
   * 获取当前用户信息
   */
  getProfile(): Promise<Admin> {
    return request.get('/admin/profile')
  },

  /**
   * 更新当前用户信息
   */
  updateProfile(data: Partial<Admin>): Promise<Admin> {
    return request.put('/admin/profile', data)
  },

  /**
   * 修改密码
   */
  changePassword(data: { old_password: string; new_password: string }): Promise<void> {
    return request.post('/admin/change-password', data)
  },

  /**
   * 退出登录
   */
  logout(): Promise<void> {
    return request.post('/admin/logout')
  },
}
