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
.newest-books-page {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.page-loading {
  padding: 40px 0;
  text-align: center;
}

.book-list {
  padding: 12px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.book-item {
  background-color: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

  .book-cover {
    width: 100%;
    height: 180px;
  }

  .book-info {
    padding: 10px;

    .book-title {
      font-size: 14px;
      font-weight: 500;
      color: #323233;
      line-height: 1.4;
      height: 40px;
    }

    .book-author {
      margin-top: 6px;
      font-size: 12px;
      color: #969799;
    }

    .book-meta {
      margin-top: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;

      .format {
        font-size: 10px;
        padding: 2px 6px;
        background-color: #e8f4ff;
        color: #1989fa;
        border-radius: 4px;
      }

      .date {
        font-size: 11px;
        color: #c8c9cc;
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
  text-align: center;
  padding: 12px;
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
