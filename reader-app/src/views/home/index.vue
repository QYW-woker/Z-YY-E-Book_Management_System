<template>
  <div class="home-page">
    <!-- 移动端顶部搜索栏 - iOS Large Title style -->
    <div class="header mobile-only">
      <div class="header-top">
        <div class="logo">电子书阅读</div>
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
      <van-search
        v-model="searchValue"
        placeholder="搜索书籍"
        shape="round"
        readonly
        @click="goSearch"
      />
    </div>

    <!-- PC端顶部搜索栏 - Material Design App Bar -->
    <div class="pc-header pc-only">
      <div class="search-container">
        <van-search
          v-model="searchValue"
          placeholder="搜索书籍、作者..."
          shape="round"
          readonly
          @click="goSearch"
        />
      </div>
      <div class="header-actions">
        <div class="user-profile" @click="goUser">
          <van-image
            v-if="authStore.user?.avatar"
            :src="authStore.user.avatar"
            round
            width="40"
            height="40"
          />
          <van-icon v-else name="user-circle-o" size="40" color="#9e9e9e" />
        </div>
      </div>
    </div>

    <!-- 轮播图 -->
    <van-swipe class="banner" :autoplay="4000" indicator-color="var(--ios-blue)">
      <van-swipe-item v-for="book in recommendedBooks" :key="book.book_id" @click="goBookDetail(book.book_id)">
        <div class="banner-item">
          <!-- 底层：模糊背景 -->
          <div
            class="banner-bg"
            :style="{ backgroundImage: `url(${getBookCover(book)})` }"
          ></div>
          <div class="banner-overlay"></div>
          <!-- 上层：内容区域 -->
          <div class="banner-content">
            <!-- 原始比例封面（左侧） -->
            <div class="banner-cover">
              <van-image
                :src="getBookCover(book)"
                fit="contain"
                width="100%"
                height="100%"
              >
                <template #error>
                  <div class="default-cover-banner">{{ book.title.slice(0, 2) }}</div>
                </template>
              </van-image>
            </div>
            <!-- 书名和作者（右侧） -->
            <div class="banner-info">
              <div class="banner-title">{{ book.title }}</div>
              <div class="banner-author">{{ book.author || '未知作者' }}</div>
            </div>
          </div>
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
      <van-grid class="category-grid" :column-num="4" :border="false">
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
// ============================================
// Home Page - iOS (Mobile) + Material Design (PC)
// ============================================

.home-page {
  min-height: 100vh;

  // iOS style background
  @media (max-width: 767px) {
    background-color: var(--ios-background);
  }

  // Material Design background
  @media (min-width: 768px) {
    background-color: var(--md-background);
    padding: var(--md-spacing-lg) var(--md-spacing-xl);
  }
}

// ============================================
// Mobile Header - iOS Large Title Style
// ============================================
.header {
  padding: var(--ios-spacing-md);
  background: var(--ios-card-bg);

  .header-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--ios-spacing-sm);
  }

  .logo {
    font-size: 28px;
    font-weight: 700;
    color: #1C1C1E;
    letter-spacing: -0.026em;
  }

  .user-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--ios-gray);
    cursor: pointer;

    &:active {
      opacity: 0.7;
    }
  }

  :deep(.van-search) {
    padding: 0;

    .van-search__content {
      background: rgba(118, 118, 128, 0.12);
      border-radius: 10px;
    }

    .van-field__control {
      font-size: 17px;
    }
  }
}

// ============================================
// PC Header - Material Design App Bar Style
// ============================================
.pc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--md-spacing-lg);
  padding: var(--md-spacing-md) 0;

  .search-container {
    flex: 1;
    max-width: 600px;

    :deep(.van-search) {
      padding: 0;

      .van-search__content {
        background: var(--md-surface);
        box-shadow: var(--md-elevation-1);
        border-radius: 28px;
        transition: box-shadow 0.28s cubic-bezier(0.4, 0, 0.2, 1);

        &:hover {
          box-shadow: var(--md-elevation-2);
        }
      }
    }
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: var(--md-spacing-md);
  }

  .user-profile {
    cursor: pointer;
    border-radius: 50%;
    transition: all 0.28s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      box-shadow: var(--md-elevation-2);
    }
  }
}

