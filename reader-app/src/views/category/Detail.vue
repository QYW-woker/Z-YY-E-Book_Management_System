<template>
  <div class="category-detail-page">
    <van-nav-bar
      :title="categoryName || '分类'"
      left-arrow
      @click-left="router.back()"
    />

    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <van-list
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多了"
        @load="loadMore"
      >
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
            <div class="book-title ellipsis">{{ book.title }}</div>
            <div class="book-author ellipsis">{{ book.author || '未知作者' }}</div>
            <div class="book-desc ellipsis-2">{{ book.description || '暂无简介' }}</div>
            <div class="book-meta">
              <van-tag plain type="primary" size="small">{{ book.format.toUpperCase() }}</van-tag>
              <span class="stats">
                <van-icon name="eye-o" /> {{ book.view_count }}
                <van-icon name="down" style="margin-left: 8px" /> {{ book.download_count }}
              </span>
            </div>
          </div>
        </div>
      </van-list>
    </van-pull-refresh>

    <van-empty v-if="!loading && books.length === 0" description="暂无书籍" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { booksApi } from '@/api/books';
import type { Book, Category } from '@/types';

const router = useRouter();
const route = useRoute();

const categoryName = ref('');
const books = ref<Book[]>([]);
const loading = ref(false);
const finished = ref(false);
const refreshing = ref(false);
const page = ref(1);
const pageSize = 20;

// 获取书籍封面
function getBookCover(book: Book): string {
  if (book.cover_path) {
    return `/uploads/${book.cover_path}`;
  }
  return '';
}

// 跳转书籍详情
function goBookDetail(id: string) {
  router.push(`/books/${id}`);
}

// 加载书籍
async function loadBooks() {
  try {
    loading.value = true;
    const categoryId = route.params.id as string;
    const data = await booksApi.getCategoryBooks(categoryId, page.value, pageSize);
    if (page.value === 1) {
      books.value = data.list;
    } else {
      books.value.push(...data.list);
    }
    finished.value = data.list.length < pageSize;
  } catch (error) {
    console.error('加载书籍失败', error);
  } finally {
    loading.value = false;
    refreshing.value = false;
  }
}

// 加载更多
function loadMore() {
  if (loading.value || finished.value) return;
  page.value++;
  loadBooks();
}

// 下拉刷新
function onRefresh() {
  page.value = 1;
  finished.value = false;
  loadBooks();
}

// 加载分类信息
async function loadCategory() {
  try {
    const categories = await booksApi.getCategories();
    const findCategory = (cats: Category[], id: string): Category | null => {
      for (const cat of cats) {
        if (cat.id === id) return cat;
        if (cat.children) {
          const found = findCategory(cat.children, id);
          if (found) return found;
        }
      }
      return null;
    };
    const category = findCategory(categories, route.params.id as string);
    if (category) {
      categoryName.value = category.name;
    }
  } catch (error) {
    console.error('加载分类失败', error);
  }
}

onMounted(() => {
  loadCategory();
  loadBooks();
});
</script>

<style lang="scss" scoped>
.category-detail-page {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.book-item {
  display: flex;
  padding: 12px 16px;
  background-color: #fff;
  border-bottom: 1px solid #f5f5f5;

  .book-cover {
    width: 80px;
    height: 110px;
    border-radius: 4px;
    overflow: hidden;
    flex-shrink: 0;
    margin-right: 12px;
  }

  .book-info {
    flex: 1;
    min-width: 0;

    .book-title {
      font-size: 15px;
      font-weight: 500;
      color: #323233;
    }

    .book-author {
      margin-top: 4px;
      font-size: 12px;
      color: #969799;
    }

    .book-desc {
      margin-top: 8px;
      font-size: 12px;
      color: #646566;
      line-height: 1.5;
    }

    .book-meta {
      margin-top: 8px;
      display: flex;
      align-items: center;
      gap: 12px;

      .stats {
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
  font-size: 12px;
  text-align: center;
  padding: 8px;
}
</style>
