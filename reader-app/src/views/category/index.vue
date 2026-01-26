<template>
  <div class="category-page">
    <van-nav-bar title="分类" />

    <div class="category-container">
      <!-- 左侧一级分类 -->
      <div class="category-sidebar">
        <div
          v-for="category in parentCategories"
          :key="category.id"
          class="sidebar-item"
          :class="{ active: activeCategory === category.id }"
          @click="selectCategory(category.id)"
        >
          {{ category.name }}
        </div>
      </div>

      <!-- 右侧内容区 -->
      <div class="category-content">
        <!-- 二级分类 -->
        <div v-if="childCategories.length > 0" class="sub-categories">
          <van-tag
            v-for="child in childCategories"
            :key="child.id"
            plain
            size="medium"
            @click="goCategoryDetail(child.id)"
          >
            {{ child.name }}
            <span class="count">({{ child.book_count || 0 }})</span>
          </van-tag>
        </div>

        <!-- 该分类下的书籍 -->
        <div class="book-list">
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
                    </span>
                  </div>
                </div>
              </div>
            </van-list>
          </van-pull-refresh>

          <van-empty v-if="!loading && books.length === 0" description="暂无书籍" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { booksApi } from '@/api/books';
import type { Book, Category } from '@/types';

const router = useRouter();

const categories = ref<Category[]>([]);
const activeCategory = ref<string>('');
const books = ref<Book[]>([]);
const loading = ref(false);
const finished = ref(false);
const refreshing = ref(false);
const page = ref(1);
const pageSize = 20;

// 一级分类
const parentCategories = computed(() => {
  return categories.value.filter(c => !c.parent_id);
});

// 当前选中分类的子分类
const childCategories = computed(() => {
  const parent = categories.value.find(c => c.id === activeCategory.value);
  return parent?.children || [];
});

// 获取书籍封面
function getBookCover(book: Book): string {
  if (book.cover_path) {
    return `/uploads/${book.cover_path}`;
  }
  return '';
}

// 选择分类
function selectCategory(id: string) {
  activeCategory.value = id;
  resetBooks();
  loadBooks();
}

// 跳转分类详情
function goCategoryDetail(id: string) {
  router.push(`/category/${id}`);
}

// 跳转书籍详情
function goBookDetail(id: string) {
  router.push(`/books/${id}`);
}

// 重置书籍列表
function resetBooks() {
  books.value = [];
  page.value = 1;
  finished.value = false;
}

// 加载书籍
async function loadBooks() {
  if (!activeCategory.value) return;

  try {
    loading.value = true;
    const data = await booksApi.getCategoryBooks(activeCategory.value, page.value, pageSize);
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
  resetBooks();
  loadBooks();
}

// 加载分类
async function loadCategories() {
  try {
    const data = await booksApi.getCategories();
    categories.value = data;
    if (data.length > 0) {
      const firstParent = data.find(c => !c.parent_id);
      if (firstParent) {
        activeCategory.value = firstParent.id;
        loadBooks();
      }
    }
  } catch (error) {
    console.error('加载分类失败', error);
  }
}

onMounted(() => {
  loadCategories();
});
</script>

<style lang="scss" scoped>
.category-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f7f8fa;
}

.category-container {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.category-sidebar {
  width: 90px;
  background-color: #f5f5f5;
  overflow-y: auto;

  .sidebar-item {
    padding: 16px 12px;
    font-size: 13px;
    color: #646566;
    text-align: center;
    border-left: 3px solid transparent;

    &.active {
      background-color: #fff;
      color: #1989fa;
      font-weight: 500;
      border-left-color: #1989fa;
    }
  }
}

.category-content {
  flex: 1;
  overflow-y: auto;
  background-color: #fff;
}

.sub-categories {
  padding: 12px;
  border-bottom: 1px solid #f5f5f5;

  .van-tag {
    margin: 4px 8px 4px 0;

    .count {
      margin-left: 2px;
      color: #969799;
    }
  }
}

.book-list {
  padding: 12px;
}

.book-item {
  display: flex;
  padding: 12px 0;
  border-bottom: 1px solid #f5f5f5;

  &:last-child {
    border-bottom: none;
  }

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
