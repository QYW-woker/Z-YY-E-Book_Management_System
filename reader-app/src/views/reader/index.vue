<template>
  <div class="reader-page">
    <!-- 顶部工具栏 -->
    <div class="toolbar top-toolbar" :class="{ hidden: !showToolbar }">
      <van-nav-bar
        :title="book?.title || '阅读'"
        left-arrow
        @click-left="router.back()"
      >
        <template #right>
          <van-icon name="down" size="20" @click="handleDownload" />
        </template>
      </van-nav-bar>
    </div>

    <!-- 阅读区域 -->
    <div class="reader-content" @click="toggleToolbar">
      <div v-if="loading" class="loading-container">
        <van-loading size="40" vertical>加载中...</van-loading>
      </div>

      <!-- PDF 阅读器 -->
      <div v-if="book?.format === 'pdf'" class="pdf-reader">
        <iframe
          v-if="fileUrl"
          :src="fileUrl"
          class="pdf-iframe"
          @load="onFileLoaded"
        />
      </div>

      <!-- EPUB/其他格式提示 -->
      <div v-else-if="book" class="format-notice">
        <van-empty>
          <template #description>
            <p>{{ book.format.toUpperCase() }} 格式暂不支持在线预览</p>
            <p>请下载后使用专业阅读器打开</p>
          </template>
          <van-button type="primary" icon="down" @click="handleDownload">
            下载电子书
          </van-button>
        </van-empty>
      </div>
    </div>

    <!-- 底部工具栏 -->
    <div class="toolbar bottom-toolbar" :class="{ hidden: !showToolbar }">
      <div class="progress-bar">
        <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
        <van-slider
          v-model="progress"
          :min="0"
          :max="100"
          @change="onProgressChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { showToast } from 'vant';
import { booksApi } from '@/api/books';
import { userApi } from '@/api/user';
import { useAuthStore } from '@/stores/auth';
import type { Book } from '@/types';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const loading = ref(true);
const book = ref<Book | null>(null);
const fileUrl = ref('');
const showToolbar = ref(true);
const progress = ref(0);
const currentPage = ref(1);
const totalPages = ref(1);

let hideToolbarTimer: number | null = null;

// 切换工具栏显示
function toggleToolbar() {
  showToolbar.value = !showToolbar.value;
  if (showToolbar.value) {
    startHideTimer();
  }
}

// 开始隐藏计时器
function startHideTimer() {
  if (hideToolbarTimer) {
    clearTimeout(hideToolbarTimer);
  }
  hideToolbarTimer = window.setTimeout(() => {
    showToolbar.value = false;
  }, 3000);
}

// 文件加载完成
function onFileLoaded() {
  loading.value = false;
}

// 进度变化
function onProgressChange(value: number) {
  currentPage.value = Math.round((value / 100) * totalPages.value) || 1;
  // 保存阅读进度
  if (authStore.isLoggedIn && book.value) {
    userApi.saveReadingProgress(book.value.book_id, {
      progress: value,
      current_page: currentPage.value,
      total_pages: totalPages.value,
    });
  }
}

// 下载
async function handleDownload() {
  try {
    const downloadInfo = await booksApi.getDownloadUrl(route.params.id as string);
    const link = document.createElement('a');
    link.href = downloadInfo.download_url;
    link.download = downloadInfo.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast({
      message: '开始下载',
      type: 'success',
    });
  } catch (error) {
    // 错误已在拦截器中处理
  }
}

// 加载书籍
async function loadBook() {
  try {
    loading.value = true;
    const id = route.params.id as string;
    book.value = await booksApi.getBookDetail(id);

    // 获取文件URL
    if (book.value.format === 'pdf') {
      fileUrl.value = `/api/books/${id}/read`;
    }

    // 获取阅读进度
    if (authStore.isLoggedIn) {
      try {
        const savedProgress = await userApi.getReadingProgress(id);
        if (savedProgress) {
          progress.value = savedProgress.progress;
          currentPage.value = savedProgress.current_page;
          totalPages.value = savedProgress.total_pages || 1;
        }
      } catch {
        // 忽略错误
      }
    }
  } catch (error) {
    console.error('加载书籍失败', error);
    showToast('加载失败');
  } finally {
    if (book.value?.format !== 'pdf') {
      loading.value = false;
    }
  }
}

onMounted(() => {
  loadBook();
  startHideTimer();
});

onUnmounted(() => {
  if (hideToolbarTimer) {
    clearTimeout(hideToolbarTimer);
  }
});
</script>

<style lang="scss" scoped>
.reader-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

.toolbar {
  position: fixed;
  left: 0;
  right: 0;
  z-index: 100;
  transition: transform 0.3s ease;

  &.hidden {
    transform: translateY(-100%);
  }
}

.top-toolbar {
  top: 0;

  &.hidden {
    transform: translateY(-100%);
  }
}

.bottom-toolbar {
  bottom: 0;
  background-color: #fff;
  padding: 12px 16px;
  padding-bottom: calc(12px + env(safe-area-inset-bottom));
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);

  &.hidden {
    transform: translateY(100%);
  }
}

.reader-content {
  flex: 1;
  overflow: hidden;
  padding-top: 46px;
}

.loading-container {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pdf-reader {
  height: 100%;

  .pdf-iframe {
    width: 100%;
    height: 100%;
    border: none;
  }
}

.format-notice {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  text-align: center;

  p {
    margin: 8px 0;
    color: #969799;
  }
}

.progress-bar {
  .page-info {
    display: block;
    text-align: center;
    font-size: 12px;
    color: #969799;
    margin-bottom: 8px;
  }
}
</style>
