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
    <div class="toolbar top-toolbar">
      <van-nav-bar
        :title="title || 'PDF阅读'"
        left-arrow
        @click-left="$emit('back')"
      >
        <template #right>
          <van-icon name="info-o" size="20" style="margin-right: 16px" @click="showTip = true" />
          <van-icon name="down" size="20" @click="$emit('download')" />
        </template>
      </van-nav-bar>
    </div>


    <!-- 提示弹窗 -->
    <van-dialog
      v-model:show="showTip"
      title="阅读提示"
      confirm-button-text="知道了"
    >
      <div class="tip-content">
        <p>PDF 阅读器使用提示：</p>
        <ul>
          <li>点击左上角 <van-icon name="arrow-left" /> 返回上一页</li>
          <li>点击右上角 <van-icon name="down" /> 下载文件</li>
          <li>双指缩放可放大/缩小页面</li>
          <li>点击 PDF 左侧边栏图标可查看目录</li>
        </ul>
      </div>
    </van-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

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
const showTip = ref(false);

function onLoaded() {
  loading.value = false;
  emit('loaded');
}

</script>

<style lang="scss" scoped>
// ============================================
// PDF Reader - iOS (Mobile) + Material Design (PC)
// ============================================

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
  z-index: 100;

  // iOS style
  @media (max-width: 767px) {
    background-color: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }

  // Material Design style
  @media (min-width: 768px) {
    background-color: rgba(255, 255, 255, 0.9);
  }
}

.toolbar {
  position: fixed;
  left: 0;
  right: 0;
  z-index: 99;
}

.top-toolbar {
  top: 0;

  // iOS NavBar style
  :deep(.van-nav-bar) {
    @media (max-width: 767px) {
      background: rgba(249, 249, 249, 0.94);
      backdrop-filter: saturate(180%) blur(20px);
      -webkit-backdrop-filter: saturate(180%) blur(20px);

      &::after {
        background-color: var(--ios-separator);
      }

      .van-nav-bar__title {
        font-size: 17px;
        font-weight: 600;
      }

      .van-nav-bar__right .van-icon {
        color: var(--ios-blue);
      }
    }

    @media (min-width: 768px) {
      background: var(--md-surface);
      box-shadow: var(--md-elevation-1);

      .van-nav-bar__title {
        font-size: 20px;
        font-weight: 500;
      }

      .van-nav-bar__right .van-icon {
        color: var(--md-primary);
        transition: color 0.28s cubic-bezier(0.4, 0, 0.2, 1);

        &:hover {
          color: var(--md-primary-dark);
        }
      }
    }
  }
}

.tip-content {
  // iOS style
  @media (max-width: 767px) {
    padding: var(--ios-spacing-md);
    font-size: 15px;
    color: #1C1C1E;

    p {
      margin-bottom: var(--ios-spacing-md);
      font-weight: 600;
    }

    ul {
      list-style: none;
      padding: 0;
      margin: 0;

      li {
        padding: var(--ios-spacing-sm) 0;
        display: flex;
        align-items: center;
        gap: 6px;
        color: var(--ios-gray);

        .van-icon {
          color: var(--ios-blue);
        }
      }
    }
  }

  // Material Design style
  @media (min-width: 768px) {
    padding: var(--md-spacing-lg);
    font-size: 14px;
    color: var(--md-on-surface);

    p {
      margin-bottom: var(--md-spacing-md);
      font-weight: 500;
      font-size: 16px;
    }

    ul {
      list-style: none;
      padding: 0;
      margin: 0;

      li {
        padding: var(--md-spacing-sm) 0;
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--md-on-surface-medium);

        .van-icon {
          color: var(--md-primary);
        }
      }
    }
  }
}

// Dialog styling
:deep(.van-dialog) {
  @media (max-width: 767px) {
    border-radius: var(--ios-radius-lg);

    .van-dialog__header {
      font-size: 17px;
      font-weight: 600;
    }

    .van-dialog__confirm {
      color: var(--ios-blue);
      font-weight: 600;
    }
  }

  @media (min-width: 768px) {
    border-radius: var(--md-radius-lg);
    box-shadow: var(--md-elevation-4);

    .van-dialog__header {
      font-size: 20px;
      font-weight: 500;
    }

    .van-dialog__confirm {
      color: var(--md-primary);
      font-weight: 500;
    }
  }
}
</style>
