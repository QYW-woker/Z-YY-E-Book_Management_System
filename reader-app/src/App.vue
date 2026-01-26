<template>
  <div class="app-wrapper">
    <router-view v-slot="{ Component }">
      <keep-alive :include="['Home', 'Category', 'Search']">
        <component :is="Component" />
      </keep-alive>
    </router-view>
  </div>
</template>

<script setup lang="ts">
// App 根组件
</script>

<style lang="scss">
* {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  background-color: #f5f7fa;
}

#app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.app-wrapper {
  min-height: 100vh;
  background-color: #f5f7fa;
}

// 通用工具类
.ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ellipsis-2 {
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

// PC端隐藏移动端tabbar
@media (min-width: 768px) {
  .mobile-only {
    display: none !important;
  }
}

// 移动端隐藏PC端元素
@media (max-width: 767px) {
  .pc-only {
    display: none !important;
  }
}
</style>
