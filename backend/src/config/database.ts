import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
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

let sqlDb: SqlJsDatabase | null = null;

// 保存数据库到文件
function saveDatabase(): void {
  if (sqlDb) {
    try {
      const data = sqlDb.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(dbPath, buffer);
    } catch (err) {
      logger.error('Failed to save database', err);
    }
  }
}

// 数据库包装对象 - 提供类似 better-sqlite3 的 API
export const db = {
  prepare(sql: string) {
    return {
      run(...params: any[]) {
        if (!sqlDb) throw new Error('Database not initialized');
        try {
          sqlDb.run(sql, params);
          saveDatabase();
          return { changes: sqlDb.getRowsModified() };
        } catch (err) {
          logger.error(`SQL Error: ${sql}`, err);
          throw err;
        }
      },
      get(...params: any[]): any {
        if (!sqlDb) throw new Error('Database not initialized');
        try {
          const stmt = sqlDb.prepare(sql);
          stmt.bind(params);
          if (stmt.step()) {
            const row = stmt.getAsObject();
            stmt.free();
            return row;
          }
          stmt.free();
          return undefined;
        } catch (err) {
          logger.error(`SQL Error: ${sql}`, err);
          throw err;
        }
      },
      all(...params: any[]): any[] {
        if (!sqlDb) throw new Error('Database not initialized');
        try {
          const results: any[] = [];
          const stmt = sqlDb.prepare(sql);
          stmt.bind(params);
          while (stmt.step()) {
            results.push(stmt.getAsObject());
          }
          stmt.free();
          return results;
        } catch (err) {
          logger.error(`SQL Error: ${sql}`, err);
          throw err;
        }
      },
    };
  },
  exec(sql: string): void {
    if (!sqlDb) throw new Error('Database not initialized');
    try {
      sqlDb.exec(sql);
      saveDatabase();
    } catch (err) {
      logger.error(`SQL Exec Error`, err);
      throw err;
    }
  },
  transaction<T>(fn: () => T): () => T {
    return () => {
      if (!sqlDb) throw new Error('Database not initialized');
      sqlDb.exec('BEGIN TRANSACTION');
      try {
        const result = fn();
        sqlDb.exec('COMMIT');
        saveDatabase();
        return result;
      } catch (err) {
        sqlDb.exec('ROLLBACK');
        throw err;
      }
    };
  },
};

// 初始化数据库
export async function initDatabase(): Promise<void> {
  logger.info('Initializing database...');

  try {
    const SQL = await initSqlJs();

    // 如果数据库文件存在，加载它
    if (fs.existsSync(dbPath)) {
      const fileBuffer = fs.readFileSync(dbPath);
      sqlDb = new SQL.Database(fileBuffer);
      logger.info(`Database loaded from ${dbPath}`);
    } else {
      sqlDb = new SQL.Database();
      logger.info('New database created');
    }

    // 创建表
    createTables();

    logger.info('Database initialized successfully');
  } catch (err) {
    logger.error('Failed to initialize database', err);
    throw err;
  }
}

