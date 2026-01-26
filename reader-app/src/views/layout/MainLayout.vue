<template>
  <div class="main-layout">
    <router-view />
    <van-tabbar v-model="active" route>
      <van-tabbar-item to="/" icon="home-o">首页</van-tabbar-item>
      <van-tabbar-item to="/category" icon="apps-o">分类</van-tabbar-item>
      <van-tabbar-item to="/search" icon="search">搜索</van-tabbar-item>
      <van-tabbar-item to="/user" icon="user-o">我的</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const active = ref(0);
</script>

<style lang="scss" scoped>
.main-layout {
  min-height: 100vh;
  padding-bottom: 50px;
}
</style>
