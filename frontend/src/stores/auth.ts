import { defineStore } from 'pinia'
import type { Admin, LoginRequest, LoginResponse } from '@/types'
import { authApi } from '@/api/auth'
import router from '@/router'

interface AuthState {
  token: string
  refreshToken: string
  admin: Admin | null
  tokenExpireTime: number
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: '',
    refreshToken: '',
    admin: null,
    tokenExpireTime: 0,
  }),

  getters: {
    isLoggedIn: (state): boolean => {
      return !!state.token && Date.now() < state.tokenExpireTime
    },
    isAdmin: (state): boolean => {
      return state.admin?.role === 'super_admin'
    },
  },

  actions: {
    async login(credentials: LoginRequest): Promise<void> {
      const response = await authApi.login(credentials)
      this.setAuth(response)
    },

    setAuth(data: LoginResponse): void {
      this.token = data.token
      this.refreshToken = data.refresh_token
      this.admin = data.admin
      this.tokenExpireTime = Date.now() + data.expires_in * 1000
    },

    async refreshAuthToken(): Promise<boolean> {
      if (!this.refreshToken) {
        return false
      }

      try {
        const response = await authApi.refreshToken(this.refreshToken)
        this.setAuth(response)
        return true
      } catch {
        this.logout()
        return false
      }
    },

    logout(): void {
      this.token = ''
      this.refreshToken = ''
      this.admin = null
      this.tokenExpireTime = 0
      router.push('/login')
    },

    updateProfile(admin: Partial<Admin>): void {
      if (this.admin) {
        this.admin = { ...this.admin, ...admin }
      }
    },
  },

  persist: {
    key: 'ebook-admin-auth',
    storage: localStorage,
    paths: ['token', 'refreshToken', 'admin', 'tokenExpireTime'],
  },
})
