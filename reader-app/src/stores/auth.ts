import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User } from '@/types';
import { authApi } from '@/api/auth';
import router from '@/router';

export const useAuthStore = defineStore(
  'auth',
  () => {
    const token = ref<string>('');
    const refreshToken = ref<string>('');
    const user = ref<User | null>(null);

    const isLoggedIn = computed(() => !!token.value && !!user.value);

    // 登录
    async function login(account: string, password: string) {
      const res = await authApi.login({ account, password });
      token.value = res.token;
      refreshToken.value = res.refresh_token;
      user.value = res.user;
      return res;
    }

    // 注册
    async function register(username: string, password: string, email?: string, phone?: string) {
      const res = await authApi.register({ username, password, email, phone });
      token.value = res.token;
      refreshToken.value = res.refresh_token;
      user.value = res.user;
      return res;
    }

    // 刷新Token
    async function refreshAccessToken() {
      if (!refreshToken.value) return;
      try {
        const res = await authApi.refreshToken(refreshToken.value);
        token.value = res.token;
        refreshToken.value = res.refresh_token;
      } catch {
        logout();
      }
    }

    // 获取用户信息
    async function fetchProfile() {
      if (!token.value) return;
      try {
        user.value = await authApi.getProfile();
      } catch {
        logout();
      }
    }

    // 更新用户信息
    async function updateProfile(data: { nickname?: string; avatar?: string; email?: string; phone?: string }) {
      const updatedUser = await authApi.updateProfile(data);
      user.value = updatedUser;
      return updatedUser;
    }

    // 修改密码
    async function changePassword(oldPassword: string, newPassword: string) {
      await authApi.changePassword({ old_password: oldPassword, new_password: newPassword });
    }

    // 退出登录
    function logout() {
      token.value = '';
      refreshToken.value = '';
      user.value = null;
      router.push('/login');
    }

    return {
      token,
      refreshToken,
      user,
      isLoggedIn,
      login,
      register,
      refreshAccessToken,
      fetchProfile,
      updateProfile,
      changePassword,
      logout,
    };
  },
  {
    persist: {
      key: 'reader-auth',
      paths: ['token', 'refreshToken', 'user'],
    },
  }
);
