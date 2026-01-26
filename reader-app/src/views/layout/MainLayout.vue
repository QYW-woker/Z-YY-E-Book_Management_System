<template>
  <div class="main-layout">
    <!-- PC端侧边导航 - Material Design Navigation Drawer -->
    <aside class="pc-sidebar pc-only">
      <div class="sidebar-header">
        <div class="logo">
          <div class="logo-icon">
            <van-icon name="bookmark-o" size="24" />
          </div>
          <span class="logo-text">电子书阅读</span>
        </div>
      </div>
      <nav class="sidebar-nav">
        <div
          v-for="item in navItems"
          :key="item.name"
          class="nav-item md-ripple"
          :class="{ active: active === item.name }"
          @click="onNavClick(item.name)"
        >
          <van-icon :name="item.icon" size="24" />
          <span>{{ item.label }}</span>
        </div>
      </nav>
      <div class="sidebar-divider"></div>
      <div class="sidebar-footer">
        <div class="copyright">© 2024 电子书阅读</div>
      </div>
    </aside>

    <!-- 主内容区 -->
    <main class="main-content">
      <router-view />
    </main>

    <!-- 移动端底部导航 - iOS Tab Bar -->
    <van-tabbar v-model="active" class="ios-tabbar mobile-only" @change="onTabChange">
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

  // 移动端 - iOS style background
  @media (max-width: 767px) {
    padding-bottom: 83px; // iOS safe area + tabbar height
    background-color: var(--ios-background);
  }

  // PC端 - Material Design Flex布局
  @media (min-width: 768px) {
    display: flex;
    background-color: var(--md-background);
  }
}

// ============================================
// PC端侧边栏 - Material Design Navigation Drawer
// ============================================
.pc-sidebar {
  width: 256px; // Material Design standard drawer width
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  background: var(--md-surface);
  display: flex;
  flex-direction: column;
  z-index: 100;
  box-shadow: var(--md-elevation-2);

  .sidebar-header {
    padding: 16px;
    height: 64px; // Material Design app bar height
    display: flex;
    align-items: center;
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);

    .logo {
      display: flex;
      align-items: center;
      gap: 12px;

      .logo-icon {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: linear-gradient(135deg, var(--md-primary) 0%, var(--md-primary-light) 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--md-on-primary);
      }

      .logo-text {
        font-size: 20px;
        font-weight: 500;
        color: var(--md-on-surface);
        letter-spacing: 0.0125em;
      }
    }
  }

  .sidebar-nav {
    flex: 1;
    padding: 8px 0;
    overflow-y: auto;

    .nav-item {
      display: flex;
      align-items: center;
      gap: 24px; // Material Design spec: 24dp between icon and text
      padding: 12px 16px;
      margin: 0 8px;
      color: var(--md-on-surface-medium);
      cursor: pointer;
      transition: all 0.28s cubic-bezier(0.4, 0, 0.2, 1);
      border-radius: 28px; // Material Design pill shape for selected state
      position: relative;
      overflow: hidden;

      .van-icon {
        font-size: 24px;
      }

      span {
        font-size: 14px;
        font-weight: 500;
        letter-spacing: 0.0178571em;
      }

      &:hover {
        background-color: rgba(25, 118, 210, 0.08);
        color: var(--md-primary);
      }

      &.active {
        background-color: rgba(25, 118, 210, 0.12);
        color: var(--md-primary);

        .van-icon {
          color: var(--md-primary);
        }
      }
    }
  }

  .sidebar-divider {
    height: 1px;
    background: rgba(0, 0, 0, 0.08);
    margin: 8px 16px;
  }

  .sidebar-footer {
    padding: 16px;
    border-top: 1px solid rgba(0, 0, 0, 0.08);

    .copyright {
      font-size: 12px;
      color: var(--md-on-surface-disabled);
      text-align: center;
      letter-spacing: 0.03333em;
    }
  }
}

// ============================================
// 主内容区
// ============================================
.main-content {
  flex: 1;
  min-height: 100vh;

  @media (min-width: 768px) {
    margin-left: 256px;
  }
}

// ============================================
// 移动端 iOS Tab Bar
// ============================================
.ios-tabbar {
  height: 83px; // 49px tabbar + 34px safe area
  padding-bottom: 34px; // iPhone X safe area

  // iOS frosted glass effect
  background: rgba(249, 249, 249, 0.94) !important;
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 0.5px;
    background: var(--ios-separator);
  }

  :deep(.van-tabbar-item) {
    font-size: 10px;
    color: var(--ios-gray);

    .van-tabbar-item__icon {
      font-size: 24px;
      margin-bottom: 2px;
    }
  }

  :deep(.van-tabbar-item--active) {
    color: var(--ios-blue) !important;
  }

  @media (min-width: 768px) {
    display: none !important;
  }
}

// ============================================
// Material Design Ripple Effect
// ============================================
.md-ripple {
  position: relative;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    background: rgba(25, 118, 210, 0.2);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    transition: width 0.4s ease-out, height 0.4s ease-out, opacity 0.4s ease-out;
    opacity: 0;
    pointer-events: none;
  }

  &:active::after {
    width: 300%;
    height: 300%;
    opacity: 1;
  }
}
</style>
