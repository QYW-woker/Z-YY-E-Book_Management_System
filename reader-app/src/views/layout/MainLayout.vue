<template>
  <div class="main-layout">
    <!-- PC端侧边导航 -->
    <aside class="pc-sidebar pc-only">
      <div class="sidebar-header">
        <div class="logo">
          <van-icon name="bookmark-o" size="28" />
          <span>电子书阅读</span>
        </div>
      </div>
      <nav class="sidebar-nav">
        <div
          v-for="item in navItems"
          :key="item.name"
          class="nav-item"
          :class="{ active: active === item.name }"
          @click="onNavClick(item.name)"
        >
          <van-icon :name="item.icon" size="20" />
          <span>{{ item.label }}</span>
        </div>
      </nav>
      <div class="sidebar-footer">
        <div class="copyright">© 2024 电子书阅读</div>
      </div>
    </aside>

    <!-- 主内容区 -->
    <main class="main-content">
      <router-view />
    </main>

    <!-- 移动端底部导航 -->
    <van-tabbar v-model="active" class="mobile-only" @change="onTabChange">
      <van-tabbar-item icon="home-o" name="home">首页</van-tabbar-item>
      <van-tabbar-item icon="apps-o" name="category">分类</van-tabbar-item>
      <van-tabbar-item icon="search" name="search">搜索</van-tabbar-item>
      <van-tabbar-item icon="user-o" name="user">我的</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const navItems = [
  { name: 'home', label: '首页', icon: 'home-o', path: '/' },
  { name: 'category', label: '分类', icon: 'apps-o', path: '/category' },
  { name: 'search', label: '搜索', icon: 'search', path: '/search' },
  { name: 'user', label: '我的', icon: 'user-o', path: '/user' },
];

const tabToPath: Record<string, string> = {
  home: '/',
  category: '/category',
  search: '/search',
  user: '/user',
};

function getActiveTab(path: string): string {
  if (path === '/' || path === '') return 'home';
  if (path.startsWith('/category')) return 'category';
  if (path.startsWith('/search')) return 'search';
  if (path.startsWith('/user')) return 'user';
  return 'home';
}

const active = ref(getActiveTab(route.path));

watch(
  () => route.path,
  (path) => {
    active.value = getActiveTab(path);
  }
);

function onTabChange(name: string | number) {
  const path = tabToPath[name as string];
  if (path && route.path !== path) {
    router.push(path);
  }
}

function onNavClick(name: string) {
  const path = tabToPath[name];
  if (path && route.path !== path) {
    router.push(path);
  }
}
</script>

<style lang="scss" scoped>
.main-layout {
  min-height: 100vh;
  background-color: #f5f7fa;

  // 移动端
  @media (max-width: 767px) {
    padding-bottom: 50px;
  }

  // PC端 - Flex布局
  @media (min-width: 768px) {
    display: flex;
  }
}

// PC端侧边栏
.pc-sidebar {
  width: 220px;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  display: flex;
  flex-direction: column;
  z-index: 100;

  .sidebar-header {
    padding: 24px 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);

    .logo {
      display: flex;
      align-items: center;
      gap: 10px;
      color: #fff;
      font-size: 18px;
      font-weight: bold;

      .van-icon {
        color: #1989fa;
      }
    }
  }

  .sidebar-nav {
    flex: 1;
    padding: 16px 0;
    overflow-y: auto;

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 24px;
      color: rgba(255, 255, 255, 0.7);
      cursor: pointer;
      transition: all 0.3s;
      margin: 4px 12px;
      border-radius: 8px;

      &:hover {
        background-color: rgba(255, 255, 255, 0.1);
        color: #fff;
      }

      &.active {
        background: linear-gradient(90deg, #1989fa 0%, #2b7cdd 100%);
        color: #fff;
        box-shadow: 0 4px 12px rgba(25, 137, 250, 0.4);
      }

      span {
        font-size: 15px;
      }
    }
  }

  .sidebar-footer {
    padding: 16px 20px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);

    .copyright {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.4);
      text-align: center;
    }
  }
}

// 主内容区
.main-content {
  flex: 1;
  min-height: 100vh;

  @media (min-width: 768px) {
    margin-left: 220px;
  }
}

// 移动端tabbar样式
:deep(.van-tabbar) {
  @media (min-width: 768px) {
    display: none;
  }
}
</style>
