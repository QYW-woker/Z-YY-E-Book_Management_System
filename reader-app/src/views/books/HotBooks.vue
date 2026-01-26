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
.hot-books-page {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.page-loading {
  padding: 40px 0;
  text-align: center;
}

.book-list {
  padding: 12px;
}

.book-item {
  display: flex;
  align-items: center;
  background-color: #fff;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

  .rank {
    width: 28px;
    height: 28px;
    line-height: 28px;
    text-align: center;
    font-size: 14px;
    font-weight: bold;
    color: #969799;
    margin-right: 12px;
    flex-shrink: 0;

    &.top {
      background: linear-gradient(135deg, #ff6034 0%, #ee0a24 100%);
      color: #fff;
      border-radius: 50%;
    }
  }

  .book-cover {
    width: 60px;
    height: 82px;
    border-radius: 4px;
    overflow: hidden;
    margin-right: 12px;
    flex-shrink: 0;
  }

  .book-info {
    flex: 1;
    min-width: 0;

    .book-title {
      font-size: 15px;
      font-weight: 500;
      color: #323233;
      line-height: 1.4;
    }

    .book-author {
      margin-top: 4px;
      font-size: 12px;
      color: #969799;
    }

    .book-stats {
      margin-top: 6px;
      font-size: 12px;
      color: #c8c9cc;

      span {
        margin-right: 16px;

        .van-icon {
          margin-right: 2px;
        }
      }
    }

    .book-meta {
      margin-top: 6px;
      display: flex;
      gap: 8px;

      .format {
        font-size: 10px;
        padding: 2px 6px;
        background-color: #e8f4ff;
        color: #1989fa;
        border-radius: 4px;
      }

      .category {
        font-size: 10px;
        padding: 2px 6px;
        background-color: #fff7e6;
        color: #ff976a;
        border-radius: 4px;
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
  text-align: center;
}

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
