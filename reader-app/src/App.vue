<template>
  <div class="app-wrapper">
    <div class="app-container">
      <router-view v-slot="{ Component }">
        <keep-alive :include="['Home', 'Category', 'Search']">
          <component :is="Component" />
        </keep-alive>
      </router-view>
    </div>
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
  background-color: #f0f2f5;
}

#app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

// PC端适配 - 居中限宽布局
.app-wrapper {
  min-height: 100vh;
  background-color: #f0f2f5;

  // PC端显示背景
  @media (min-width: 768px) {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    justify-content: center;
    align-items: flex-start;
    padding: 20px 0;
  }
}

.app-container {
  width: 100%;
  min-height: 100vh;
  background-color: #fff;

  // PC端限制宽度并添加阴影
  @media (min-width: 768px) {
    max-width: 480px;
    min-height: calc(100vh - 40px);
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
    overflow: hidden;
    position: relative;
  }

  // 大屏幕可以稍微宽一点
  @media (min-width: 1200px) {
    max-width: 540px;
  }
}

// 修复 Vant 组件在 PC 端的样式问题
@media (min-width: 768px) {
  // 固定定位的元素需要限制在容器内
  .van-tabbar {
    position: fixed !important;
    max-width: 480px !important;
    left: 50% !important;
    transform: translateX(-50%) !important;
    border-radius: 0 0 16px 16px !important;
  }

  .van-nav-bar--fixed {
    max-width: 480px !important;
    left: 50% !important;
    transform: translateX(-50%) !important;
  }

  // 弹出层也需要居中
  .van-popup {
    max-width: 480px !important;
  }

  .van-popup--bottom {
    left: 50% !important;
    transform: translateX(-50%) !important;
  }

  .van-popup--left {
    max-height: calc(100vh - 40px) !important;
  }

  // 对话框居中
  .van-dialog {
    max-width: 400px !important;
  }

  // toast 居中
  .van-toast {
    max-width: 400px !important;
  }
}

@media (min-width: 1200px) {
  .van-tabbar,
  .van-nav-bar--fixed {
    max-width: 540px !important;
  }

  .van-popup {
    max-width: 540px !important;
  }
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
</style>
