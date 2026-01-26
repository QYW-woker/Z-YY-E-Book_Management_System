<template>
  <div class="main-layout">
    <router-view />
    <van-tabbar v-model="active" route @change="onTabChange">
      <van-tabbar-item replace to="/" icon="home-o" name="/">首页</van-tabbar-item>
      <van-tabbar-item replace to="/category" icon="apps-o" name="/category">分类</van-tabbar-item>
      <van-tabbar-item replace to="/search" icon="search" name="/search">搜索</van-tabbar-item>
      <van-tabbar-item replace to="/user" icon="user-o" name="/user">我的</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const active = ref(route.path);

// 监听路由变化，更新激活状态
watch(
  () => route.path,
  (path) => {
    // 匹配主要路径
    if (path === '/' || path === '') {
      active.value = '/';
    } else if (path.startsWith('/category')) {
      active.value = '/category';
    } else if (path.startsWith('/search')) {
      active.value = '/search';
    } else if (path.startsWith('/user')) {
      active.value = '/user';
    }
  },
  { immediate: true }
);

function onTabChange(name: string) {
  router.push(name);
}
</script>

<style lang="scss" scoped>
.main-layout {
  min-height: 100vh;
  padding-bottom: 50px;
}
</style>