// 创建数据库表
function createTables(): void {
  if (!sqlDb) return;

  // 管理员表
  sqlDb.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      nickname TEXT DEFAULT '',
      avatar TEXT DEFAULT '',
      role TEXT DEFAULT 'editor',
      status TEXT DEFAULT 'active',
      last_login_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // 电子书表
  sqlDb.exec(`
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
      status TEXT DEFAULT 'draft',
      view_count INTEGER DEFAULT 0,
      download_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // 分类表
  sqlDb.exec(`
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
  sqlDb.exec(`
    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      color TEXT DEFAULT '#409eff',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // 书籍-分类关联表
  sqlDb.exec(`
    CREATE TABLE IF NOT EXISTS book_categories (
      book_id TEXT NOT NULL,
      category_id TEXT NOT NULL,
      PRIMARY KEY (book_id, category_id),
      FOREIGN KEY (book_id) REFERENCES books(book_id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    )
  `);

  // 书籍-标签关联表
  sqlDb.exec(`
    CREATE TABLE IF NOT EXISTS book_tags (
      book_id TEXT NOT NULL,
      tag_id TEXT NOT NULL,
      PRIMARY KEY (book_id, tag_id),
      FOREIGN KEY (book_id) REFERENCES books(book_id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    )
  `);

  // 浏览日志表
  sqlDb.exec(`
    CREATE TABLE IF NOT EXISTS view_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      book_id TEXT NOT NULL,
      ip TEXT DEFAULT '',
      user_agent TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (book_id) REFERENCES books(book_id) ON DELETE CASCADE
    )
  `);

  // 下载日志表
  sqlDb.exec(`
    CREATE TABLE IF NOT EXISTS download_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      book_id TEXT NOT NULL,
      ip TEXT DEFAULT '',
      user_agent TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (book_id) REFERENCES books(book_id) ON DELETE CASCADE
    )
  `);

  // ==================== 读者端相关表 ====================

  // 读者用户表
  sqlDb.exec(`
    CREATE TABLE IF NOT EXISTS users (
      user_id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE,
      phone TEXT UNIQUE,
      password TEXT NOT NULL,
      nickname TEXT DEFAULT '',
      avatar TEXT DEFAULT '',
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      last_login_at TEXT
    )
  `);

  // 用户浏览历史表
  sqlDb.exec(`
    CREATE TABLE IF NOT EXISTS user_view_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      book_id TEXT NOT NULL,
      view_time TEXT DEFAULT (datetime('now')),
      duration INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
      FOREIGN KEY (book_id) REFERENCES books(book_id) ON DELETE CASCADE
    )
  `);

  // 用户下载记录表
  sqlDb.exec(`
    CREATE TABLE IF NOT EXISTS user_downloads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      book_id TEXT NOT NULL,
      download_time TEXT DEFAULT (datetime('now')),
      ip TEXT DEFAULT '',
      user_agent TEXT DEFAULT '',
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
      FOREIGN KEY (book_id) REFERENCES books(book_id) ON DELETE CASCADE
    )
  `);

  // 用户收藏表
  sqlDb.exec(`
    CREATE TABLE IF NOT EXISTS user_favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      book_id TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, book_id),
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
      FOREIGN KEY (book_id) REFERENCES books(book_id) ON DELETE CASCADE
    )
  `);

  // 搜索日志表（用于热门搜索）
  sqlDb.exec(`
    CREATE TABLE IF NOT EXISTS search_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      keyword TEXT NOT NULL,
      results_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
    )
  `);

  // 阅读进度表
  sqlDb.exec(`
    CREATE TABLE IF NOT EXISTS reading_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      book_id TEXT NOT NULL,
      progress REAL DEFAULT 0,
      current_page INTEGER DEFAULT 0,
      total_pages INTEGER DEFAULT 0,
      last_read_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, book_id),
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
      FOREIGN KEY (book_id) REFERENCES books(book_id) ON DELETE CASCADE
    )
  `);

  // 创建索引
  sqlDb.exec(`
    CREATE INDEX IF NOT EXISTS idx_books_status ON books(status);
    CREATE INDEX IF NOT EXISTS idx_books_title ON books(title);
    CREATE INDEX IF NOT EXISTS idx_books_author ON books(author);
    CREATE INDEX IF NOT EXISTS idx_books_created_at ON books(created_at);
    CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
    CREATE INDEX IF NOT EXISTS idx_view_logs_book_id ON view_logs(book_id);
    CREATE INDEX IF NOT EXISTS idx_view_logs_created_at ON view_logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_download_logs_book_id ON download_logs(book_id);
    CREATE INDEX IF NOT EXISTS idx_download_logs_created_at ON download_logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_user_view_history_user_id ON user_view_history(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_view_history_book_id ON user_view_history(book_id);
    CREATE INDEX IF NOT EXISTS idx_user_downloads_user_id ON user_downloads(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
    CREATE INDEX IF NOT EXISTS idx_search_logs_keyword ON search_logs(keyword);
    CREATE INDEX IF NOT EXISTS idx_reading_progress_user_id ON reading_progress(user_id);
  `);

  saveDatabase();
}

// 关闭数据库连接
export function closeDatabase(): void {
  if (sqlDb) {
    saveDatabase();
    sqlDb.close();
    sqlDb = null;
    logger.info('Database connection closed');
  }
}
