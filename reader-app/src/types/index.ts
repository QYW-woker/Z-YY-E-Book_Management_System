// API 响应格式
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

// 用户信息
export interface User {
  user_id: string;
  username: string;
  nickname: string;
  email: string | null;
  phone: string | null;
  avatar: string;
  created_at: string;
  last_login_at: string | null;
}

// 登录响应
export interface LoginResponse {
  token: string;
  refresh_token: string;
  expires_in: number;
  user: User;
}

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
  keywords: string[];
  file_path: string;
  file_size: number;
  cover_path: string;
  status: string;
  view_count: number;
  download_count: number;
  created_at: string;
  updated_at: string;
  categories?: Category[];
  tags?: Tag[];
  is_favorited?: boolean;
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

// 搜索参数
export interface SearchParams {
  keyword?: string;
  title?: string;
  author?: string;
  isbn?: string;
  category_id?: string;
  language?: string;
  format?: string;
  publish_date_start?: string;
  publish_date_end?: string;
  sort_by?: 'relevance' | 'newest' | 'popular' | 'title';
  page?: number;
  page_size?: number;
}

// 热门搜索词
export interface HotKeyword {
  keyword: string;
  count: number;
}

// 浏览历史
export interface ViewHistory {
  id: number;
  user_id: string;
  book_id: string;
  view_time: string;
  duration: number;
  title: string;
  author: string;
  cover_path: string;
  format: string;
}

// 下载记录
export interface DownloadRecord {
  id: number;
  user_id: string;
  book_id: string;
  download_time: string;
  title: string;
  author: string;
  cover_path: string;
  format: string;
  file_size: number;
}

// 收藏
export interface Favorite {
  id: number;
  user_id: string;
  book_id: string;
  created_at: string;
  title: string;
  author: string;
  cover_path: string;
  format: string;
  description: string;
}

// 阅读进度
export interface ReadingProgress {
  progress: number;
  current_page: number;
  total_pages: number;
  last_read_at?: string;
}

// 下载信息
export interface DownloadInfo {
  download_url: string;
  filename: string;
  file_size: number;
  format: string;
}
