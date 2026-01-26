<template>
  <div class="favorites-page">
    <van-nav-bar
      title="我的收藏"
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
        <van-swipe-cell v-for="item in list" :key="item.id">
          <div
            class="favorite-item"
            @click="goBookDetail(item.book_id)"
          >
            <van-image
              class="book-cover"
              :src="getBookCover(item)"
              fit="cover"
            >
              <template #error>
                <div class="default-cover">{{ item.title?.slice(0, 4) }}</div>
              </template>
            </van-image>
            <div class="book-info">
              <div class="book-title ellipsis">{{ item.title }}</div>
              <div class="book-author ellipsis">{{ item.author || '未知作者' }}</div>
              <div class="book-desc ellipsis-2">{{ item.description || '暂无简介' }}</div>
              <div class="favorite-time">收藏于 {{ formatTime(item.created_at) }}</div>
            </div>
          </div>
          <template #right>
            <van-button
              square
              type="danger"
              text="取消收藏"
              class="delete-btn"
              @click="handleRemove(item.book_id)"
            />
          </template>
        </van-swipe-cell>
      </van-list>
    </van-pull-refresh>

    <van-empty v-if="!loading && list.length === 0" description="暂无收藏" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { showToast } from 'vant';
import { userApi } from '@/api/user';
import type { Favorite } from '@/types';

const router = useRouter();

const list = ref<Favorite[]>([]);
const loading = ref(false);
const finished = ref(false);
const refreshing = ref(false);
const page = ref(1);
const pageSize = 20;

// 获取书籍封面
function getBookCover(item: Favorite): string {
  if (item.cover_path) {
    return `/uploads/${item.cover_path}`;
  }
  return '';
}

// 格式化时间
function formatTime(timeStr: string): string {
  const date = new Date(timeStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// 跳转书籍详情
function goBookDetail(id: string) {
  router.push(`/books/${id}`);
}

// 取消收藏
async function handleRemove(bookId: string) {
  try {
    await userApi.removeFavorite(bookId);
    list.value = list.value.filter(item => item.book_id !== bookId);
    showToast('已取消收藏');
  } catch (error) {
    // 错误已在拦截器中处理
  }
}

// 加载数据
async function loadData() {
  try {
    loading.value = true;
    const data = await userApi.getFavorites(page.value, pageSize);
    if (page.value === 1) {
      list.value = data.list;
    } else {
      list.value.push(...data.list);
    }
    finished.value = data.list.length < pageSize;
  } catch (error) {
    console.error('加载失败', error);
  } finally {
    loading.value = false;
    refreshing.value = false;
  }
}

// 加载更多
function loadMore() {
  if (loading.value || finished.value) return;
  page.value++;
  loadData();
}

// 下拉刷新
function onRefresh() {
  page.value = 1;
  finished.value = false;
  loadData();
}

onMounted(() => {
  loadData();
});
</script>

<style lang="scss" scoped>
.favorites-page {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.favorite-item {
  display: flex;
  padding: 12px 16px;
  background-color: #fff;

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

    .favorite-time {
      margin-top: 8px;
      font-size: 11px;
      color: #c8c9cc;
    }
  }
}

.delete-btn {
  height: 100%;
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
