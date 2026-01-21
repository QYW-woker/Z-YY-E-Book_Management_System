// API响应格式
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

// 分页请求
export interface PaginationQuery {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// 分页响应
export interface PaginatedData<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 电子书元数据
export interface BookMetadata {
  book_id: string;
  title: string;
  author: string;
  publisher: string;
  publish_date: string;
  isbn: string;
  language: string;
  format: string;
  description: string;
  keywords: string[];
  file_path: string;
  file_size: number;
  cover_path: string;
  status: BookStatus;
  category_ids: string[];
  tag_ids: string[];
  view_count: number;
  download_count: number;
  created_at: string;
  updated_at: string;
  // 关联数据
  categories?: Category[];
  tags?: Tag[];
}

export type BookStatus = 'draft' | 'published' | 'archived';

// 分类
export interface Category {
  id: string;
  name: string;
  parent_id: string | null;
  sort_order: number;
  book_count: number;
  children?: Category[];
  created_at: string;
  updated_at: string;
}

// 标签
export interface Tag {
  id: string;
  name: string;
  color: string;
  book_count: number;
  created_at: string;
  updated_at: string;
}

// 管理员
export interface Admin {
  id: string;
  username: string;
  nickname: string;
  avatar: string;
  role: 'super_admin' | 'editor';
  status: 'active' | 'disabled';
  last_login_at: string;
  created_at: string;
}

// 登录请求/响应
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refresh_token: string;
  expires_in: number;
  admin: Admin;
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

// 统计趋势
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

// 书籍筛选条件
export interface BookFilter {
  keyword?: string;
  status?: BookStatus;
  category_id?: string;
  tag_ids?: string[];
  language?: string;
  format?: string;
  date_start?: string;
  date_end?: string;
}

// 批量更新请求
export interface BatchUpdateRequest {
  book_ids: string[];
  updates: Partial<Pick<BookMetadata, 'status' | 'language' | 'publisher' | 'category_ids' | 'tag_ids'>>;
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

// 上传进度
export interface UploadProgress {
  filename: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

// 日志
export interface ViewLog {
  id: string;
  book_id: string;
  ip: string;
  user_agent: string;
  created_at: string;
}

export interface DownloadLog {
  id: string;
  book_id: string;
  ip: string;
  user_agent: string;
  created_at: string;
}

// 表格列配置
export interface ColumnConfig {
  key: string;
  label: string;
  visible: boolean;
  width?: number;
  sortable?: boolean;
}
