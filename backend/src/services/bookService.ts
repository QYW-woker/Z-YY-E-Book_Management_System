import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { db } from '../config/database.js';
import { config } from '../config/index.js';
import type { Book, BookQueryParams, BookStatus, PaginatedData } from '../types/index.js';

export const bookService = {
  // 获取书籍列表
  getList(params: BookQueryParams): PaginatedData<Book & { categories?: any[]; tags?: any[] }> {
    const {
      page = 1,
      pageSize = 20,
      sortBy = 'created_at',
      sortOrder = 'desc',
      keyword,
      status,
      category_id,
      tag_ids,
      language,
      format,
      date_start,
      date_end,
    } = params;

    let whereClause = '1=1';
    const whereParams: any[] = [];

    if (keyword) {
      whereClause += ' AND (b.title LIKE ? OR b.author LIKE ? OR b.isbn LIKE ?)';
      const kw = `%${keyword}%`;
      whereParams.push(kw, kw, kw);
    }

    if (status) {
      whereClause += ' AND b.status = ?';
      whereParams.push(status);
    }

    if (language) {
      whereClause += ' AND b.language = ?';
      whereParams.push(language);
    }

    if (format) {
      whereClause += ' AND b.format = ?';
      whereParams.push(format);
    }

    if (date_start) {
      whereClause += ' AND b.created_at >= ?';
      whereParams.push(date_start);
    }

    if (date_end) {
      whereClause += ' AND b.created_at <= ?';
      whereParams.push(date_end + ' 23:59:59');
    }

    if (category_id) {
      whereClause += ' AND EXISTS (SELECT 1 FROM book_categories bc WHERE bc.book_id = b.book_id AND bc.category_id = ?)';
      whereParams.push(category_id);
    }

    if (tag_ids && tag_ids.length > 0) {
      whereClause += ` AND EXISTS (SELECT 1 FROM book_tags bt WHERE bt.book_id = b.book_id AND bt.tag_id IN (${tag_ids.map(() => '?').join(',')}))`;
      whereParams.push(...tag_ids);
    }

    // 统计总数
    const countSql = `SELECT COUNT(*) as total FROM books b WHERE ${whereClause}`;
    const { total } = db.prepare(countSql).get(...whereParams) as { total: number };

    // 查询列表
    const offset = (page - 1) * pageSize;
    const allowedSortFields = ['created_at', 'updated_at', 'title', 'author', 'file_size', 'view_count', 'download_count'];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const safeSortOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';

    const listSql = `
      SELECT b.* FROM books b
      WHERE ${whereClause}
      ORDER BY b.${safeSortBy} ${safeSortOrder}
      LIMIT ? OFFSET ?
    `;

    const list = db.prepare(listSql).all(...whereParams, pageSize, offset) as Book[];

    // 获取关联的分类和标签
    const listWithRelations = list.map((book) => {
      const categories = db.prepare(`
        SELECT c.* FROM categories c
        INNER JOIN book_categories bc ON bc.category_id = c.id
        WHERE bc.book_id = ?
      `).all(book.book_id);

      const tags = db.prepare(`
        SELECT t.* FROM tags t
        INNER JOIN book_tags bt ON bt.tag_id = t.id
        WHERE bt.book_id = ?
      `).all(book.book_id);

      return {
        ...book,
        keywords: JSON.parse(book.keywords || '[]'),
        categories,
        tags,
      };
    });

    return {
      list: listWithRelations,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  },

  // 获取单个书籍
  getById(bookId: string): (Book & { categories?: any[]; tags?: any[] }) | undefined {
    const book = db.prepare('SELECT * FROM books WHERE book_id = ?').get(bookId) as Book | undefined;
    if (!book) return undefined;

    const categories = db.prepare(`
      SELECT c.* FROM categories c
      INNER JOIN book_categories bc ON bc.category_id = c.id
      WHERE bc.book_id = ?
    `).all(bookId);

    const tags = db.prepare(`
      SELECT t.* FROM tags t
      INNER JOIN book_tags bt ON bt.tag_id = t.id
      WHERE bt.book_id = ?
    `).all(bookId);

    return {
      ...book,
      keywords: JSON.parse(book.keywords || '[]'),
      category_ids: categories.map((c: any) => c.id),
      tag_ids: tags.map((t: any) => t.id),
      categories,
      tags,
    };
  },

  // 创建书籍
  create(data: Partial<Book> & { category_ids?: string[]; tag_ids?: string[] }): Book {
    const bookId = uuidv4();

    db.prepare(`
      INSERT INTO books (book_id, title, author, publisher, publish_date, isbn, language, format, description, keywords, file_path, file_size, cover_path, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      bookId,
      data.title || '',
      data.author || '',
      data.publisher || '',
      data.publish_date || '',
      data.isbn || '',
      data.language || 'zh-CN',
      data.format || '',
      data.description || '',
      JSON.stringify(data.keywords || []),
      data.file_path || '',
      data.file_size || 0,
      data.cover_path || '',
      data.status || 'draft'
    );

    // 关联分类
    if (data.category_ids && data.category_ids.length > 0) {
      const insertCategory = db.prepare('INSERT INTO book_categories (book_id, category_id) VALUES (?, ?)');
      data.category_ids.forEach((categoryId) => {
        insertCategory.run(bookId, categoryId);
      });
    }

    // 关联标签
    if (data.tag_ids && data.tag_ids.length > 0) {
      const insertTag = db.prepare('INSERT INTO book_tags (book_id, tag_id) VALUES (?, ?)');
      data.tag_ids.forEach((tagId) => {
        insertTag.run(bookId, tagId);
      });
    }

    return this.getById(bookId)!;
  },

  // 更新书籍
  update(bookId: string, data: Partial<Book> & { category_ids?: string[]; tag_ids?: string[] }): Book {
    const updates: string[] = [];
    const values: any[] = [];

    const fields = ['title', 'author', 'publisher', 'publish_date', 'isbn', 'language', 'description', 'cover_path', 'status'];
    fields.forEach((field) => {
      if ((data as any)[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push((data as any)[field]);
      }
    });

    if (data.keywords !== undefined) {
      updates.push('keywords = ?');
      values.push(JSON.stringify(data.keywords));
    }

    if (updates.length > 0) {
      updates.push("updated_at = datetime('now')");
      values.push(bookId);
      db.prepare(`UPDATE books SET ${updates.join(', ')} WHERE book_id = ?`).run(...values);
    }

    // 更新分类关联
    if (data.category_ids !== undefined) {
      db.prepare('DELETE FROM book_categories WHERE book_id = ?').run(bookId);
      const insertCategory = db.prepare('INSERT INTO book_categories (book_id, category_id) VALUES (?, ?)');
      data.category_ids.forEach((categoryId) => {
        insertCategory.run(bookId, categoryId);
      });
    }

    // 更新标签关联
    if (data.tag_ids !== undefined) {
      db.prepare('DELETE FROM book_tags WHERE book_id = ?').run(bookId);
      const insertTag = db.prepare('INSERT INTO book_tags (book_id, tag_id) VALUES (?, ?)');
      data.tag_ids.forEach((tagId) => {
        insertTag.run(bookId, tagId);
      });
    }

    return this.getById(bookId)!;
  },

  // 删除书籍
  delete(bookId: string): void {
    const book = this.getById(bookId);
    if (book) {
      // 删除文件
      if (book.file_path) {
        const filePath = path.join(config.upload.dir, book.file_path);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      // 删除封面
      if (book.cover_path) {
        const coverPath = path.join(config.upload.dir, book.cover_path);
        if (fs.existsSync(coverPath)) {
          fs.unlinkSync(coverPath);
        }
      }
    }
    db.prepare('DELETE FROM books WHERE book_id = ?').run(bookId);
  },

  // 批量删除
  batchDelete(bookIds: string[]): void {
    bookIds.forEach((id) => this.delete(id));
  },

  // 批量更新
  batchUpdate(bookIds: string[], updates: Partial<Book> & { category_ids?: string[]; tag_ids?: string[] }): void {
    bookIds.forEach((id) => this.update(id, updates));
  },

  // 更新状态
  updateStatus(bookId: string, status: BookStatus): void {
    db.prepare("UPDATE books SET status = ?, updated_at = datetime('now') WHERE book_id = ?").run(status, bookId);
  },

  // 增加浏览量
  incrementViewCount(bookId: string): void {
    db.prepare('UPDATE books SET view_count = view_count + 1 WHERE book_id = ?').run(bookId);
  },

  // 增加下载量
  incrementDownloadCount(bookId: string): void {
    db.prepare('UPDATE books SET download_count = download_count + 1 WHERE book_id = ?').run(bookId);
  },

  // 记录浏览日志
  logView(bookId: string, ip: string, userAgent: string): void {
    const id = uuidv4();
    db.prepare('INSERT INTO view_logs (id, book_id, ip, user_agent) VALUES (?, ?, ?, ?)').run(id, bookId, ip, userAgent);
    this.incrementViewCount(bookId);
  },

  // 记录下载日志
  logDownload(bookId: string, ip: string, userAgent: string): void {
    const id = uuidv4();
    db.prepare('INSERT INTO download_logs (id, book_id, ip, user_agent) VALUES (?, ?, ?, ?)').run(id, bookId, ip, userAgent);
    this.incrementDownloadCount(bookId);
  },
};
