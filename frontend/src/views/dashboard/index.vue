<template>
  <div class="page-container dashboard">
    <div class="page-header">
      <h1 class="page-title">仪表盘</h1>
      <p class="page-description">欢迎回来，{{ admin?.nickname || admin?.username }}</p>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="16" class="stat-cards">
      <el-col :xs="12" :sm="6">
        <div class="stat-card">
          <div class="stat-icon books">
            <el-icon :size="28"><Reading /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ formatNumber(overview.total_books) }}</div>
            <div class="stat-label">电子书总数</div>
          </div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="6">
        <div class="stat-card">
          <div class="stat-icon published">
            <el-icon :size="28"><SuccessFilled /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ formatNumber(overview.published_books) }}</div>
            <div class="stat-label">已上架</div>
          </div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="6">
        <div class="stat-card">
          <div class="stat-icon downloads">
            <el-icon :size="28"><Download /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ formatNumber(overview.today_downloads) }}</div>
            <div class="stat-label">今日下载</div>
          </div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="6">
        <div class="stat-card">
          <div class="stat-icon views">
            <el-icon :size="28"><View /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ formatNumber(overview.today_views) }}</div>
            <div class="stat-label">今日浏览</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="16" class="chart-section">
      <el-col :xs="24" :lg="16">
        <div class="card chart-card">
          <div class="card-header">
            <h3>访问趋势</h3>
            <el-radio-group v-model="trendType" size="small" @change="fetchTrends">
              <el-radio-button value="daily">日</el-radio-button>
              <el-radio-button value="weekly">周</el-radio-button>
              <el-radio-button value="monthly">月</el-radio-button>
            </el-radio-group>
          </div>
          <div ref="trendChartRef" class="chart-container"></div>
        </div>
      </el-col>
      <el-col :xs="24" :lg="8">
        <div class="card chart-card">
          <div class="card-header">
            <h3>状态分布</h3>
          </div>
          <div ref="statusChartRef" class="chart-container"></div>
        </div>
      </el-col>
    </el-row>

    <!-- 排行榜 -->
    <el-row :gutter="16" class="ranking-section">
      <el-col :xs="24" :md="12">
        <div class="card ranking-card">
          <div class="card-header">
            <h3>下载排行 TOP10</h3>
            <el-button text type="primary" @click="$router.push('/statistics')">
              查看更多
            </el-button>
          </div>
          <div class="ranking-list">
            <div
              v-for="(item, index) in downloadRanking"
              :key="item.book_id"
              class="ranking-item"
            >
              <span class="ranking-num" :class="{ top: index < 3 }">{{ index + 1 }}</span>
              <img :src="getCoverUrl(item.cover_path)" class="ranking-cover" />
              <div class="ranking-info">
                <div class="ranking-title">{{ item.title }}</div>
                <div class="ranking-author">{{ item.author }}</div>
              </div>
              <span class="ranking-count">{{ formatNumber(item.count) }}</span>
            </div>
            <el-empty v-if="!downloadRanking.length" description="暂无数据" />
          </div>
        </div>
      </el-col>
      <el-col :xs="24" :md="12">
        <div class="card ranking-card">
          <div class="card-header">
            <h3>浏览排行 TOP10</h3>
            <el-button text type="primary" @click="$router.push('/statistics')">
              查看更多
            </el-button>
          </div>
          <div class="ranking-list">
            <div
              v-for="(item, index) in viewRanking"
              :key="item.book_id"
              class="ranking-item"
            >
              <span class="ranking-num" :class="{ top: index < 3 }">{{ index + 1 }}</span>
              <img :src="getCoverUrl(item.cover_path)" class="ranking-cover" />
              <div class="ranking-info">
                <div class="ranking-title">{{ item.title }}</div>
                <div class="ranking-author">{{ item.author }}</div>
              </div>
              <span class="ranking-count">{{ formatNumber(item.count) }}</span>
            </div>
            <el-empty v-if="!viewRanking.length" description="暂无数据" />
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { useAuthStore } from '@/stores/auth'
import { statisticsApi } from '@/api/statistics'
import type { StatisticsOverview, TrendData, RankingItem } from '@/types'
import { formatNumber } from '@/utils'

const authStore = useAuthStore()
const admin = computed(() => authStore.admin)

const defaultCover = '/images/default-cover.png'

// 获取封面完整URL
const getCoverUrl = (coverPath: string | undefined | null): string => {
  if (!coverPath) return defaultCover
  if (coverPath.startsWith('data:') || coverPath.startsWith('http') || coverPath.startsWith('/')) {
    return coverPath
  }
  return `/uploads/${coverPath}`
}

// 统计概览
const overview = ref<StatisticsOverview>({
  total_books: 0,
  published_books: 0,
  draft_books: 0,
  archived_books: 0,
  total_categories: 0,
  total_tags: 0,
  today_downloads: 0,
  today_views: 0,
  total_downloads: 0,
  total_views: 0,
})

// 趋势数据
const trendType = ref<'daily' | 'weekly' | 'monthly'>('daily')
const trendData = ref<TrendData[]>([])

// 排行榜
const downloadRanking = ref<RankingItem[]>([])
const viewRanking = ref<RankingItem[]>([])

// 图表实例
const trendChartRef = ref<HTMLElement>()
const statusChartRef = ref<HTMLElement>()
let trendChart: echarts.ECharts | null = null
let statusChart: echarts.ECharts | null = null

// 获取统计概览
const fetchOverview = async () => {
  try {
    overview.value = await statisticsApi.getOverview()
    renderStatusChart()
  } catch {
    // 使用模拟数据
    overview.value = {
      total_books: 12580,
      published_books: 10234,
      draft_books: 1892,
      archived_books: 454,
      total_categories: 45,
      total_tags: 128,
      today_downloads: 1256,
      today_views: 8934,
      total_downloads: 456789,
      total_views: 1234567,
    }
    renderStatusChart()
  }
}

