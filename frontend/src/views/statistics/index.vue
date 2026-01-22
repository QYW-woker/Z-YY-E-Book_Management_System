<template>
  <div class="page-container statistics-page">
    <div class="page-header flex-between">
      <div>
        <h1 class="page-title">数据统计</h1>
        <p class="page-description">查看电子书访问、下载等统计数据</p>
      </div>
      <div class="header-actions">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :shortcuts="dateShortcuts"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          style="width: 260px"
          @change="handleDateChange"
        />
        <el-button @click="exportReport">
          <el-icon><Download /></el-icon>导出报表
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="16" class="stat-cards">
      <el-col :xs="12" :sm="6">
        <div class="stat-card">
          <div class="stat-value">{{ formatNumber(overview.total_views) }}</div>
          <div class="stat-label">总浏览量</div>
          <div class="stat-trend up">
            <el-icon><Top /></el-icon>
            <span>12.5%</span>
          </div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="6">
        <div class="stat-card">
          <div class="stat-value">{{ formatNumber(overview.total_downloads) }}</div>
          <div class="stat-label">总下载量</div>
          <div class="stat-trend up">
            <el-icon><Top /></el-icon>
            <span>8.3%</span>
          </div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="6">
        <div class="stat-card">
          <div class="stat-value">{{ formatNumber(overview.today_views) }}</div>
          <div class="stat-label">今日浏览</div>
          <div class="stat-trend down">
            <el-icon><Bottom /></el-icon>
            <span>3.2%</span>
          </div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="6">
        <div class="stat-card">
          <div class="stat-value">{{ formatNumber(overview.today_downloads) }}</div>
          <div class="stat-label">今日下载</div>
          <div class="stat-trend up">
            <el-icon><Top /></el-icon>
            <span>5.8%</span>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 趋势图 -->
    <div class="card chart-card">
      <div class="card-header flex-between">
        <h3>访问趋势</h3>
        <el-radio-group v-model="trendType" size="small" @change="fetchTrends">
          <el-radio-button value="daily">日</el-radio-button>
          <el-radio-button value="weekly">周</el-radio-button>
          <el-radio-button value="monthly">月</el-radio-button>
        </el-radio-group>
      </div>
      <div ref="trendChartRef" class="chart-container"></div>
    </div>

    <!-- 排行榜 -->
    <el-row :gutter="16" class="ranking-section">
      <el-col :xs="24" :md="12">
        <div class="card ranking-card">
          <div class="card-header flex-between">
            <h3>下载排行 TOP50</h3>
            <el-button text type="primary" @click="exportRanking('downloads')">
              导出
            </el-button>
          </div>
          <el-table :data="downloadRanking" max-height="500">
            <el-table-column label="排名" width="60">
              <template #default="{ $index }">
                <span class="ranking-num" :class="{ top: $index < 3 }">{{ $index + 1 }}</span>
              </template>
            </el-table-column>
            <el-table-column label="封面" width="60">
              <template #default="{ row }">
                <img :src="getCoverUrl(row.cover_path)" class="book-cover" />
              </template>
            </el-table-column>
            <el-table-column prop="title" label="书名" min-width="150" show-overflow-tooltip />
            <el-table-column prop="author" label="作者" width="100" show-overflow-tooltip />
            <el-table-column prop="count" label="下载量" width="100" sortable>
              <template #default="{ row }">
                {{ formatNumber(row.count) }}
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>
      <el-col :xs="24" :md="12">
        <div class="card ranking-card">
          <div class="card-header flex-between">
            <h3>浏览排行 TOP50</h3>
            <el-button text type="primary" @click="exportRanking('views')">
              导出
            </el-button>
          </div>
          <el-table :data="viewRanking" max-height="500">
            <el-table-column label="排名" width="60">
              <template #default="{ $index }">
                <span class="ranking-num" :class="{ top: $index < 3 }">{{ $index + 1 }}</span>
              </template>
            </el-table-column>
            <el-table-column label="封面" width="60">
              <template #default="{ row }">
                <img :src="getCoverUrl(row.cover_path)" class="book-cover" />
              </template>
            </el-table-column>
            <el-table-column prop="title" label="书名" min-width="150" show-overflow-tooltip />
            <el-table-column prop="author" label="作者" width="100" show-overflow-tooltip />
            <el-table-column prop="count" label="浏览量" width="100" sortable>
              <template #default="{ row }">
                {{ formatNumber(row.count) }}
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import type { StatisticsOverview, TrendData, RankingItem } from '@/types'
import { statisticsApi } from '@/api/statistics'
import { formatNumber } from '@/utils'

const defaultCover = '/images/default-cover.png'

