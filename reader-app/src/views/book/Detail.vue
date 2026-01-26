<template>
  <div class="book-detail-page">
    <van-nav-bar
      title="书籍详情"
      left-arrow
      @click-left="router.back()"
    >
      <template #right>
        <van-icon name="share-o" size="20" @click="handleShare" />
      </template>
    </van-nav-bar>

    <van-skeleton :loading="loading" :row="8" :row-width="['100%', '60%', '80%', '100%', '100%', '60%', '40%', '100%']">
      <div v-if="book" class="book-content">
        <!-- 书籍基本信息 -->
        <div class="book-header">
          <van-image
            class="book-cover-large"
            :src="getBookCover(book)"
            fit="cover"
          >
            <template #error>
              <div class="default-cover book-cover-large">{{ book.title }}</div>
            </template>
          </van-image>
          <div class="book-info">
            <h1 class="title">{{ book.title }}</h1>
            <div class="author">{{ book.author || '未知作者' }}</div>
            <div class="publisher">{{ book.publisher || '未知出版社' }} | {{ book.publish_date || '未知年份' }}</div>
            <div class="tags">
              <van-tag v-for="tag in book.tags" :key="tag.id" plain :color="tag.color">
                {{ tag.name }}
              </van-tag>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="action-buttons">
          <van-button
            type="primary"
            icon="eye-o"
            round
            @click="handleRead"
          >
            在线阅读
          </van-button>
          <van-button
            type="success"
            icon="down"
            round
            @click="handleDownload"
          >
            下载
          </van-button>
          <van-button
            :icon="book.is_favorited ? 'star' : 'star-o'"
            :type="book.is_favorited ? 'warning' : 'default'"
            round
            @click="handleFavorite"
          >
            {{ book.is_favorited ? '已收藏' : '收藏' }}
          </van-button>
        </div>

        <!-- 简介 -->
        <div class="section">
          <div class="section-title">简介</div>
          <div class="description" :class="{ expanded: descExpanded }">
            {{ book.description || '暂无简介' }}
          </div>
          <div v-if="book.description && book.description.length > 100" class="expand-btn" @click="descExpanded = !descExpanded">
            {{ descExpanded ? '收起' : '展开' }}
          </div>
        </div>

        <!-- 详细信息 -->
        <div class="section">
          <div class="section-title">详细信息</div>
          <van-cell-group inset>
            <van-cell title="ISBN" :value="book.isbn || '-'" />
            <van-cell title="语言" :value="getLanguageName(book.language)" />
            <van-cell title="格式" :value="book.format?.toUpperCase() || '-'" />
            <van-cell title="大小" :value="formatFileSize(book.file_size)" />
            <van-cell title="分类">
              <template #value>
                <span v-for="(cat, index) in book.categories" :key="cat.id">
                  {{ cat.name }}{{ index < book.categories.length - 1 ? ' > ' : '' }}
                </span>
                <span v-if="!book.categories?.length">-</span>
              </template>
            </van-cell>
          </van-cell-group>
        </div>

        <!-- 阅读统计 -->
        <div class="section">
          <div class="section-title">阅读统计</div>
          <div class="stats-row">
            <div class="stat-item">
              <div class="value">{{ book.view_count }}</div>
              <div class="label">浏览</div>
            </div>
            <div class="stat-item">
              <div class="value">{{ book.download_count }}</div>
              <div class="label">下载</div>
            </div>
          </div>
        </div>

        <!-- 相关推荐 -->
        <div v-if="relatedBooks.length > 0" class="section">
          <div class="section-title">相关推荐</div>
          <div class="related-books">
            <div
              v-for="relBook in relatedBooks"
              :key="relBook.book_id"
              class="related-book"
              @click="goBookDetail(relBook.book_id)"
            >
              <van-image
                class="book-cover"
                :src="getBookCover(relBook)"
                fit="cover"
              >
                <template #error>
                  <div class="default-cover">{{ relBook.title.slice(0, 4) }}</div>
                </template>
              </van-image>
              <div class="book-title ellipsis-2">{{ relBook.title }}</div>
            </div>
          </div>
        </div>

        <div class="bottom-space"></div>
      </div>
    </van-skeleton>

    <van-empty v-if="!loading && !book" description="书籍不存在" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { showToast, showConfirmDialog } from 'vant';
import { booksApi } from '@/api/books';
import { userApi } from '@/api/user';
import { useAuthStore } from '@/stores/auth';
import type { Book } from '@/types';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const loading = ref(true);
const book = ref<Book | null>(null);
const relatedBooks = ref<Book[]>([]);
const descExpanded = ref(false);

