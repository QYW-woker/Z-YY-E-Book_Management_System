<template>
  <div class="page-container dashboard">
    <div class="page-header">
      <h1 class="page-title">工作台</h1>
      <p class="page-description">欢迎回来，{{ admin?.nickname || admin?.username }}</p>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="16" class="stat-cards">
      <el-col :xs="12" :sm="6">
        <div class="stat-card blue">
          <div class="stat-content">
            <div class="stat-value">{{ formatNumber(overview.total_books) }}<span class="unit">册</span></div>
            <div class="stat-label">电子书总数</div>
          </div>
          <div class="stat-decoration">
            <svg viewBox="0 0 100 100" class="decoration-svg">
              <circle cx="80" cy="20" r="40" fill="rgba(255,255,255,0.1)"/>
              <circle cx="90" cy="60" r="30" fill="rgba(255,255,255,0.08)"/>
            </svg>
          </div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="6">
        <div class="stat-card green">
          <div class="stat-content">
            <div class="stat-value">{{ formatNumber(overview.published_books) }}<span class="unit">册</span></div>
            <div class="stat-label">已上架</div>
          </div>
          <div class="stat-decoration">
            <svg viewBox="0 0 100 100" class="decoration-svg">
              <circle cx="80" cy="20" r="40" fill="rgba(255,255,255,0.1)"/>
              <circle cx="90" cy="60" r="30" fill="rgba(255,255,255,0.08)"/>
            </svg>
          </div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="6">
        <div class="stat-card orange">
          <div class="stat-content">
            <div class="stat-value">{{ formatNumber(overview.today_downloads) }}<span class="unit">次</span></div>
            <div class="stat-label">今日下载</div>
          </div>
          <div class="stat-decoration">
            <svg viewBox="0 0 100 100" class="decoration-svg">
              <circle cx="80" cy="20" r="40" fill="rgba(255,255,255,0.1)"/>
              <circle cx="90" cy="60" r="30" fill="rgba(255,255,255,0.08)"/>
            </svg>
          </div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="6">
        <div class="stat-card purple">
          <div class="stat-content">
            <div class="stat-value">{{ formatNumber(overview.today_views) }}<span class="unit">次</span></div>
            <div class="stat-label">今日浏览</div>
          </div>
          <div class="stat-decoration">
            <svg viewBox="0 0 100 100" class="decoration-svg">
              <circle cx="80" cy="20" r="40" fill="rgba(255,255,255,0.1)"/>
              <circle cx="90" cy="60" r="30" fill="rgba(255,255,255,0.08)"/>
            </svg>
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
              <span class="ranking-count">{{ formatNumber(item.count) }}次</span>
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
              <span class="ranking-count">{{ formatNumber(item.count) }}次</span>
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
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#E5E6EB',
      borderWidth: 1,
      textStyle: { color: '#1F2329' },
    },
    legend: {
      data: ['下载量', '浏览量'],
      bottom: 0,
      textStyle: { color: '#86909C' },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '5%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: trendData.value.map((d) => d.date),
      axisLine: { lineStyle: { color: '#E5E6EB' } },
      axisLabel: { color: '#86909C' },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#F2F3F5', type: 'dashed' } },
      axisLabel: { color: '#86909C' },
    },
    series: [
      {
        name: '下载量',
        type: 'line',
        smooth: true,
        areaStyle: {
          opacity: 0.3,
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(46, 107, 230, 0.3)' },
            { offset: 1, color: 'rgba(46, 107, 230, 0.05)' }
          ])
        },
        data: trendData.value.map((d) => d.downloads),
        itemStyle: { color: '#2E6BE6' },
        lineStyle: { width: 2 },
      },
      {
        name: '浏览量',
        type: 'line',
        smooth: true,
        areaStyle: {
          opacity: 0.3,
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(82, 196, 26, 0.3)' },
            { offset: 1, color: 'rgba(82, 196, 26, 0.05)' }
          ])
        },
        data: trendData.value.map((d) => d.views),
        itemStyle: { color: '#52C41A' },
        lineStyle: { width: 2 },
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
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#E5E6EB',
      borderWidth: 1,
      textStyle: { color: '#1F2329' },
    },
    legend: {
      bottom: 0,
      left: 'center',
      textStyle: { color: '#86909C' },
    },
    series: [
      {
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: false,
        label: {
          show: false,
          position: 'center',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 18,
            fontWeight: 'bold',
            color: '#1F2329',
          },
        },
        labelLine: {
          show: false,
        },
        data: [
          { value: overview.value.published_books, name: '已上架', itemStyle: { color: '#52C41A' } },
          { value: overview.value.draft_books, name: '草稿', itemStyle: { color: '#86909C' } },
          { value: overview.value.archived_books, name: '已下架', itemStyle: { color: '#FAAD14' } },
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
$primary-color: #2E6BE6;
$primary-light: #5B8FF9;

.dashboard {
  .stat-cards {
    margin-bottom: 16px;
  }

  .stat-card {
    background: linear-gradient(135deg, $primary-color 0%, $primary-light 100%);
    border-radius: 12px;
    padding: 20px 24px;
    position: relative;
    overflow: hidden;
    min-height: 100px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    box-shadow: 0 4px 12px rgba($primary-color, 0.25);
    transition: transform 0.25s, box-shadow 0.25s;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba($primary-color, 0.35);
    }

    &.blue {
      background: linear-gradient(135deg, #2E6BE6 0%, #5B8FF9 100%);
      box-shadow: 0 4px 12px rgba(#2E6BE6, 0.25);
      &:hover { box-shadow: 0 8px 20px rgba(#2E6BE6, 0.35); }
    }

    &.green {
      background: linear-gradient(135deg, #52C41A 0%, #95DE64 100%);
      box-shadow: 0 4px 12px rgba(#52C41A, 0.25);
      &:hover { box-shadow: 0 8px 20px rgba(#52C41A, 0.35); }
    }

    &.orange {
      background: linear-gradient(135deg, #FA8C16 0%, #FFC53D 100%);
      box-shadow: 0 4px 12px rgba(#FA8C16, 0.25);
      &:hover { box-shadow: 0 8px 20px rgba(#FA8C16, 0.35); }
    }

    &.purple {
      background: linear-gradient(135deg, #722ED1 0%, #B37FEB 100%);
      box-shadow: 0 4px 12px rgba(#722ED1, 0.25);
      &:hover { box-shadow: 0 8px 20px rgba(#722ED1, 0.35); }
    }

    .stat-content {
      position: relative;
      z-index: 1;
    }

    .stat-value {
      font-size: 32px;
      font-weight: 700;
      color: #fff;
      line-height: 1.2;

      .unit {
        font-size: 14px;
        font-weight: 400;
        margin-left: 4px;
        opacity: 0.85;
      }
    }

    .stat-label {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.85);
      margin-top: 8px;
    }

    .stat-decoration {
      position: absolute;
      right: -20px;
      top: -20px;
      width: 120px;
      height: 120px;
      opacity: 0.6;

      .decoration-svg {
        width: 100%;
        height: 100%;
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
      padding-bottom: 16px;
      border-bottom: 1px solid #F2F3F5;

      h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: #1F2329;
        display: flex;
        align-items: center;
        gap: 8px;

        &::before {
          content: '';
          width: 4px;
          height: 16px;
          background: linear-gradient(180deg, $primary-color 0%, $primary-light 100%);
          border-radius: 2px;
        }
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
      padding-bottom: 16px;
      border-bottom: 1px solid #F2F3F5;

      h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: #1F2329;
        display: flex;
        align-items: center;
        gap: 8px;

        &::before {
          content: '';
          width: 4px;
          height: 16px;
          background: linear-gradient(180deg, $primary-color 0%, $primary-light 100%);
          border-radius: 2px;
        }
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
      border-bottom: 1px solid #F7F8FA;
      transition: background-color 0.2s;

      &:hover {
        background-color: #FAFBFC;
        margin: 0 -20px;
        padding: 12px 20px;
      }

      &:last-child {
        border-bottom: none;
      }

      .ranking-num {
        width: 24px;
        height: 24px;
        border-radius: 6px;
        background: #F2F3F5;
        color: #86909C;
        font-size: 12px;
        font-weight: 600;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 12px;
        flex-shrink: 0;

        &.top {
          background: linear-gradient(135deg, #FA8C16 0%, #FFC53D 100%);
          color: #fff;
        }
      }

      .ranking-cover {
        width: 40px;
        height: 54px;
        object-fit: cover;
        border-radius: 6px;
        background: #F2F3F5;
        margin-right: 12px;
        flex-shrink: 0;
      }

      .ranking-info {
        flex: 1;
        min-width: 0;

        .ranking-title {
          font-size: 14px;
          color: #1F2329;
          font-weight: 500;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .ranking-author {
          font-size: 12px;
          color: #86909C;
          margin-top: 4px;
        }
      }

      .ranking-count {
        font-size: 14px;
        font-weight: 600;
        color: $primary-color;
        margin-left: 12px;
        flex-shrink: 0;
      }
    }
  }
}
</style>
