<template>
  <div class="hot-books-page">
    <van-nav-bar
      title="热门下载"
      left-arrow
      @click-left="router.back()"
    />

    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <div class="book-list">
        <div
          v-for="(book, index) in books"
          :key="book.book_id"
          class="book-item"
          @click="goBookDetail(book.book_id)"
        >
          <span class="rank" :class="{ top: index < 3 }">{{ index + 1 }}</span>
          <van-image
            class="book-cover"
            :src="getBookCover(book)"
            fit="cover"
          >
            <template #error>
              <div class="default-cover">{{ book.title.slice(0, 2) }}</div>
            </template>
          </van-image>
          <div class="book-info">
            <div class="book-title ellipsis-2">{{ book.title }}</div>
            <div class="book-author ellipsis">{{ book.author || '未知作者' }}</div>
            <div class="book-stats">
              <span><van-icon name="eye-o" /> {{ book.view_count || 0 }}</span>
              <span><van-icon name="down" /> {{ book.download_count || 0 }}</span>
            </div>
            <div class="book-meta">
              <span class="format">{{ book.format?.toUpperCase() }}</span>
              <span class="category">{{ book.category_name || '未分类' }}</span>
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

function goBookDetail(id: string) {
  router.push(`/books/${id}`);
}

async function loadBooks() {
  try {
    loading.value = true;
    books.value = await booksApi.getHotBooks(50);
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
// Hot Books Page - iOS (Mobile) + Material Design (PC)
// ============================================

.hot-books-page {
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
  // iOS style
  @media (max-width: 767px) {
    padding: var(--ios-spacing-md);
  }

  // Material Design style - 2 column grid
  @media (min-width: 768px) {
    padding: var(--md-spacing-lg);
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--md-spacing-md);
  }

  @media (min-width: 1200px) {
    grid-template-columns: repeat(3, 1fr);
  }
}

.book-item {
  display: flex;
  align-items: center;
  cursor: pointer;

  // iOS style
  @media (max-width: 767px) {
    background: var(--ios-card-bg);
    padding: var(--ios-spacing-md);
    margin-bottom: var(--ios-spacing-sm);
    border-radius: var(--ios-radius-md);
    position: relative;

    &:active {
      background: var(--ios-gray-5);
    }
  }

  // Material Design style
  @media (min-width: 768px) {
    background: var(--md-surface);
    padding: var(--md-spacing-md);
    border-radius: var(--md-radius-lg);
    box-shadow: var(--md-elevation-1);
    transition: all 0.28s cubic-bezier(0.4, 0, 0.2, 1);
    margin-bottom: 0;

    &:hover {
      box-shadow: var(--md-elevation-hover);
      transform: translateY(-2px);
    }
  }

  .rank {
    text-align: center;
    font-weight: 600;
    flex-shrink: 0;

    // iOS style
    @media (max-width: 767px) {
      width: 24px;
      height: 24px;
      line-height: 24px;
      font-size: 15px;
      color: var(--ios-gray);
      margin-right: var(--ios-spacing-md);
    }

    // Material Design style
    @media (min-width: 768px) {
      width: 32px;
      height: 32px;
      line-height: 32px;
      font-size: 16px;
      color: var(--md-on-surface-medium);
      margin-right: var(--md-spacing-md);
    }

    &.top {
      @media (max-width: 767px) {
        color: var(--ios-red);
      }

      @media (min-width: 768px) {
        background: linear-gradient(135deg, #ff6034 0%, #ee0a24 100%);
        color: #fff;
        border-radius: 50%;
      }
    }
  }

  .book-cover {
    flex-shrink: 0;
    overflow: hidden;

    @media (max-width: 767px) {
      width: 60px;
      height: 84px;
      border-radius: var(--ios-radius-sm);
      margin-right: var(--ios-spacing-md);
    }

    @media (min-width: 768px) {
      width: 80px;
      height: 112px;
      border-radius: var(--md-radius-sm);
      margin-right: var(--md-spacing-md);
    }
  }

  .book-info {
    flex: 1;
    min-width: 0;

    .book-title {
      line-height: 1.4;

      @media (max-width: 767px) {
        font-size: 15px;
        font-weight: 500;
        color: #1C1C1E;
      }

      @media (min-width: 768px) {
        font-size: 16px;
        font-weight: 500;
        color: var(--md-on-surface);
      }
    }

    .book-author {
      @media (max-width: 767px) {
        margin-top: 2px;
        font-size: 13px;
        color: var(--ios-gray);
      }

      @media (min-width: 768px) {
        margin-top: var(--md-spacing-xs);
        font-size: 14px;
        color: var(--md-on-surface-medium);
      }
    }

    .book-stats {
      display: flex;
      gap: var(--ios-spacing-md);

      @media (max-width: 767px) {
        margin-top: 4px;
        font-size: 12px;
        color: var(--ios-gray-2);
      }

      @media (min-width: 768px) {
        margin-top: var(--md-spacing-sm);
        font-size: 13px;
        color: var(--md-on-surface-disabled);
        gap: var(--md-spacing-md);
      }

      span {
        display: flex;
        align-items: center;
        gap: 4px;
      }
    }

    .book-meta {
      display: flex;
      gap: var(--ios-spacing-sm);

      @media (max-width: 767px) {
        margin-top: var(--ios-spacing-sm);
      }

      @media (min-width: 768px) {
        margin-top: var(--md-spacing-sm);
        gap: var(--md-spacing-sm);
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

      .category {
        padding: 2px 8px;
        border-radius: 4px;

        @media (max-width: 767px) {
          font-size: 11px;
          background-color: rgba(255, 149, 0, 0.1);
          color: var(--ios-orange);
        }

        @media (min-width: 768px) {
          font-size: 12px;
          background-color: rgba(156, 39, 176, 0.1);
          color: var(--md-secondary);
          font-weight: 500;
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
  font-size: 12px;
  font-weight: 500;
  text-align: center;
}
</style>
