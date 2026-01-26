import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/views/layout/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('@/views/home/index.vue'),
        meta: { title: '首页', keepAlive: true },
      },
      {
        path: 'category',
        name: 'Category',
        component: () => import('@/views/category/index.vue'),
        meta: { title: '分类', keepAlive: true },
      },
      {
        path: 'search',
        name: 'Search',
        component: () => import('@/views/search/index.vue'),
        meta: { title: '搜索', keepAlive: true },
      },
      {
        path: 'user',
        name: 'User',
        component: () => import('@/views/user/index.vue'),
        meta: { title: '我的' },
      },
    ],
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/Login.vue'),
    meta: { title: '登录' },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/auth/Register.vue'),
    meta: { title: '注册' },
  },
  {
    path: '/books/:id',
    name: 'BookDetail',
    component: () => import('@/views/book/Detail.vue'),
    meta: { title: '书籍详情' },
  },
  {
    path: '/reader/:id',
    name: 'Reader',
    component: () => import('@/views/reader/index.vue'),
    meta: { title: '在线阅读' },
  },
  {
    path: '/category/:id',
    name: 'CategoryDetail',
    component: () => import('@/views/category/Detail.vue'),
    meta: { title: '分类书籍' },
  },
  {
    path: '/search/advanced',
    name: 'AdvancedSearch',
    component: () => import('@/views/search/Advanced.vue'),
    meta: { title: '高级搜索' },
  },
  {
    path: '/user/history',
    name: 'ViewHistory',
    component: () => import('@/views/user/History.vue'),
    meta: { title: '浏览历史', requiresAuth: true },
  },
  {
    path: '/user/downloads',
    name: 'Downloads',
    component: () => import('@/views/user/Downloads.vue'),
    meta: { title: '下载记录', requiresAuth: true },
  },
  {
    path: '/user/favorites',
    name: 'Favorites',
    component: () => import('@/views/user/Favorites.vue'),
    meta: { title: '我的收藏', requiresAuth: true },
  },
  {
    path: '/user/settings',
    name: 'Settings',
    component: () => import('@/views/user/Settings.vue'),
    meta: { title: '设置', requiresAuth: true },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: { title: '页面不存在' },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    }
    return { top: 0 };
  },
});

// 路由守卫
router.beforeEach(async (to, from, next) => {
  // 设置页面标题
  document.title = `${to.meta.title || '电子书阅读'} - 电子书阅读`;

  // 检查是否需要登录
  if (to.meta.requiresAuth) {
    // 动态导入以避免循环依赖
    const { useAuthStore } = await import('@/stores/auth');
    const authStore = useAuthStore();
    if (!authStore.isLoggedIn) {
      next({ name: 'Login', query: { redirect: to.fullPath } });
      return;
    }
  }

  next();
});

export default router;
