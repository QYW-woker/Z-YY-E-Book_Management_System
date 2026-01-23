import type { Request, Response } from 'express';
import { statisticsService } from '../services/statisticsService.js';
import { success, error } from '../utils/response.js';

export const statisticsController = {
  // 获取统计概览
  getOverview(_req: Request, res: Response): void {
    const overview = statisticsService.getOverview();
    success(res, overview);
  },

  // 获取趋势数据
  getTrends(req: Request, res: Response): void {
    const { type = 'daily', start_date, end_date } = req.query;

    if (!['daily', 'weekly', 'monthly'].includes(type as string)) {
      error(res, '无效的趋势类型');
      return;
    }

    const trends = statisticsService.getTrends(
      type as 'daily' | 'weekly' | 'monthly',
      start_date as string,
      end_date as string
    );
    success(res, trends);
  },

  // 获取下载排行榜
  getDownloadRanking(req: Request, res: Response): void {
    const { limit = '50', start_date, end_date } = req.query;

    const ranking = statisticsService.getDownloadRanking(
      parseInt(limit as string, 10),
      start_date as string,
      end_date as string
    );
    success(res, ranking);
  },

  // 获取浏览排行榜
  getViewRanking(req: Request, res: Response): void {
    const { limit = '50', start_date, end_date } = req.query;

    const ranking = statisticsService.getViewRanking(
      parseInt(limit as string, 10),
      start_date as string,
      end_date as string
    );
    success(res, ranking);
  },

  // 导出报表
  exportReport(req: Request, res: Response): void {
    const { type, start_date, end_date } = req.body;

    try {
      let csvContent = '';
      let filename = '';

      if (type === 'overview') {
        // 导出概览数据
        const overview = statisticsService.getOverview();
        csvContent = '指标,数值\n';
        csvContent += `电子书总数,${overview.total_books}\n`;
        csvContent += `已上架,${overview.published_books}\n`;
        csvContent += `总浏览量,${overview.total_views}\n`;
        csvContent += `总下载量,${overview.total_downloads}\n`;
        csvContent += `今日浏览,${overview.today_views}\n`;
        csvContent += `今日下载,${overview.today_downloads}\n`;
        filename = `统计概览_${new Date().toISOString().slice(0, 10)}.csv`;
      } else if (type === 'ranking') {
        // 导出排行榜数据
        const downloadRanking = statisticsService.getDownloadRanking(50, start_date, end_date);
        const viewRanking = statisticsService.getViewRanking(50, start_date, end_date);

        csvContent = '下载排行榜\n';
        csvContent += '排名,书名,作者,下载量\n';
        downloadRanking.forEach((item, index) => {
          csvContent += `${index + 1},"${item.title || ''}","${item.author || ''}",${item.download_count || 0}\n`;
        });

        csvContent += '\n浏览排行榜\n';
        csvContent += '排名,书名,作者,浏览量\n';
        viewRanking.forEach((item, index) => {
          csvContent += `${index + 1},"${item.title || ''}","${item.author || ''}",${item.view_count || 0}\n`;
        });

        filename = `排行榜_${new Date().toISOString().slice(0, 10)}.csv`;
      } else {
        // 导出趋势数据
        const trends = statisticsService.getTrends('daily', start_date, end_date);
        csvContent = '日期,下载量,浏览量\n';
        trends.forEach((item) => {
          csvContent += `${item.date},${item.downloads},${item.views}\n`;
        });
        filename = `访问趋势_${new Date().toISOString().slice(0, 10)}.csv`;
      }

      // 添加 BOM 以支持中文
      const bom = '\uFEFF';
      const buffer = Buffer.from(bom + csvContent, 'utf-8');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
      res.send(buffer);
    } catch (err: any) {
      error(res, err.message || '导出失败');
    }
  },
};
