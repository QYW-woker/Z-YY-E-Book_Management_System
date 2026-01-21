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
    // 简化实现
    error(res, '导出功能正在开发中');
  },
};
