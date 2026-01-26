import { http } from '@/utils/request';
import type { PaginatedData, ViewHistory, DownloadRecord, Favorite, ReadingProgress } from '@/types';

export const userApi = {
  // 获取浏览历史
  getViewHistory(page?: number, pageSize?: number): Promise<PaginatedData<ViewHistory>> {
    return http.get('/user/view-history', { params: { page, page_size: pageSize } });
  },

  // 记录浏览
  addViewLog(bookId: string, duration?: number): Promise<void> {
    return http.post('/user/view-log', { book_id: bookId, duration });
  },

  // 清除浏览历史
  clearViewHistory(): Promise<void> {
    return http.delete('/user/view-history');
  },

  // 获取下载记录
  getDownloadHistory(page?: number, pageSize?: number): Promise<PaginatedData<DownloadRecord>> {
    return http.get('/user/download-history', { params: { page, page_size: pageSize } });
  },

  // 获取收藏列表
  getFavorites(page?: number, pageSize?: number): Promise<PaginatedData<Favorite>> {
    return http.get('/user/favorites', { params: { page, page_size: pageSize } });
  },

  // 添加收藏
  addFavorite(bookId: string): Promise<void> {
    return http.post('/user/favorites', { book_id: bookId });
  },

  // 取消收藏
  removeFavorite(bookId: string): Promise<void> {
    return http.delete(`/user/favorites/${bookId}`);
  },

  // 检查是否已收藏
  checkFavorite(bookId: string): Promise<{ is_favorited: boolean }> {
    return http.get(`/user/favorites/${bookId}/check`);
  },

  // 获取阅读进度
  getReadingProgress(bookId: string): Promise<ReadingProgress> {
    return http.get(`/user/reading-progress/${bookId}`);
  },

  // 保存阅读进度
  saveReadingProgress(bookId: string, data: { progress: number; current_page: number; total_pages: number }): Promise<void> {
    return http.post(`/user/reading-progress/${bookId}`, data);
  },
};
