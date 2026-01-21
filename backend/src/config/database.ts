import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { config } from './index.js';
import { logger } from '../utils/logger.js';

// 确保数据目录存在
const dbPath = path.resolve(config.databaseUrl);
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// 创建数据库连接
export const db = new Database(dbPath);

// 启用 WAL 模式提高性能
db.pragma('journal_mode = WAL');

// 初始化数据库表
export function initDatabase(): void {
  logger.info('Initializing database...');

  // 管理员表
  db.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      nickname TEXT DEFAULT '',
      avatar TEXT DEFAULT '',
      role TEXT DEFAULT 'editor' CHECK(role IN ('super_admin', 'editor')),
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'disabled')),
      last_login_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // 电子书表
  db.exec(`
    CREATE TABLE IF NOT EXISTS books (
      book_id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      author TEXT DEFAULT '',
      publisher TEXT DEFAULT '',
      publish_date TEXT DEFAULT '',
      isbn TEXT DEFAULT '',
      language TEXT DEFAULT 'zh-CN',
      format TEXT NOT NULL,
      description TEXT DEFAULT '',
      keywords TEXT DEFAULT '[]',
      file_path TEXT NOT NULL,
      file_size INTEGER DEFAULT 0,
      cover_path TEXT DEFAULT '',
      status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'published', 'archived')),
      view_count INTEGER DEFAULT 0,
      download_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // 分类表
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      parent_id TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
    )
  `);

  // 标签表
  db.exec(`
    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      color TEXT DEFAULT '#409eff',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // 书籍-分类关联表
  db.exec(`
    CREATE TABLE IF NOT EXISTS book_categories (
      book_id TEXT NOT NULL,
      category_id TEXT NOT NULL,
      PRIMARY KEY (book_id, category_id),
      FOREIGN KEY (book_id) REFERENCES books(book_id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    )
  `);

  // 书籍-标签关联表
  db.exec(`
    CREATE TABLE IF NOT EXISTS book_tags (
      book_id TEXT NOT NULL,
      tag_id TEXT NOT NULL,
      PRIMARY KEY (book_id, tag_id),
      FOREIGN KEY (book_id) REFERENCES books(book_id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    )
  `);

  // 浏览日志表
  db.exec(`
    CREATE TABLE IF NOT EXISTS view_logs (
      id TEXT PRIMARY KEY,
      book_id TEXT NOT NULL,
      ip TEXT DEFAULT '',
      user_agent TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (book_id) REFERENCES books(book_id) ON DELETE CASCADE
    )
  `);

  // 下载日志表
  db.exec(`
    CREATE TABLE IF NOT EXISTS download_logs (
      id TEXT PRIMARY KEY,
      book_id TEXT NOT NULL,
      ip TEXT DEFAULT '',
      user_agent TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (book_id) REFERENCES books(book_id) ON DELETE CASCADE
    )
  `);

  // 创建索引
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_books_status ON books(status);
    CREATE INDEX IF NOT EXISTS idx_books_title ON books(title);
    CREATE INDEX IF NOT EXISTS idx_books_author ON books(author);
    CREATE INDEX IF NOT EXISTS idx_books_created_at ON books(created_at);
    CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
    CREATE INDEX IF NOT EXISTS idx_view_logs_book_id ON view_logs(book_id);
    CREATE INDEX IF NOT EXISTS idx_view_logs_created_at ON view_logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_download_logs_book_id ON download_logs(book_id);
    CREATE INDEX IF NOT EXISTS idx_download_logs_created_at ON download_logs(created_at);
  `);

  logger.info('Database initialized successfully');
}

// 关闭数据库连接
export function closeDatabase(): void {
  db.close();
  logger.info('Database connection closed');
}
