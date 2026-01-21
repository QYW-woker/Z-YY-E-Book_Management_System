import type { Request } from 'express';

// API响应格式
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

// 分页数据
export interface PaginatedData<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 电子书状态
export type BookStatus = 'draft' | 'published' | 'archived';

// 电子书
export interface Book {
  book_id: string;
  title: string;
  author: string;
  publisher: string;
  publish_date: string;
  isbn: string;
  language: string;
  format: string;
  description: string;
  keywords: string;
  file_path: string;
  file_size: number;
  cover_path: string;
  status: BookStatus;
  view_count: number;
  download_count: number;
  created_at: string;
  updated_at: string;
}

// 分类
export interface Category {
  id: string;
  name: string;
  parent_id: string | null;
  sort_order: number;
  book_count?: number;
  created_at: string;
  updated_at: string;
  children?: Category[];
}

// 标签
export interface Tag {
  id: string;
  name: string;
  color: string;
  book_count?: number;
  created_at: string;
  updated_at: string;
}

// 管理员
export interface Admin {
  id: string;
  username: string;
  password: string;
  nickname: string;
  avatar: string;
  role: 'super_admin' | 'editor';
  status: 'active' | 'disabled';
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

// JWT Payload
export interface JwtPayload {
  adminId: string;
  username: string;
  role: string;
}

// 扩展 Request 类型
export interface AuthRequest extends Request {
  admin?: {
    id: string;
    username: string;
    role: string;
  };
}

// 查询参数
export interface BookQueryParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  keyword?: string;
  status?: BookStatus;
  category_id?: string;
  tag_ids?: string[];
  language?: string;
  format?: string;
  date_start?: string;
  date_end?: string;
}

// 批量更新
export interface BatchUpdateData {
  book_ids: string[];
  updates: {
    status?: BookStatus;
    language?: string;
    publisher?: string;
    category_ids?: string[];
    tag_ids?: string[];
  };
}

// 导入结果
export interface ImportResult {
  success: number;
  failed: number;
  results: {
    filename: string;
    success: boolean;
    book_id?: string;
    error?: string;
  }[];
}

// 统计概览
export interface StatisticsOverview {
  total_books: number;
  published_books: number;
  draft_books: number;
  archived_books: number;
  total_categories: number;
  total_tags: number;
  today_downloads: number;
  today_views: number;
  total_downloads: number;
  total_views: number;
}

// 趋势数据
export interface TrendData {
  date: string;
  downloads: number;
  views: number;
}

// 排行榜项
export interface RankingItem {
  book_id: string;
  title: string;
  author: string;
  cover_path: string;
  count: number;
}
