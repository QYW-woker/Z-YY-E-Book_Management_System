import { db } from '../config/database.js';
import dayjs from 'dayjs';
import type { StatisticsOverview, TrendData, RankingItem } from '../types/index.js';

export const statisticsService = {
  // 获取统计概览
  getOverview(): StatisticsOverview {
    const today = dayjs().format('YYYY-MM-DD');

    const totalBooks = (db.prepare('SELECT COUNT(*) as count FROM books').get() as any).count;
    const publishedBooks = (db.prepare("SELECT COUNT(*) as count FROM books WHERE status = 'published'").get() as any).count;
    const draftBooks = (db.prepare("SELECT COUNT(*) as count FROM books WHERE status = 'draft'").get() as any).count;
    const archivedBooks = (db.prepare("SELECT COUNT(*) as count FROM books WHERE status = 'archived'").get() as any).count;
    const totalCategories = (db.prepare('SELECT COUNT(*) as count FROM categories').get() as any).count;
    const totalTags = (db.prepare('SELECT COUNT(*) as count FROM tags').get() as any).count;

    const todayDownloads = (db.prepare("SELECT COUNT(*) as count FROM download_logs WHERE date(created_at) = ?").get(today) as any).count;
    const todayViews = (db.prepare("SELECT COUNT(*) as count FROM view_logs WHERE date(created_at) = ?").get(today) as any).count;

    const totalDownloads = (db.prepare('SELECT SUM(download_count) as count FROM books').get() as any).count || 0;
    const totalViews = (db.prepare('SELECT SUM(view_count) as count FROM books').get() as any).count || 0;

    return {
      total_books: totalBooks,
      published_books: publishedBooks,
      draft_books: draftBooks,
      archived_books: archivedBooks,
      total_categories: totalCategories,
      total_tags: totalTags,
      today_downloads: todayDownloads,
      today_views: todayViews,
      total_downloads: totalDownloads,
      total_views: totalViews,
    };
  },

  // 获取趋势数据
  getTrends(type: 'daily' | 'weekly' | 'monthly', startDate?: string, endDate?: string): TrendData[] {
    const end = endDate ? dayjs(endDate) : dayjs();
    let start: dayjs.Dayjs;
    let format: string;
    let groupFormat: string;

    switch (type) {
      case 'daily':
        start = startDate ? dayjs(startDate) : end.subtract(30, 'day');
        format = 'YYYY-MM-DD';
        groupFormat = '%Y-%m-%d';
        break;
      case 'weekly':
        start = startDate ? dayjs(startDate) : end.subtract(12, 'week');
        format = 'YYYY-[W]WW';
        groupFormat = '%Y-%W';
        break;
      case 'monthly':
        start = startDate ? dayjs(startDate) : end.subtract(6, 'month');
        format = 'YYYY-MM';
        groupFormat = '%Y-%m';
        break;
    }

    const downloadTrends = db.prepare(`
      SELECT strftime('${groupFormat}', created_at) as date, COUNT(*) as count
      FROM download_logs
      WHERE created_at >= ? AND created_at <= ?
      GROUP BY strftime('${groupFormat}', created_at)
      ORDER BY date ASC
    `).all(start.format('YYYY-MM-DD'), end.format('YYYY-MM-DD') + ' 23:59:59') as { date: string; count: number }[];

    const viewTrends = db.prepare(`
      SELECT strftime('${groupFormat}', created_at) as date, COUNT(*) as count
      FROM view_logs
      WHERE created_at >= ? AND created_at <= ?
      GROUP BY strftime('${groupFormat}', created_at)
      ORDER BY date ASC
    `).all(start.format('YYYY-MM-DD'), end.format('YYYY-MM-DD') + ' 23:59:59') as { date: string; count: number }[];

    const downloadMap = new Map(downloadTrends.map((d) => [d.date, d.count]));
    const viewMap = new Map(viewTrends.map((v) => [v.date, v.count]));

    const results: TrendData[] = [];
    let current = start;
    while (current.isBefore(end) || current.isSame(end, 'day')) {
      const dateKey = current.format(groupFormat.replace(/%/g, '').replace('Y', 'YYYY').replace('m', 'MM').replace('d', 'DD').replace('W', 'WW'));
      results.push({
        date: current.format(format),
        downloads: downloadMap.get(dateKey) || 0,
        views: viewMap.get(dateKey) || 0,
      });

      switch (type) {
        case 'daily':
          current = current.add(1, 'day');
          break;
        case 'weekly':
          current = current.add(1, 'week');
          break;
        case 'monthly':
          current = current.add(1, 'month');
          break;
      }
    }

    return results;
  },

  // 获取下载排行榜
  getDownloadRanking(limit = 50, startDate?: string, endDate?: string): RankingItem[] {
    let sql = `
      SELECT b.book_id, b.title, b.author, b.cover_path, b.download_count as count
      FROM books b
    `;

    const params: any[] = [];
    if (startDate && endDate) {
      sql = `
        SELECT b.book_id, b.title, b.author, b.cover_path, COUNT(dl.id) as count
        FROM books b
        INNER JOIN download_logs dl ON dl.book_id = b.book_id
        WHERE dl.created_at >= ? AND dl.created_at <= ?
        GROUP BY b.book_id
      `;
      params.push(startDate, endDate + ' 23:59:59');
    }

    sql += ' ORDER BY count DESC LIMIT ?';
    params.push(limit);

    return db.prepare(sql).all(...params) as RankingItem[];
  },

  // 获取浏览排行榜
  getViewRanking(limit = 50, startDate?: string, endDate?: string): RankingItem[] {
    let sql = `
      SELECT b.book_id, b.title, b.author, b.cover_path, b.view_count as count
      FROM books b
    `;

    const params: any[] = [];
    if (startDate && endDate) {
      sql = `
        SELECT b.book_id, b.title, b.author, b.cover_path, COUNT(vl.id) as count
        FROM books b
        INNER JOIN view_logs vl ON vl.book_id = b.book_id
        WHERE vl.created_at >= ? AND vl.created_at <= ?
        GROUP BY b.book_id
      `;
      params.push(startDate, endDate + ' 23:59:59');
    }

    sql += ' ORDER BY count DESC LIMIT ?';
    params.push(limit);

    return db.prepare(sql).all(...params) as RankingItem[];
  },
};
