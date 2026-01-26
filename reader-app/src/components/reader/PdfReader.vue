<template>
  <div class="pdf-reader">
    <!-- PDF 容器 -->
    <iframe
      ref="iframeRef"
      :src="url"
      class="pdf-iframe"
      @load="onLoaded"
    />

    <!-- 加载中 -->
    <div v-if="loading" class="loading-overlay">
      <van-loading size="40" vertical>加载中...</van-loading>
    </div>

    <!-- 顶部工具栏 -->
    <transition name="slide-down">
      <div v-show="showToolbar" class="toolbar top-toolbar">
        <van-nav-bar
          :title="title || 'PDF阅读'"
          left-arrow
          @click-left="$emit('back')"
        >
          <template #right>
            <van-icon name="down" size="20" @click="$emit('download')" />
          </template>
        </van-nav-bar>
      </div>
    </transition>

    <!-- 点击区域 -->
    <div class="click-area" @click="toggleToolbar"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const props = defineProps<{
  url: string;
  title?: string;
}>();

const emit = defineEmits<{
  (e: 'back'): void;
  (e: 'download'): void;
  (e: 'loaded'): void;
}>();

const iframeRef = ref<HTMLIFrameElement | null>(null);
const loading = ref(true);
const showToolbar = ref(true);

let hideToolbarTimer: number | null = null;

function toggleToolbar() {
  showToolbar.value = !showToolbar.value;
  if (showToolbar.value) {
    startHideTimer();
  }
}

function startHideTimer() {
  if (hideToolbarTimer) {
    clearTimeout(hideToolbarTimer);
  }
  hideToolbarTimer = window.setTimeout(() => {
    showToolbar.value = false;
  }, 3000);
}

function onLoaded() {
  loading.value = false;
  emit('loaded');
  startHideTimer();
}

onMounted(() => {
  startHideTimer();
});

onUnmounted(() => {
  if (hideToolbarTimer) {
    clearTimeout(hideToolbarTimer);
  }
});
</script>

<style lang="scss" scoped>
.pdf-reader {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background-color: #525659;
}

.pdf-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.9);
  z-index: 100;
}

.toolbar {
  position: fixed;
  left: 0;
  right: 0;
  z-index: 99;
}

.top-toolbar {
  top: 0;
}

.click-area {
  position: absolute;
  top: 46px;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
  pointer-events: none;

  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    width: 60px;
    height: 200px;
    transform: translateY(-50%);
    pointer-events: auto;
  }

  &::after {
    content: '';
    position: absolute;
    top: 50%;
    right: 0;
    width: 60px;
    height: 200px;
    transform: translateY(-50%);
    pointer-events: auto;
  }
}

// 过渡动画
.slide-down-enter-active,
.slide-down-leave-active {
  transition: transform 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  transform: translateY(-100%);
}
</style>