// 获取趋势数据
const fetchTrends = async () => {
  try {
    trendData.value = await statisticsApi.getTrends({ type: trendType.value })
    renderTrendChart()
  } catch {
    // 使用模拟数据
    const days = trendType.value === 'daily' ? 7 : trendType.value === 'weekly' ? 4 : 6
    trendData.value = Array.from({ length: days }, (_, i) => ({
      date: `2024-01-${String(i + 1).padStart(2, '0')}`,
      downloads: Math.floor(Math.random() * 500) + 100,
      views: Math.floor(Math.random() * 2000) + 500,
    }))
    renderTrendChart()
  }
}

// 获取排行榜
const fetchRankings = async () => {
  try {
    const [downloads, views] = await Promise.all([
      statisticsApi.getDownloadRanking({ limit: 10 }),
      statisticsApi.getViewRanking({ limit: 10 }),
    ])
    downloadRanking.value = downloads
    viewRanking.value = views
  } catch {
    // 使用模拟数据
    const mockData = Array.from({ length: 10 }, (_, i) => ({
      book_id: `book-${i}`,
      title: `示例书籍 ${i + 1}`,
      author: `作者 ${i + 1}`,
      cover_path: '',
      count: Math.floor(Math.random() * 10000) + 1000,
    }))
    downloadRanking.value = mockData.sort((a, b) => b.count - a.count)
    viewRanking.value = [...mockData].sort((a, b) => b.count - a.count)
  }
}

// 渲染趋势图表
const renderTrendChart = () => {
  if (!trendChartRef.value) return

  if (!trendChart) {
    trendChart = echarts.init(trendChartRef.value)
  }

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
    },
    legend: {
      data: ['下载量', '浏览量'],
      bottom: 0,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '12%',
      top: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: trendData.value.map((d) => d.date),
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        name: '下载量',
        type: 'line',
        smooth: true,
        areaStyle: { opacity: 0.3 },
        data: trendData.value.map((d) => d.downloads),
        itemStyle: { color: '#409eff' },
      },
      {
        name: '浏览量',
        type: 'line',
        smooth: true,
        areaStyle: { opacity: 0.3 },
        data: trendData.value.map((d) => d.views),
        itemStyle: { color: '#67c23a' },
      },
    ],
  }

  trendChart.setOption(option)
}

// 渲染状态分布图表
const renderStatusChart = () => {
  if (!statusChartRef.value) return

  if (!statusChart) {
    statusChart = echarts.init(statusChartRef.value)
  }

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
    },
    legend: {
      bottom: 0,
      left: 'center',
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        label: {
          show: false,
          position: 'center',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 20,
            fontWeight: 'bold',
          },
        },
        labelLine: {
          show: false,
        },
        data: [
          { value: overview.value.published_books, name: '已上架', itemStyle: { color: '#67c23a' } },
          { value: overview.value.draft_books, name: '草稿', itemStyle: { color: '#909399' } },
          { value: overview.value.archived_books, name: '已下架', itemStyle: { color: '#e6a23c' } },
        ],
      },
    ],
  }

  statusChart.setOption(option)
}

// 窗口大小变化时调整图表
const handleResize = () => {
  trendChart?.resize()
  statusChart?.resize()
}

onMounted(() => {
  fetchOverview()
  fetchTrends()
  fetchRankings()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  trendChart?.dispose()
  statusChart?.dispose()
})
</script>

<style lang="scss" scoped>
.dashboard {
  .stat-cards {
    margin-bottom: 16px;
  }

  .stat-card {
    background: #fff;
    border-radius: 8px;
    padding: 20px;
    display: flex;
    align-items: center;
    gap: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

    .stat-icon {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;

      &.books { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
      &.published { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); }
      &.downloads { background: linear-gradient(135deg, #fc4a1a 0%, #f7b733 100%); }
      &.views { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
    }

    .stat-info {
      .stat-value {
        font-size: 28px;
        font-weight: 600;
        color: #303133;
        line-height: 1.2;
      }

      .stat-label {
        font-size: 14px;
        color: #909399;
        margin-top: 4px;
      }
    }
  }

  .chart-section {
    margin-bottom: 16px;
  }

  .chart-card {
    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;

      h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: #303133;
      }
    }

    .chart-container {
      height: 300px;
    }
  }

  .ranking-card {
    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;

      h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: #303133;
      }
    }

    .ranking-list {
      max-height: 400px;
      overflow-y: auto;
    }

    .ranking-item {
      display: flex;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid #f0f0f0;

      &:last-child {
        border-bottom: none;
      }

      .ranking-num {
        width: 24px;
        height: 24px;
        border-radius: 4px;
        background: #f0f2f5;
        color: #909399;
        font-size: 12px;
        font-weight: 600;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 12px;

        &.top {
          background: linear-gradient(135deg, #fc4a1a 0%, #f7b733 100%);
          color: #fff;
        }
      }

      .ranking-cover {
        width: 40px;
        height: 54px;
        object-fit: cover;
        border-radius: 4px;
        background: #f0f2f5;
        margin-right: 12px;
      }

      .ranking-info {
        flex: 1;
        min-width: 0;

        .ranking-title {
          font-size: 14px;
          color: #303133;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .ranking-author {
          font-size: 12px;
          color: #909399;
          margin-top: 4px;
        }
      }

      .ranking-count {
        font-size: 14px;
        font-weight: 600;
        color: #409eff;
        margin-left: 12px;
      }
    }
  }
}
</style>