// ============================================
// Banner - iOS Carousel Style
// ============================================
.banner {
  // iOS style
  @media (max-width: 767px) {
    height: 200px;
    margin: var(--ios-spacing-md);
    border-radius: var(--ios-radius-lg);
    overflow: hidden;
  }

  // Material Design style
  @media (min-width: 768px) {
    height: 320px;
    border-radius: var(--md-radius-xl);
    overflow: hidden;
    box-shadow: var(--md-elevation-2);
  }

  .banner-item {
    position: relative;
    height: 100%;
    overflow: hidden;
  }

  // 底层模糊背景
  .banner-bg {
    position: absolute;
    inset: -20px; // 扩展边缘避免模糊边缘出现空白
    background-size: cover;
    background-position: center;
    filter: blur(20px);
    transform: scale(1.1);
  }

  // 半透明遮罩层
  .banner-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      135deg,
      rgba(0, 0, 0, 0.3) 0%,
      rgba(0, 0, 0, 0.5) 100%
    );
  }

  // 内容层
  .banner-content {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: flex-end;
    justify-content: flex-start;

    @media (max-width: 767px) {
      padding: var(--ios-spacing-md);
      flex-direction: row;
    }

    @media (min-width: 768px) {
      padding: var(--md-spacing-lg) var(--md-spacing-xl);
      flex-direction: row;
      // PC 端限制内容最大宽度
      max-width: 800px;
    }
  }

  // 文字信息区（右侧）
  .banner-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;

    @media (max-width: 767px) {
      padding-left: var(--ios-spacing-md);
    }

    @media (min-width: 768px) {
      padding-left: var(--md-spacing-xl);
      max-width: 500px;
    }
  }

  .banner-title {
    color: #fff;
    font-weight: 600;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);

    @media (max-width: 767px) {
      font-size: 18px;
      letter-spacing: -0.022em;
    }

    @media (min-width: 768px) {
      font-size: 28px;
      font-weight: 500;
      letter-spacing: 0;
    }
  }

  .banner-author {
    color: rgba(255, 255, 255, 0.85);
    margin-top: 4px;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);

    @media (max-width: 767px) {
      font-size: 14px;
    }

    @media (min-width: 768px) {
      font-size: 16px;
      margin-top: 8px;
    }
  }

  // 原始比例封面
  .banner-cover {
    flex-shrink: 0;
    border-radius: var(--ios-radius-sm);
    overflow: hidden;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);

    @media (max-width: 767px) {
      width: 90px;
      height: 126px; // 1:1.4 书籍比例
    }

    @media (min-width: 768px) {
      width: 160px;
      height: 224px;
      border-radius: var(--md-radius-md);
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
    }

    :deep(.van-image) {
      width: 100%;
      height: 100%;
    }
  }

  .default-cover-banner {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
    font-size: 18px;
    font-weight: 600;
  }

  .banner-empty {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--ios-gray-5);
    color: var(--ios-gray);
  }
}

// ============================================
// Section Headers
// ============================================
.section {
  margin-top: var(--ios-spacing-lg);
  padding: 0 var(--ios-spacing-md);

  @media (min-width: 768px) {
    margin-top: var(--md-spacing-xl);
    padding: 0;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--ios-spacing-md);

    @media (min-width: 768px) {
      margin-bottom: var(--md-spacing-lg);
    }

    .title {
      // iOS style
      @media (max-width: 767px) {
        font-size: 20px;
        font-weight: 700;
        color: #1C1C1E;
        letter-spacing: -0.026em;
      }

      // Material Design style
      @media (min-width: 768px) {
        font-size: var(--md-headline-6);
        font-weight: 500;
        color: var(--md-on-surface);
        letter-spacing: 0.0125em;
      }
    }

    .more {
      cursor: pointer;

      // iOS style
      @media (max-width: 767px) {
        font-size: 15px;
        color: var(--ios-blue);

        &:active {
          opacity: 0.5;
        }
      }

      // Material Design style
      @media (min-width: 768px) {
        font-size: 14px;
        font-weight: 500;
        color: var(--md-primary);
        text-transform: uppercase;
        letter-spacing: 0.0892857em;

        &:hover {
          text-decoration: underline;
        }
      }
    }
  }
}

// ============================================
// Category Grid
// ============================================
.category-grid {
  // iOS style
  @media (max-width: 767px) {
    background: var(--ios-card-bg);
    border-radius: var(--ios-radius-md);
    overflow: hidden;

    :deep(.van-grid-item__content) {
      padding: var(--ios-spacing-md) var(--ios-spacing-sm);

      &:active {
        background: var(--ios-gray-5);
      }
    }

    :deep(.van-grid-item__icon) {
      color: var(--ios-blue);
    }
  }

  // Material Design style
  @media (min-width: 768px) {
    background: var(--md-surface);
    border-radius: var(--md-radius-lg);
    padding: var(--md-spacing-md);
    box-shadow: var(--md-elevation-1);

    :deep(.van-grid-item) {
      .van-grid-item__content {
        padding: var(--md-spacing-md);
        border-radius: var(--md-radius-md);
        transition: background-color 0.28s cubic-bezier(0.4, 0, 0.2, 1);

        &:hover {
          background: rgba(25, 118, 210, 0.08);
        }
      }

      .van-grid-item__icon {
        color: var(--md-primary);
      }

      .van-grid-item__text {
        font-weight: 500;
      }
    }
  }
}

