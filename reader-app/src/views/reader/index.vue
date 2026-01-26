<template>
  <div class="reader-page">
    <!-- PDF 阅读器 -->
    <PdfReader
      v-if="bookFormat === 'pdf' && fileUrl"
      :url="fileUrl"
      :title="book?.title"
      @back="router.back()"
      @download="handleDownload"
      @loaded="onFileLoaded"
    />

    <!-- EPUB 阅读器 -->
    <EpubReader
      v-else-if="bookFormat === 'epub' && fileUrl"
      :url="fileUrl"
      :title="book?.title"
      :initial-progress="savedProgress"
      @back="router.back()"
      @download="handleDownload"
      @loaded="onFileLoaded"
      @progress-change="onEpubProgressChange"
    />

    <!-- 其他格式提示 (MOBI/AZW3等) -->
    <div v-else-if="book && !loading" class="format-notice-page">
      <van-nav-bar
        :title="book?.title || '阅读'"
        left-arrow
        @click-left="router.back()"
      />
      <div class="format-notice">
        <van-empty image="search">
          <template #description>
            <p class="format-title">{{ book.format.toUpperCase() }} 格式</p>
            <p class="format-desc">该格式暂不支持在线预览</p>
            <p class="format-desc">请下载后使用专业阅读器打开</p>
            <p class="format-tips">推荐阅读器：Calibre、多看阅读、Moon+ Reader</p>
          </template>
          <van-button type="primary" icon="down" size="large" @click="handleDownload">
            下载电子书
          </van-button>
        </van-empty>
      </div>
    </div>

    <!-- 加载中 -->
    <div v-else-if="loading" class="loading-page">
      <van-loading size="40" vertical>加载中...</van-loading>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { showToast } from 'vant';
import { booksApi } from '@/api/books';
import { userApi } from '@/api/user';
import { useAuthStore } from '@/stores/auth';
import type { Book } from '@/types';
import PdfReader from '@/components/reader/PdfReader.vue';
import EpubReader from '@/components/reader/EpubReader.vue';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const loading = ref(true);
const book = ref<Book | null>(null);
const fileUrl = ref('');
const savedProgress = ref(0);

// 格式统一转小写进行比较
const bookFormat = computed(() => book.value?.format?.toLowerCase() || '');

// 支持在线阅读的格式
const supportedFormats = ['pdf', 'epub'];

// 文件加载完成
function onFileLoaded() {
  loading.value = false;
}

// EPUB 进度变化
function onEpubProgressChange(data: { progress: number; cfi: string }) {
  if (authStore.isLoggedIn && book.value) {
    userApi.saveReadingProgress(book.value.book_id, {
      progress: Math.round(data.progress * 100),
      current_page: 1,
      total_pages: 1,
      cfi: data.cfi, // EPUB 使用 CFI 定位
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

    // 检查是否支持在线阅读
    const format = book.value.format.toLowerCase();
    if (supportedFormats.includes(format)) {
      fileUrl.value = `/api/books/${id}/read`;
    }

    // 获取阅读进度
    if (authStore.isLoggedIn) {
      try {
        const progress = await userApi.getReadingProgress(id);
        if (progress) {
          savedProgress.value = progress.progress / 100; // 转换为 0-1 范围
        }
      } catch {
        // 忽略错误
      }
    }
  } catch (error) {
    console.error('加载书籍失败', error);
    showToast('加载失败');
    loading.value = false;
  } finally {
    // 不支持的格式直接显示提示
    if (book.value && !supportedFormats.includes(book.value.format.toLowerCase())) {
      loading.value = false;
    }
  }
}

onMounted(() => {
  loadBook();
});
</script>

<style lang="scss" scoped>
// ============================================
// Reader Page - iOS (Mobile) + Material Design (PC)
// ============================================

.reader-page {
  height: 100vh;

  @media (max-width: 767px) {
    background-color: var(--ios-background);
  }

  @media (min-width: 768px) {
    background-color: var(--md-background);
  }
}

.loading-page {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;

  @media (max-width: 767px) {
    background-color: var(--ios-card-bg);
  }

  @media (min-width: 768px) {
    background-color: var(--md-surface);
  }
}

.format-notice-page {
  height: 100vh;
  display: flex;
  flex-direction: column;

  @media (max-width: 767px) {
    background-color: var(--ios-background);
  }

  @media (min-width: 768px) {
    background-color: var(--md-background);
  }

  // iOS NavBar style
  :deep(.van-nav-bar) {
    @media (max-width: 767px) {
      background: rgba(249, 249, 249, 0.94);
      backdrop-filter: saturate(180%) blur(20px);
      -webkit-backdrop-filter: saturate(180%) blur(20px);

      .van-nav-bar__title {
        font-size: 17px;
        font-weight: 600;
      }
    }

    @media (min-width: 768px) {
      background: var(--md-surface);
      box-shadow: var(--md-elevation-1);

      .van-nav-bar__title {
        font-size: 20px;
        font-weight: 500;
      }
    }
  }
}

.format-notice {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;

  @media (max-width: 767px) {
    padding: var(--ios-spacing-lg);
  }

  @media (min-width: 768px) {
    padding: var(--md-spacing-xl);
  }

  .format-title {
    @media (max-width: 767px) {
      font-size: 20px;
      font-weight: 600;
      color: #1C1C1E;
      margin-bottom: var(--ios-spacing-md);
    }

    @media (min-width: 768px) {
      font-size: 24px;
      font-weight: 500;
      color: var(--md-on-surface);
      margin-bottom: var(--md-spacing-md);
    }
  }

  .format-desc {
    margin: 4px 0;

    @media (max-width: 767px) {
      font-size: 15px;
      color: var(--ios-gray);
    }

    @media (min-width: 768px) {
      font-size: 16px;
      color: var(--md-on-surface-medium);
    }
  }

  .format-tips {
    @media (max-width: 767px) {
      font-size: 13px;
      color: var(--ios-gray-2);
      margin-top: var(--ios-spacing-md);
      padding-top: var(--ios-spacing-md);
      border-top: 0.5px solid var(--ios-separator);
    }

    @media (min-width: 768px) {
      font-size: 14px;
      color: var(--md-on-surface-disabled);
      margin-top: var(--md-spacing-md);
      padding-top: var(--md-spacing-md);
      border-top: 1px solid rgba(0, 0, 0, 0.08);
    }
  }

  :deep(.van-empty__description) {
    @media (max-width: 767px) {
      margin-top: var(--ios-spacing-md);
      padding: 0 var(--ios-spacing-lg);
    }

    @media (min-width: 768px) {
      margin-top: var(--md-spacing-md);
      padding: 0 var(--md-spacing-xl);
    }
  }

  :deep(.van-button) {
    @media (max-width: 767px) {
      margin-top: var(--ios-spacing-lg);
      min-width: 180px;
      border-radius: var(--ios-radius-sm);
    }

    @media (min-width: 768px) {
      margin-top: var(--md-spacing-lg);
      min-width: 200px;
      border-radius: var(--md-radius-sm);
      box-shadow: var(--md-elevation-2);

      &:hover {
        box-shadow: var(--md-elevation-3);
      }
    }
  }
}
</style>
