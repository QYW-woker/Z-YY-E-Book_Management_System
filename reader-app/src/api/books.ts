import { http } from '@/utils/request';
import type { Book, Category, Tag, PaginatedData, SearchParams, HotKeyword, DownloadInfo } from '@/types';

export const booksApi = {
  // 获取书籍列表
  getBooks(params?: SearchParams): Promise<PaginatedData<Book>> {
    return http.get('/books', { params });
  },

  // 搜索书籍
  searchBooks(params?: SearchParams): Promise<PaginatedData<Book>> {
    return http.get('/books/search', { params });
  },

  // 获取书籍详情
  getBookDetail(id: string): Promise<Book> {
    return http.get(`/books/${id}`);
  },

  // 获取热门书籍
  getHotBooks(limit?: number): Promise<Book[]> {
    return http.get('/books/hot', { params: { limit } });
  },

  // 获取最新书籍
  getNewestBooks(limit?: number): Promise<Book[]> {
    return http.get('/books/newest', { params: { limit } });
  },

  // 获取推荐书籍
  getRecommendedBooks(limit?: number): Promise<Book[]> {
    return http.get('/books/recommended', { params: { limit } });
  },

  // 获取相关书籍
  getRelatedBooks(id: string, limit?: number): Promise<Book[]> {
    return http.get(`/books/${id}/related`, { params: { limit } });
  },

  // 获取下载链接
  getDownloadUrl(id: string): Promise<DownloadInfo> {
    return http.get(`/books/${id}/download`);
  },

  // 获取热门搜索词
  getHotKeywords(limit?: number): Promise<HotKeyword[]> {
    return http.get('/books/hot-keywords', { params: { limit } });
  },

  // 获取分类列表
  getCategories(): Promise<Category[]> {
    return http.get('/categories');
  },

  // 获取分类下的书籍
  getCategoryBooks(id: string, page?: number, pageSize?: number): Promise<PaginatedData<Book>> {
    return http.get(`/categories/${id}/books`, { params: { page, page_size: pageSize } });
  },

  // 获取标签列表
  getTags(): Promise<Tag[]> {
    return http.get('/tags');
  },
};