// 获取书籍封面
function getBookCover(b: Book): string {
  if (b.cover_path) {
    return `/uploads/${b.cover_path}`;
  }
  return '';
}

// 格式化文件大小
function formatFileSize(bytes: number): string {
  if (!bytes) return '-';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(1) + ' MB';
}

// 获取语言名称
function getLanguageName(code: string): string {
  const languages: Record<string, string> = {
    'zh-CN': '简体中文',
    'zh-TW': '繁体中文',
    'en': '英语',
    'ja': '日语',
    'ko': '韩语',
  };
  return languages[code] || code || '-';
}

// 在线阅读
function handleRead() {
  router.push(`/reader/${route.params.id}`);
}

// 下载
async function handleDownload() {
  try {
    const downloadInfo = await booksApi.getDownloadUrl(route.params.id as string);
    // 创建下载链接
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

// 收藏/取消收藏
async function handleFavorite() {
  if (!authStore.isLoggedIn) {
    showToast('请先登录');
    router.push('/login');
    return;
  }

  if (!book.value) return;

  try {
    if (book.value.is_favorited) {
      await userApi.removeFavorite(book.value.book_id);
      book.value.is_favorited = false;
      showToast('已取消收藏');
    } else {
      await userApi.addFavorite(book.value.book_id);
      book.value.is_favorited = true;
      showToast('收藏成功');
    }
  } catch (error) {
    // 错误已在拦截器中处理
  }
}

// 分享
function handleShare() {
  if (navigator.share) {
    navigator.share({
      title: book.value?.title,
      text: book.value?.description,
      url: window.location.href,
    });
  } else {
    // 复制链接
    navigator.clipboard.writeText(window.location.href);
    showToast('链接已复制');
  }
}

// 跳转书籍详情
function goBookDetail(id: string) {
  router.push(`/books/${id}`);
}

// 加载书籍详情
async function loadBook() {
  try {
    loading.value = true;
    const id = route.params.id as string;
    const [bookData, related] = await Promise.all([
      booksApi.getBookDetail(id),
      booksApi.getRelatedBooks(id, 6),
    ]);
    book.value = bookData;
    relatedBooks.value = related;
  } catch (error) {
    console.error('加载书籍详情失败', error);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadBook();
});
</script>

<style lang="scss" scoped>
.book-detail-page {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.book-content {
  padding-bottom: 20px;
}

.book-header {
  display: flex;
  padding: 20px 16px;
  background-color: #fff;

  .book-cover-large {
    width: 120px;
    height: 165px;
    border-radius: 8px;
    overflow: hidden;
    flex-shrink: 0;
    margin-right: 16px;
  }

  .book-info {
    flex: 1;
    min-width: 0;

    .title {
      font-size: 18px;
      font-weight: bold;
      color: #323233;
      margin: 0 0 8px 0;
    }

    .author {
      font-size: 14px;
      color: #646566;
      margin-bottom: 4px;
    }

    .publisher {
      font-size: 12px;
      color: #969799;
      margin-bottom: 12px;
    }

    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
  }
}

.action-buttons {
  display: flex;
  gap: 12px;
  padding: 16px;
  background-color: #fff;
  border-top: 1px solid #f5f5f5;

  .van-button {
    flex: 1;
  }
}

.section {
  margin-top: 12px;
  padding: 16px;
  background-color: #fff;

  .section-title {
    font-size: 16px;
    font-weight: bold;
    color: #323233;
    margin-bottom: 12px;
  }

  .description {
    font-size: 14px;
    color: #646566;
    line-height: 1.6;
    overflow: hidden;
    max-height: 4.8em;

    &.expanded {
      max-height: none;
    }
  }

  .expand-btn {
    margin-top: 8px;
    font-size: 13px;
    color: #1989fa;
    text-align: center;
  }
}

.stats-row {
  display: flex;
  justify-content: space-around;
  text-align: center;

  .stat-item {
    .value {
      font-size: 24px;
      font-weight: bold;
      color: #1989fa;
    }

    .label {
      font-size: 12px;
      color: #969799;
      margin-top: 4px;
    }
  }
}

.related-books {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;

  .related-book {
    width: calc(33.33% - 8px);

    .book-cover {
      width: 100%;
      height: 0;
      padding-bottom: 138%;
      border-radius: 4px;
      overflow: hidden;
      position: relative;

      :deep(.van-image__img) {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
      }
    }

    .book-title {
      margin-top: 8px;
      font-size: 12px;
      color: #323233;
      line-height: 1.4;
    }
  }
}

.default-cover {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-size: 14px;
  text-align: center;
  padding: 8px;
}
</style>