// ============================================
// Book Scroll - Horizontal on Mobile, Grid on PC
// ============================================
.book-scroll {
  display: flex;
  overflow-x: auto;
  gap: var(--ios-spacing-md);
  padding-bottom: var(--ios-spacing-sm);
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    display: none;
  }

  // Material Design Grid on PC
  @media (min-width: 768px) {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: var(--md-spacing-lg);
    overflow-x: visible;
    padding-bottom: 0;
    scroll-snap-type: none;
  }

  .book-card {
    flex-shrink: 0;
    width: 110px;
    scroll-snap-align: start;
    cursor: pointer;

    // iOS touch feedback
    @media (max-width: 767px) {
      &:active {
        opacity: 0.7;
        transform: scale(0.98);
      }
    }

    // Material Design Card on PC
    @media (min-width: 768px) {
      width: auto;
      background: var(--md-surface);
      border-radius: var(--md-radius-lg);
      padding: var(--md-spacing-md);
      box-shadow: var(--md-elevation-1);
      transition: all 0.28s cubic-bezier(0.4, 0, 0.2, 1);

      &:hover {
        transform: translateY(-4px);
        box-shadow: var(--md-elevation-hover);
      }
    }

    .book-cover {
      border-radius: var(--ios-radius-sm);
      overflow: hidden;

      @media (max-width: 767px) {
        width: 110px;
        height: 154px;
      }

      @media (min-width: 768px) {
        width: 100%;
        height: 220px;
        border-radius: var(--md-radius-md);
      }
    }

    .book-title {
      line-height: 1.4;

      @media (max-width: 767px) {
        margin-top: var(--ios-spacing-sm);
        font-size: 14px;
        font-weight: 500;
        color: #1C1C1E;
      }

      @media (min-width: 768px) {
        margin-top: var(--md-spacing-md);
        font-size: 16px;
        font-weight: 500;
        color: var(--md-on-surface);
      }
    }

    .book-author {
      @media (max-width: 767px) {
        margin-top: 2px;
        font-size: 12px;
        color: var(--ios-gray);
      }

      @media (min-width: 768px) {
        margin-top: var(--md-spacing-xs);
        font-size: 14px;
        color: var(--md-on-surface-medium);
      }
    }
  }
}

// ============================================
// Hot List
// ============================================
.hot-list {
  overflow: hidden;

  // iOS style
  @media (max-width: 767px) {
    background: var(--ios-card-bg);
    border-radius: var(--ios-radius-md);
  }

  // Material Design style
  @media (min-width: 768px) {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--md-spacing-md);
    background: transparent;
  }

  .hot-item {
    display: flex;
    align-items: center;
    cursor: pointer;

    // iOS style
    @media (max-width: 767px) {
      padding: var(--ios-spacing-md);
      position: relative;

      &:not(:last-child)::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 64px;
        right: 0;
        height: 0.5px;
        background: var(--ios-separator);
      }

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

      &:hover {
        box-shadow: var(--md-elevation-hover);
        transform: translateY(-2px);
      }
    }

    .rank {
      width: 24px;
      height: 24px;
      line-height: 24px;
      text-align: center;
      font-weight: 600;
      margin-right: var(--ios-spacing-md);

      @media (max-width: 767px) {
        font-size: 15px;
        color: var(--ios-gray);
      }

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

    .book-cover-small {
      border-radius: var(--ios-radius-sm);
      overflow: hidden;
      margin-right: var(--ios-spacing-md);

      @media (max-width: 767px) {
        width: 50px;
        height: 70px;
      }

      @media (min-width: 768px) {
        width: 70px;
        height: 98px;
        border-radius: var(--md-radius-sm);
        margin-right: var(--md-spacing-md);
      }
    }

    .book-info {
      flex: 1;
      min-width: 0;

      .book-title {
        font-weight: 500;

        @media (max-width: 767px) {
          font-size: 15px;
          color: #1C1C1E;
        }

        @media (min-width: 768px) {
          font-size: 16px;
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
      }
    }
  }
}

// ============================================
// Default Cover
// ============================================
.default-cover {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  text-align: center;
  padding: var(--ios-spacing-sm);

  @media (max-width: 767px) {
    font-size: 13px;
    font-weight: 500;
  }

  @media (min-width: 768px) {
    font-size: 16px;
    font-weight: 500;
  }
}

// ============================================
// Bottom Space
// ============================================
.bottom-space {
  @media (max-width: 767px) {
    height: var(--ios-spacing-lg);
  }

  @media (min-width: 768px) {
    height: var(--md-spacing-xxl);
  }
}
</style>