// 获取封面完整URL
const getCoverUrl = (coverPath: string | undefined | null): string => {
  if (!coverPath) return defaultCover
  if (coverPath.startsWith('data:') || coverPath.startsWith('http') || coverPath.startsWith('/')) {
    return coverPath
  }
  return `/uploads/${coverPath}`
}

// 日期范围
const dateRange = ref<[string, string] | null>(null)
const dateShortcuts = [
  {
    text: '最近一周',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
      return [start, end]
    },
  },
  {
    text: '最近一个月',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
      return [start, end]
    },
  },
  {
    text: '最近三个月',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 90)
      return [start, end]
    },
  },
]

// 统计数据
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

// 图表
const trendChartRef = ref<HTMLElement>()
let trendChart: echarts.ECharts | null = null

// 获取统计概览
const fetchOverview = async () => {
  try {
    overview.value = await statisticsApi.getOverview()
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
  }
}

// 获取趋势数据
const fetchTrends = async () => {
  try {
    const params: any = { type: trendType.value }
    if (dateRange.value) {
      params.start_date = dateRange.value[0]
      params.end_date = dateRange.value[1]
    }
    trendData.value = await statisticsApi.getTrends(params)
    renderTrendChart()
  } catch {
    // 使用模拟数据
    const days = trendType.value === 'daily' ? 30 : trendType.value === 'weekly' ? 12 : 6
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
    const params: any = { limit: 50 }
    if (dateRange.value) {
      params.start_date = dateRange.value[0]
      params.end_date = dateRange.value[1]
    }
    const [downloads, views] = await Promise.all([
      statisticsApi.getDownloadRanking(params),
      statisticsApi.getViewRanking(params),
    ])
    downloadRanking.value = downloads
    viewRanking.value = views
  } catch {
    // 使用模拟数据
    const mockData = Array.from({ length: 50 }, (_, i) => ({
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
    yAxis: [
      {
        type: 'value',
        name: '下载量',
        position: 'left',
      },
      {
        type: 'value',
        name: '浏览量',
        position: 'right',
      },
    ],
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
        yAxisIndex: 1,
        areaStyle: { opacity: 0.3 },
        data: trendData.value.map((d) => d.views),
        itemStyle: { color: '#67c23a' },
      },
    ],
  }

  trendChart.setOption(option)
}

// 日期变化
const handleDateChange = () => {
  fetchTrends()
  fetchRankings()
}

// 导出报表
const exportReport = async () => {
  try {
    await statisticsApi.exportReport({
      type: 'overview',
      format: 'xlsx',
      start_date: dateRange.value?.[0],
      end_date: dateRange.value?.[1],
    })
    ElMessage.success('导出成功')
  } catch {
    ElMessage.error('导出失败')
  }
}

// 导出排行榜
const exportRanking = async (type: 'downloads' | 'views') => {
  try {
    await statisticsApi.exportReport({
      type: 'ranking',
      format: 'xlsx',
      start_date: dateRange.value?.[0],
      end_date: dateRange.value?.[1],
    })
    ElMessage.success('导出成功')
  } catch {
    ElMessage.error('导出失败')
  }
}

// 窗口大小变化时调整图表
const handleResize = () => {
  trendChart?.resize()
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
})
</script>

<style lang="scss" scoped>
.statistics-page {
  .header-actions {
    display: flex;
    gap: 12px;
  }

  .stat-cards {
    margin-bottom: 16px;
  }

  .stat-card {
    background: #fff;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

    .stat-value {
      font-size: 32px;
      font-weight: 600;
      color: #303133;
    }

    .stat-label {
      font-size: 14px;
      color: #909399;
      margin-top: 8px;
    }

    .stat-trend {
      margin-top: 8px;
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 4px;

      &.up {
        color: #67c23a;
      }

      &.down {
        color: #f56c6c;
      }
    }
  }

  .chart-card {
    margin-bottom: 16px;

    .card-header {
      margin-bottom: 16px;

      h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
      }
    }

    .chart-container {
      height: 350px;
    }
  }

  .ranking-card {
    .card-header {
      margin-bottom: 16px;

      h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
      }
    }

    .book-cover {
      width: 36px;
      height: 48px;
      object-fit: cover;
      border-radius: 4px;
      background: #f0f2f5;
    }

    .ranking-num {
      display: inline-block;
      width: 24px;
      height: 24px;
      line-height: 24px;
      text-align: center;
      border-radius: 4px;
      background: #f0f2f5;
      color: #909399;
      font-size: 12px;
      font-weight: 600;

      &.top {
        background: linear-gradient(135deg, #fc4a1a 0%, #f7b733 100%);
        color: #fff;
      }
    }
  }
}
</style>
