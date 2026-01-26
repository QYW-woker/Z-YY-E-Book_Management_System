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

.tip-content {
  padding: 16px;
  font-size: 14px;
  color: #666;

  p {
    margin-bottom: 12px;
    font-weight: bold;
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;

    li {
      padding: 8px 0;
      display: flex;
      align-items: center;
      gap: 4px;

      .van-icon {
        color: #1989fa;
      }
    }
  }
}
</style>
