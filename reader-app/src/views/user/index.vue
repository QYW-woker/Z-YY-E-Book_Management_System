<template>
  <div class="user-page">
    <!-- 用户信息卡片 -->
    <div class="user-header">
      <div v-if="authStore.isLoggedIn" class="user-info">
        <van-image
          class="avatar"
          :src="authStore.user?.avatar || ''"
          round
          width="60"
          height="60"
        >
          <template #error>
            <div class="default-avatar">
              {{ authStore.user?.nickname?.slice(0, 1) || authStore.user?.username?.slice(0, 1) }}
            </div>
          </template>
        </van-image>
        <div class="info">
          <div class="nickname">{{ authStore.user?.nickname || authStore.user?.username }}</div>
          <div class="join-time">注册于 {{ formatDate(authStore.user?.created_at) }}</div>
        </div>
      </div>
      <div v-else class="login-prompt" @click="goLogin">
        <van-icon name="user-o" size="40" />
        <span>点击登录</span>
      </div>
    </div>

    <!-- 功能菜单 -->
    <div class="menu-section">
      <van-cell-group inset>
        <van-cell
          title="浏览历史"
          icon="clock-o"
          is-link
          @click="goHistory"
        />
        <van-cell
          title="下载记录"
          icon="down"
          is-link
          @click="goDownloads"
        />
        <van-cell
          title="我的收藏"
          icon="star-o"
          is-link
          @click="goFavorites"
        />
      </van-cell-group>
    </div>

    <div class="menu-section">
      <van-cell-group inset>
        <van-cell
          title="设置"
          icon="setting-o"
          is-link
          @click="goSettings"
        />
      </van-cell-group>
    </div>

    <!-- 退出登录 -->
    <div v-if="authStore.isLoggedIn" class="logout-section">
      <van-button block type="default" @click="handleLogout">退出登录</van-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { showConfirmDialog, showToast } from 'vant';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

// 格式化日期
function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// 跳转登录
function goLogin() {
  router.push('/login');
}

// 跳转浏览历史
function goHistory() {
  if (!authStore.isLoggedIn) {
    showToast('请先登录');
    router.push('/login');
    return;
  }
  router.push('/user/history');
}

// 跳转下载记录
function goDownloads() {
  if (!authStore.isLoggedIn) {
    showToast('请先登录');
    router.push('/login');
    return;
  }
  router.push('/user/downloads');
}

// 跳转我的收藏
function goFavorites() {
  if (!authStore.isLoggedIn) {
    showToast('请先登录');
    router.push('/login');
    return;
  }
  router.push('/user/favorites');
}

// 跳转设置
function goSettings() {
  if (!authStore.isLoggedIn) {
    showToast('请先登录');
    router.push('/login');
    return;
  }
  router.push('/user/settings');
}

// 退出登录
async function handleLogout() {
  try {
    await showConfirmDialog({
      title: '提示',
      message: '确定要退出登录吗？',
    });
    authStore.logout();
    showToast('已退出登录');
  } catch {
    // 取消
  }
}
</script>

<style lang="scss" scoped>
.user-page {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.user-header {
  padding: 30px 20px;
  background: linear-gradient(135deg, #1989fa 0%, #2b7cdd 100%);

  .user-info {
    display: flex;
    align-items: center;

    .avatar {
      margin-right: 16px;
    }

    .default-avatar {
      width: 60px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: rgba(255, 255, 255, 0.3);
      color: #fff;
      font-size: 24px;
      font-weight: bold;
      border-radius: 50%;
    }

    .info {
      .nickname {
        font-size: 18px;
        font-weight: bold;
        color: #fff;
      }

      .join-time {
        margin-top: 4px;
        font-size: 12px;
        color: rgba(255, 255, 255, 0.8);
      }
    }
  }

  .login-prompt {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px;
    color: #fff;

    span {
      margin-top: 8px;
      font-size: 14px;
    }
  }
}

.menu-section {
  margin-top: 12px;
}

.logout-section {
  margin: 24px 16px;
}
</style>
