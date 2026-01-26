<template>
  <div class="not-found-page">
    <van-empty
      image="error"
      description="页面不存在"
    >
      <van-button type="primary" @click="router.push('/')">返回首页</van-button>
    </van-empty>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();
</script>

<style lang="scss" scoped>
.not-found-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f7f8fa;
}
</style>
