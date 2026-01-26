<template>
  <div class="home-page">
    <!-- 顶部搜索栏 -->
    <div class="header">
      <div class="logo">电子书阅读</div>
      <van-search
        v-model="searchValue"
        placeholder="搜索书籍"
        shape="round"
        readonly
        @click="goSearch"
      />
      <div class="user-avatar" @click="goUser">
        <van-image
          v-if="authStore.user?.avatar"
          :src="authStore.user.avatar"
          round
          width="32"
          height="32"
        />
        <van-icon v-else name="user-o" size="24" />
      </div>
    </div>

    <!-- 轮播图 -->
    <van-swipe class="banner" :autoplay="3000" indicator-color="#1989fa">
      <van-swipe-item v-for="book in recommendedBooks" :key="book.book_id" @click="goBookDetail(book.book_id)">
        <div class="banner-item">
          <van-image
            :src="getBookCover(book)"
            fit="cover"
            width="100%"
            height="180"
          />
          <div class="banner-title">{{ book.title }}</div>
        </div>
      </van-swipe-item>
      <van-swipe-item v-if="recommendedBooks.length === 0">
        <div class="banner-empty">暂无推荐</div>
      </van-swipe-item>
    </van-swipe>

    <!-- 分类入口 -->
    <div class="section">
      <div class="section-header">
        <span class="title">分类</span>
        <span class="more" @click="router.push('/category')">查看全部</span>
      </div>
      <van-grid :column-num="4" :border="false">
        <van-grid-item
          v-for="category in topCategories"
          :key="category.id"
          :text="category.name"
          icon="label-o"
          @click="goCategoryDetail(category.id)"
        />
      </van-grid>
    </div>

    <!-- 最新上架 -->
    <div class="section">
      <div class="section-header">
        <span class="title">最新上架</span>
        <span class="more" @click="router.push('/books/newest')">更多</span>
      </div>
      <div class="book-scroll">
        <div
          v-for="book in newestBooks"
          :key="book.book_id"
          class="book-card"
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
          <div class="book-title ellipsis-2">{{ book.title }}</div>
          <div class="book-author ellipsis">{{ book.author || '未知作者' }}</div>
        </div>
      </div>
    </div>

    <!-- 热门下载 -->
    <div class="section">
      <div class="section-header">
        <span class="title">热门下载</span>
        <span class="more" @click="router.push('/books/hot')">更多</span>
      </div>
      <div class="hot-list">
        <div
          v-for="(book, index) in hotBooks"
          :key="book.book_id"
          class="hot-item"
          @click="goBookDetail(book.book_id)"
        >
          <span class="rank" :class="{ top: index < 3 }">{{ index + 1 }}</span>
          <van-image
            class="book-cover-small"
            :src="getBookCover(book)"
            fit="cover"
          >
            <template #error>
              <div class="default-cover book-cover-small">{{ book.title.slice(0, 2) }}</div>
            </template>
          </van-image>
          <div class="book-info">
            <div class="book-title ellipsis">{{ book.title }}</div>
            <div class="book-author ellipsis">{{ book.author || '未知作者' }}</div>
            <div class="book-stats">
              <span><van-icon name="eye-o" /> {{ book.view_count }}</span>
              <span><van-icon name="down" /> {{ book.download_count }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="bottom-space"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { booksApi } from '@/api/books';
import { useAuthStore } from '@/stores/auth';
import type { Book, Category } from '@/types';

const router = useRouter();
const authStore = useAuthStore();

const searchValue = ref('');
const recommendedBooks = ref<Book[]>([]);
const newestBooks = ref<Book[]>([]);
const hotBooks = ref<Book[]>([]);
const categories = ref<Category[]>([]);

const topCategories = computed(() => {
  // 获取前8个一级分类
  return categories.value.filter(c => !c.parent_id).slice(0, 8);
});

// 获取书籍封面
function getBookCover(book: Book): string {
  if (book.cover_path) {
    return `/uploads/${book.cover_path}`;
  }
  return '';
}

// 跳转搜索
function goSearch(keyword?: string, sortBy?: string) {
  const query: any = {};
  if (keyword) query.keyword = keyword;
  if (sortBy) query.sort_by = sortBy;
  router.push({ path: '/search', query });
}

// 跳转用户中心
function goUser() {
  router.push('/user');
}

// 跳转书籍详情
function goBookDetail(id: string) {
  router.push(`/books/${id}`);
}

// 跳转分类详情
function goCategoryDetail(id: string) {
  router.push(`/category/${id}`);
}

// 加载数据
async function loadData() {
  try {
    const [recommended, newest, hot, cats] = await Promise.all([
      booksApi.getRecommendedBooks(5),
      booksApi.getNewestBooks(5),  // 首页仅展示5本
      booksApi.getHotBooks(10),    // 首页最多展示10本
      booksApi.getCategories(),
    ]);
    recommendedBooks.value = recommended;
    newestBooks.value = newest;
    hotBooks.value = hot;
    categories.value = cats;
  } catch (error) {
    console.error('加载数据失败', error);
  }
}

onMounted(() => {
  loadData();
});
</script>

<style lang="scss" scoped>
.home-page {
  background-color: #f5f7fa;
  min-height: 100vh;

  // PC端内边距
  @media (min-width: 768px) {
    padding: 24px 32px;
  }
}

.header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(135deg, #1989fa 0%, #2b7cdd 100%);

  // PC端隐藏移动端header
  @media (min-width: 768px) {
    display: none;
  }

  .logo {
    color: #fff;
    font-size: 18px;
    font-weight: bold;
    margin-right: 12px;
    white-space: nowrap;
  }

  .van-search {
    flex: 1;
    padding: 0;

    :deep(.van-search__content) {
      background-color: rgba(255, 255, 255, 0.9);
    }
  }

  .user-avatar {
    margin-left: 12px;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background-color: rgba(255, 255, 255, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    cursor: pointer;
  }
}

.banner {
  height: 180px;

  // PC端更高的轮播图
  @media (min-width: 768px) {
    height: 280px;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  }

  .banner-item {
    position: relative;
    height: 180px;

    @media (min-width: 768px) {
      height: 280px;
    }
  }

  .banner-title {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 8px 12px;
    background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
    color: #fff;
    font-size: 16px;

    @media (min-width: 768px) {
      padding: 16px 24px;
      font-size: 20px;
    }
  }

  .banner-empty {
    height: 180px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f5f5f5;
    color: #999;

    @media (min-width: 768px) {
      height: 280px;
    }
  }
}

.section {
  margin-top: 16px;
  padding: 0 12px;

  @media (min-width: 768px) {
    margin-top: 32px;
    padding: 0;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;

    @media (min-width: 768px) {
      margin-bottom: 20px;
    }

    .title {
      font-size: 16px;
      font-weight: bold;
      color: #323233;

      @media (min-width: 768px) {
        font-size: 20px;
      }
    }

    .more {
      font-size: 12px;
      color: #969799;
      cursor: pointer;

      @media (min-width: 768px) {
        font-size: 14px;
        color: #1989fa;

        &:hover {
          text-decoration: underline;
        }
      }
    }
  }
}

// PC端分类用Grid布局
:deep(.van-grid) {
  @media (min-width: 768px) {
    background: #fff;
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  }
}

.book-scroll {
  display: flex;
  overflow-x: auto;
  gap: 12px;
  padding-bottom: 8px;

  &::-webkit-scrollbar {
    display: none;
  }

  // PC端改为Grid布局
  @media (min-width: 768px) {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 24px;
    overflow-x: visible;
    padding-bottom: 0;
  }

  @media (min-width: 1200px) {
    grid-template-columns: repeat(5, 1fr);
  }

  .book-card {
    flex-shrink: 0;
    width: 100px;
    cursor: pointer;

    @media (min-width: 768px) {
      width: auto;
      background: #fff;
      border-radius: 12px;
      padding: 16px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
      transition: all 0.3s;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
      }
    }

    .book-cover {
      width: 100px;
      height: 138px;
      border-radius: 4px;
      overflow: hidden;

      @media (min-width: 768px) {
        width: 100%;
        height: 200px;
        border-radius: 8px;
      }
    }

    .book-title {
      margin-top: 8px;
      font-size: 13px;
      color: #323233;
      line-height: 1.4;

      @media (min-width: 768px) {
        margin-top: 12px;
        font-size: 15px;
        font-weight: 500;
      }
    }

    .book-author {
      margin-top: 4px;
      font-size: 11px;
      color: #969799;

      @media (min-width: 768px) {
        margin-top: 6px;
        font-size: 13px;
      }
    }
  }
}

.hot-list {
  background-color: #fff;
  border-radius: 8px;
  padding: 8px;

  @media (min-width: 768px) {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  }

  @media (min-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }

  .hot-item {
    display: flex;
    align-items: center;
    padding: 8px;
    border-bottom: 1px solid #f5f5f5;
    cursor: pointer;

    &:last-child {
      border-bottom: none;
    }

    @media (min-width: 768px) {
      padding: 16px;
      border: 1px solid #f0f0f0;
      border-radius: 12px;
      transition: all 0.3s;

      &:hover {
        border-color: #1989fa;
        box-shadow: 0 4px 12px rgba(25, 137, 250, 0.15);
      }
    }

    .rank {
      width: 24px;
      height: 24px;
      line-height: 24px;
      text-align: center;
      font-size: 14px;
      font-weight: bold;
      color: #969799;
      margin-right: 12px;

      @media (min-width: 768px) {
        width: 32px;
        height: 32px;
        line-height: 32px;
        font-size: 16px;
        margin-right: 16px;
      }

      &.top {
        color: #ee0a24;

        @media (min-width: 768px) {
          background: linear-gradient(135deg, #ff6034 0%, #ee0a24 100%);
          color: #fff;
          border-radius: 50%;
        }
      }
    }

    .book-cover-small {
      width: 50px;
      height: 68px;
      border-radius: 4px;
      overflow: hidden;
      margin-right: 12px;

      @media (min-width: 768px) {
        width: 70px;
        height: 96px;
        border-radius: 6px;
        margin-right: 16px;
      }
    }

    .book-info {
      flex: 1;
      min-width: 0;

      .book-title {
        font-size: 14px;
        color: #323233;
        font-weight: 500;

        @media (min-width: 768px) {
          font-size: 16px;
        }
      }

      .book-author {
        margin-top: 4px;
        font-size: 12px;
        color: #969799;

        @media (min-width: 768px) {
          margin-top: 6px;
          font-size: 14px;
        }
      }

      .book-stats {
        margin-top: 4px;
        font-size: 11px;
        color: #c8c9cc;

        @media (min-width: 768px) {
          margin-top: 8px;
          font-size: 13px;
        }

        span {
          margin-right: 12px;

          @media (min-width: 768px) {
            margin-right: 20px;
          }
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
  text-align: center;
  padding: 8px;

  @media (min-width: 768px) {
    font-size: 16px;
  }
}

.bottom-space {
  height: 20px;

  @media (min-width: 768px) {
    height: 40px;
  }
}
</style>
