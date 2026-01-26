<template>
  <div class="newest-books-page">
    <van-nav-bar
      title="最新上架"
      left-arrow
      @click-left="router.back()"
    />

    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <div class="book-list">
        <div
          v-for="book in books"
          :key="book.book_id"
          class="book-item"
          @click="goBookDetail(book.book_id)"
        >
          <van-image
            class="book-cover"
            :src="getBookCover(book)"
            fit="cover"
          >
            <template #error>
              <div class="default-cover">{{ book.title.slice(0, 4) }}</div>
            </template>
          </van-image>
          <div class="book-info">
            <div class="book-title ellipsis-2">{{ book.title }}</div>
            <div class="book-author ellipsis">{{ book.author || '未知作者' }}</div>
            <div class="book-meta">
              <span class="format">{{ book.format?.toUpperCase() }}</span>
              <span class="date">{{ formatDate(book.created_at) }}</span>
            </div>
          </div>
        </div>
      </div>

      <van-empty v-if="!loading && books.length === 0" description="暂无书籍" />
    </van-pull-refresh>

    <van-loading v-if="loading" class="page-loading" size="24" vertical>
      加载中...
    </van-loading>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { booksApi } from '@/api/books';
import type { Book } from '@/types';

const router = useRouter();
const books = ref<Book[]>([]);
const loading = ref(true);
const refreshing = ref(false);

function getBookCover(book: Book): string {
  if (book.cover_path) {
    return `/uploads/${book.cover_path}`;
  }
  return '';
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function goBookDetail(id: string) {
  router.push(`/books/${id}`);
}

async function loadBooks() {
  try {
    loading.value = true;
    books.value = await booksApi.getNewestBooks(50);
  } catch (error) {
    console.error('加载数据失败', error);
  } finally {
    loading.value = false;
  }
}

async function onRefresh() {
  await loadBooks();
  refreshing.value = false;
}

onMounted(() => {
  loadBooks();
});
</script>

<style lang="scss" scoped>
// ============================================
// Newest Books Page - iOS (Mobile) + Material Design (PC)
// ============================================

.newest-books-page {
  min-height: 100vh;

  // iOS style
  @media (max-width: 767px) {
    background-color: var(--ios-background);
  }

  // Material Design style
  @media (min-width: 768px) {
    background-color: var(--md-background);
    padding-left: 256px; // Sidebar width
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

.page-loading {
  padding: 40px 0;
  text-align: center;
}

.book-list {
  display: grid;
  gap: var(--ios-spacing-md);

  // iOS style - 2 columns
  @media (max-width: 767px) {
    padding: var(--ios-spacing-md);
    grid-template-columns: repeat(2, 1fr);
  }

  // Material Design style - 4+ columns
  @media (min-width: 768px) {
    padding: var(--md-spacing-lg);
    grid-template-columns: repeat(4, 1fr);
    gap: var(--md-spacing-lg);
  }

  @media (min-width: 1200px) {
    grid-template-columns: repeat(5, 1fr);
  }
}

.book-item {
  overflow: hidden;
  cursor: pointer;

  // iOS style
  @media (max-width: 767px) {
    background: var(--ios-card-bg);
    border-radius: var(--ios-radius-md);

    &:active {
      opacity: 0.7;
      transform: scale(0.98);
    }
  }

  // Material Design style
  @media (min-width: 768px) {
    background: var(--md-surface);
    border-radius: var(--md-radius-lg);
    box-shadow: var(--md-elevation-1);
    transition: all 0.28s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      transform: translateY(-4px);
      box-shadow: var(--md-elevation-hover);
    }
  }

  .book-cover {
    width: 100%;

    @media (max-width: 767px) {
      height: 200px;
    }

    @media (min-width: 768px) {
      height: 240px;
    }
  }

  .book-info {
    // iOS style
    @media (max-width: 767px) {
      padding: var(--ios-spacing-md);
    }

    // Material Design style
    @media (min-width: 768px) {
      padding: var(--md-spacing-md);
    }

    .book-title {
      line-height: 1.4;

      @media (max-width: 767px) {
        font-size: 15px;
        font-weight: 500;
        color: #1C1C1E;
        height: 42px;
      }

      @media (min-width: 768px) {
        font-size: 16px;
        font-weight: 500;
        color: var(--md-on-surface);
        height: 45px;
      }
    }

    .book-author {
      @media (max-width: 767px) {
        margin-top: var(--ios-spacing-xs);
        font-size: 13px;
        color: var(--ios-gray);
      }

      @media (min-width: 768px) {
        margin-top: var(--md-spacing-xs);
        font-size: 14px;
        color: var(--md-on-surface-medium);
      }
    }

    .book-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;

      @media (max-width: 767px) {
        margin-top: var(--ios-spacing-sm);
      }

      @media (min-width: 768px) {
        margin-top: var(--md-spacing-sm);
      }

      .format {
        padding: 2px 8px;
        border-radius: 4px;

        @media (max-width: 767px) {
          font-size: 11px;
          background-color: rgba(0, 122, 255, 0.1);
          color: var(--ios-blue);
        }

        @media (min-width: 768px) {
          font-size: 12px;
          background-color: rgba(25, 118, 210, 0.1);
          color: var(--md-primary);
          font-weight: 500;
        }
      }

      .date {
        @media (max-width: 767px) {
          font-size: 12px;
          color: var(--ios-gray-2);
        }

        @media (min-width: 768px) {
          font-size: 12px;
          color: var(--md-on-surface-disabled);
        }
      }
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
  font-weight: 500;
  text-align: center;
  padding: 12px;
}
</style>
