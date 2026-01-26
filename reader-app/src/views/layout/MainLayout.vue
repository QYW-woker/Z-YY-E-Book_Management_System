<template>
  <div class="main-layout">
    <router-view />
    <van-tabbar v-model="active" @change="onTabChange">
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

// 路径到 tab 名称的映射
const pathToTab: Record<string, string> = {
  '/': 'home',
  '/category': 'category',
  '/search': 'search',
  '/user': 'user',
};

// tab 名称到路径的映射
const tabToPath: Record<string, string> = {
  home: '/',
  category: '/category',
  search: '/search',
  user: '/user',
};

// 根据当前路径获取激活的 tab
function getActiveTab(path: string): string {
  if (path === '/' || path === '') return 'home';
  if (path.startsWith('/category')) return 'category';
  if (path.startsWith('/search')) return 'search';
  if (path.startsWith('/user')) return 'user';
  return 'home';
}

const active = ref(getActiveTab(route.path));

// 监听路由变化
watch(
  () => route.path,
  (path) => {
    active.value = getActiveTab(path);
  }
);

// 处理 tab 切换
function onTabChange(name: string | number) {
  const path = tabToPath[name as string];
  if (path && route.path !== path) {
    router.push(path);
  }
}
</script>

<style lang="scss" scoped>
.main-layout {
  min-height: 100vh;
  padding-bottom: 50px;
}
</style>
