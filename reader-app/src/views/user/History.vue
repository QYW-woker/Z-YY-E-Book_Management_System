<template>
  <div class="history-page">
    <van-nav-bar
      title="浏览历史"
      left-arrow
      @click-left="router.back()"
    >
      <template #right>
        <span v-if="list.length > 0" class="clear-btn" @click="handleClear">清空</span>
      </template>
    </van-nav-bar>

    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <van-list
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多了"
        @load="loadMore"
      >
        <div
          v-for="item in list"
          :key="item.id"
          class="history-item"
          @click="goBookDetail(item.book_id)"
        >
          <van-image
            class="book-cover-small"
            :src="getBookCover(item)"
            fit="cover"
          >
            <template #error>
              <div class="default-cover">{{ item.title?.slice(0, 2) }}</div>
            </template>
          </van-image>
          <div class="book-info">
            <div class="book-title ellipsis">{{ item.title }}</div>
            <div class="book-author ellipsis">{{ item.author || '未知作者' }}</div>
            <div class="view-time">{{ formatTime(item.view_time) }}</div>
          </div>
        </div>
      </van-list>
    </van-pull-refresh>

    <van-empty v-if="!loading && list.length === 0" description="暂无浏览记录" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { showConfirmDialog, showToast } from 'vant';
import { userApi } from '@/api/user';
import type { ViewHistory } from '@/types';

const router = useRouter();

const list = ref<ViewHistory[]>([]);
const loading = ref(false);
const finished = ref(false);
const refreshing = ref(false);
const page = ref(1);
const pageSize = 20;

// 获取书籍封面
function getBookCover(item: ViewHistory): string {
  if (item.cover_path) {
    return `/uploads/${item.cover_path}`;
  }
  return '';
}

// 格式化时间
function formatTime(timeStr: string): string {
  const date = new Date(timeStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return '今天';
  if (days === 1) return '昨天';
  if (days < 7) return `${days}天前`;
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

// 跳转书籍详情
function goBookDetail(id: string) {
  router.push(`/books/${id}`);
}

// 加载数据
async function loadData() {
  try {
    loading.value = true;
    const data = await userApi.getViewHistory(page.value, pageSize);
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

// 清空历史
async function handleClear() {
  try {
    await showConfirmDialog({
      title: '提示',
      message: '确定要清空所有浏览历史吗？',
    });
    await userApi.clearViewHistory();
    list.value = [];
    showToast('已清空');
  } catch {
    // 取消
  }
}

onMounted(() => {
  loadData();
});
</script>

<style lang="scss" scoped>
.history-page {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.clear-btn {
  font-size: 14px;
  color: #1989fa;
}

.history-item {
  display: flex;
  padding: 12px 16px;
  background-color: #fff;
  border-bottom: 1px solid #f5f5f5;

  .book-cover-small {
    width: 50px;
    height: 68px;
    border-radius: 4px;
    overflow: hidden;
    flex-shrink: 0;
    margin-right: 12px;
  }

  .book-info {
    flex: 1;
    min-width: 0;

    .book-title {
      font-size: 14px;
      font-weight: 500;
      color: #323233;
    }

    .book-author {
      margin-top: 4px;
      font-size: 12px;
      color: #969799;
    }

    .view-time {
      margin-top: 8px;
      font-size: 11px;
      color: #c8c9cc;
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
}
</style>
