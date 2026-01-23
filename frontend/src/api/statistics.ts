import { request } from '@/utils/request'
import instance from '@/utils/request'
import type { StatisticsOverview, TrendData, RankingItem } from '@/types'

export const statisticsApi = {
  /**
   * 获取统计概览
   */
  getOverview(): Promise<StatisticsOverview> {
    return request.get('/admin/statistics/overview')
  },

  /**
   * 获取趋势数据
   */
  getTrends(params: { type: 'daily' | 'weekly' | 'monthly'; start_date?: string; end_date?: string }): Promise<TrendData[]> {
    return request.get('/admin/statistics/trends', { params })
  },

  /**
   * 获取下载排行榜
   */
  getDownloadRanking(params?: { limit?: number; start_date?: string; end_date?: string }): Promise<RankingItem[]> {
    return request.get('/admin/statistics/ranking/downloads', { params })
  },

  /**
   * 获取浏览排行榜
   */
  getViewRanking(params?: { limit?: number; start_date?: string; end_date?: string }): Promise<RankingItem[]> {
    return request.get('/admin/statistics/ranking/views', { params })
  },

  /**
   * 导出统计报表
   */
  async exportReport(params: { type: 'overview' | 'trends' | 'ranking'; format: 'csv' | 'xlsx'; start_date?: string; end_date?: string }): Promise<void> {
    const response = await instance.post('/admin/statistics/export', params, { responseType: 'blob' })

    // 从响应头获取文件名
    const contentDisposition = response.headers?.['content-disposition']
    let filename = '统计报表.csv'
    if (contentDisposition) {
      const match = contentDisposition.match(/filename\*?=['"]?(?:UTF-8'')?([^'";]+)['"]?/i)
      if (match) {
        filename = decodeURIComponent(match[1])
      }
    }

    // 触发下载
    const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(link.href)
  },
}
