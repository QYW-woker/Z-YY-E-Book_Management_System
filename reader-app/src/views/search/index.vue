<template>
  <div class="search-page">
    <!-- 搜索栏 -->
    <div class="search-header">
      <van-search
        v-model="keyword"
        placeholder="搜索书名、作者、ISBN"
        show-action
        autofocus
        @search="onSearch"
        @clear="onClear"
      >
        <template #action>
          <div @click="onSearch">搜索</div>
        </template>
      </van-search>
    </div>

    <!-- 搜索前显示历史和热门 -->
    <div v-if="!hasSearched" class="search-suggestions">
      <!-- 搜索历史 -->
      <div v-if="searchStore.searchHistory.length > 0" class="section">
        <div class="section-header">
          <span class="title">搜索历史</span>
          <van-icon name="delete-o" @click="clearHistory" />
        </div>
        <div class="tag-list">
          <van-tag
            v-for="item in searchStore.searchHistory"
            :key="item"
            plain
            size="medium"
            closeable
            @click="searchByKeyword(item)"
            @close="removeHistory(item)"
          >
            {{ item }}
          </van-tag>
        </div>
      </div>

      <!-- 热门搜索 -->
      <div class="section">
        <div class="section-header">
          <span class="title">热门搜索</span>
        </div>
        <div class="tag-list">
          <van-tag
            v-for="item in hotKeywords"
            :key="item.keyword"
            plain
            type="primary"
            size="medium"
            @click="searchByKeyword(item.keyword)"
          >
            {{ item.keyword }}
          </van-tag>
        </div>
        <van-empty v-if="hotKeywords.length === 0" description="暂无热门搜索" />
      </div>

      <!-- 高级搜索入口 -->
      <div class="advanced-entry" @click="goAdvancedSearch">
        <van-icon name="filter-o" />
        <span>高级搜索</span>
        <van-icon name="arrow" />
      </div>
    </div>

    <!-- 搜索结果 -->
    <div v-else class="search-results">
      <!-- 筛选和排序 -->
      <div class="filter-bar">
        <span class="result-count">共 {{ total }} 条结果</span>
        <van-dropdown-menu>
          <van-dropdown-item v-model="sortBy" :options="sortOptions" @change="onSortChange" />
        </van-dropdown-menu>
      </div>

      <!-- 结果列表 -->
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
              <div class="book-title ellipsis" v-html="highlightKeyword(book.title)"></div>
              <div class="book-author ellipsis" v-html="'作者：' + highlightKeyword(book.author || '未知')"></div>
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

      <van-empty v-if="!loading && books.length === 0" description="未找到相关书籍" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { booksApi } from '@/api/books';
import { useSearchStore } from '@/stores/search';
import type { Book, HotKeyword } from '@/types';

const router = useRouter();
const route = useRoute();
const searchStore = useSearchStore();

const keyword = ref('');
const hasSearched = ref(false);
const books = ref<Book[]>([]);
const hotKeywords = ref<HotKeyword[]>([]);
const loading = ref(false);
const finished = ref(false);
const refreshing = ref(false);
const page = ref(1);
const pageSize = 20;
const total = ref(0);

const sortBy = ref('relevance');
const sortOptions = [
  { text: '相关度', value: 'relevance' },
  { text: '最新上架', value: 'newest' },
  { text: '最热门', value: 'popular' },
  { text: '标题A-Z', value: 'title' },
];

// 获取书籍封面
function getBookCover(book: Book): string {
  if (book.cover_path) {
    return `/uploads/${book.cover_path}`;
  }
  return '';
}

// 高亮关键词
function highlightKeyword(text: string): string {
  if (!keyword.value || !text) return text;
  const regex = new RegExp(`(${keyword.value})`, 'gi');
  return text.replace(regex, '<span style="color: #1989fa">$1</span>');
}

// 搜索
async function onSearch() {
  if (!keyword.value.trim()) return;
  searchStore.addHistory(keyword.value.trim());
  hasSearched.value = true;
  resetBooks();
  loadBooks();
}

// 按关键词搜索
function searchByKeyword(kw: string) {
  keyword.value = kw;
  onSearch();
}

// 清除搜索
function onClear() {
  hasSearched.value = false;
  books.value = [];
}

// 排序变化
function onSortChange() {
  resetBooks();
  loadBooks();
}

// 重置书籍列表
function resetBooks() {
  books.value = [];
  page.value = 1;
  finished.value = false;
}

// 加载书籍
async function loadBooks() {
  if (!keyword.value.trim()) return;

  try {
    loading.value = true;
    const data = await booksApi.searchBooks({
      keyword: keyword.value.trim(),
      sort_by: sortBy.value as any,
      page: page.value,
      page_size: pageSize,
    });
    if (page.value === 1) {
      books.value = data.list;
    } else {
      books.value.push(...data.list);
    }
    total.value = data.total;
    finished.value = data.list.length < pageSize;
  } catch (error) {
    console.error('搜索失败', error);
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

// 跳转书籍详情
function goBookDetail(id: string) {
  router.push(`/books/${id}`);
}

// 跳转高级搜索
function goAdvancedSearch() {
  router.push('/search/advanced');
}

// 清空历史
function clearHistory() {
  searchStore.clearHistory();
}

// 删除单条历史
function removeHistory(kw: string) {
  searchStore.removeHistory(kw);
}

// 加载热门关键词
async function loadHotKeywords() {
  try {
    hotKeywords.value = await booksApi.getHotKeywords(10);
  } catch (error) {
    console.error('加载热门关键词失败', error);
  }
}

// 处理路由参数
watch(
  () => route.query,
  (query) => {
    if (query.keyword) {
      keyword.value = query.keyword as string;
      onSearch();
    }
    if (query.sort_by) {
      sortBy.value = query.sort_by as string;
    }
  },
  { immediate: true }
);

onMounted(() => {
  loadHotKeywords();
});
</script>

<style lang="scss" scoped>
.search-page {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.search-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: #fff;
}

.search-suggestions {
  padding: 16px;
}

.section {
  margin-bottom: 24px;

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;

    .title {
      font-size: 14px;
      font-weight: 500;
      color: #323233;
    }

    .van-icon {
      color: #969799;
    }
  }

  .tag-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
}

.advanced-entry {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background-color: #fff;
  border-radius: 8px;
  color: #1989fa;
  font-size: 14px;

  .van-icon {
    margin: 0 4px;
  }
}

.search-results {
  .filter-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 16px;
    background-color: #fff;
    border-bottom: 1px solid #f5f5f5;

    .result-count {
      font-size: 12px;
      color: #969799;
    }

    :deep(.van-dropdown-menu__bar) {
      box-shadow: none;
    }
  }
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
