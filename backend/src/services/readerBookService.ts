import { db } from '../config/database.js';
import type { Book, PaginatedData, ReaderSearchParams } from '../types/index.js';

export const readerBookService = {
  // 获取已发布的书籍列表
  getPublishedBooks(params: ReaderSearchParams): PaginatedData<Book & { categories?: any[]; tags?: any[] }> {
    const {
      keyword,
      title,
      author,
      isbn,
      category_id,
      language,
      format,
      publish_date_start,
      publish_date_end,
      sort_by = 'newest',
      page = 1,
      page_size = 20,
    } = params;

    let whereClause = "b.status = 'published'";
    const whereParams: any[] = [];

    // 关键词搜索（搜书名+作者+简介）
    if (keyword) {
      whereClause += ' AND (b.title LIKE ? OR b.author LIKE ? OR b.description LIKE ?)';
      const kw = `%${keyword}%`;
      whereParams.push(kw, kw, kw);
    }

    // 精确书名搜索
    if (title) {
      whereClause += ' AND b.title LIKE ?';
      whereParams.push(`%${title}%`);
    }

    // 作者搜索
    if (author) {
      whereClause += ' AND b.author LIKE ?';
      whereParams.push(`%${author}%`);
    }

    // ISBN搜索
    if (isbn) {
      whereClause += ' AND b.isbn LIKE ?';
      whereParams.push(`%${isbn}%`);
    }

    // 分类筛选
    if (category_id) {
      whereClause += ' AND EXISTS (SELECT 1 FROM book_categories bc WHERE bc.book_id = b.book_id AND bc.category_id = ?)';
      whereParams.push(category_id);
    }

    // 语言筛选
    if (language) {
      whereClause += ' AND b.language = ?';
      whereParams.push(language);
    }

    // 格式筛选（支持多选）
    if (format && format.length > 0) {
      whereClause += ` AND b.format IN (${format.map(() => '?').join(',')})`;
      whereParams.push(...format);
    }

    // 出版日期范围
    if (publish_date_start) {
      whereClause += ' AND b.publish_date >= ?';
      whereParams.push(publish_date_start);
    }
    if (publish_date_end) {
      whereClause += ' AND b.publish_date <= ?';
      whereParams.push(publish_date_end);
    }

    // 统计总数
    const countSql = `SELECT COUNT(*) as total FROM books b WHERE ${whereClause}`;
    const { total } = db.prepare(countSql).get(...whereParams) as { total: number };

    // 排序
    let orderBy = 'b.created_at DESC';
    switch (sort_by) {
      case 'newest':
        orderBy = 'b.created_at DESC';
        break;
      case 'popular':
        orderBy = 'b.download_count DESC, b.view_count DESC';
        break;
      case 'title':
        orderBy = 'b.title ASC';
        break;
      case 'relevance':
        // 相关性排序 - 简单实现，优先匹配标题
        if (keyword) {
          orderBy = `
            CASE
              WHEN b.title LIKE ? THEN 1
              WHEN b.author LIKE ? THEN 2
              ELSE 3
            END, b.download_count DESC
          `;
          whereParams.push(`%${keyword}%`, `%${keyword}%`);
        }
        break;
    }

    // 查询列表
    const offset = (page - 1) * page_size;
    const listSql = `
      SELECT b.* FROM books b
      WHERE ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;

    const list = db.prepare(listSql).all(...whereParams, page_size, offset) as Book[];

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
      pageSize: page_size,
      totalPages: Math.ceil(total / page_size),
    };
  },

  // 获取书籍详情（只返回已发布的）
  getBookDetail(bookId: string): (Book & { categories?: any[]; tags?: any[] }) | null {
    const book = db.prepare("SELECT * FROM books WHERE book_id = ? AND status = 'published'").get(bookId) as Book | undefined;
    if (!book) return null;

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
      categories,
      tags,
    };
  },

  // 获取热门书籍
  getHotBooks(limit = 10): Book[] {
    const list = db.prepare(`
      SELECT * FROM books
      WHERE status = 'published'
      ORDER BY download_count DESC, view_count DESC
      LIMIT ?
    `).all(limit) as Book[];

    return list.map((book) => ({
      ...book,
      keywords: JSON.parse(book.keywords || '[]'),
    }));
  },

  // 获取最新书籍
  getNewestBooks(limit = 10): Book[] {
    const list = db.prepare(`
      SELECT * FROM books
      WHERE status = 'published'
      ORDER BY created_at DESC
      LIMIT ?
    `).all(limit) as Book[];

    return list.map((book) => ({
      ...book,
      keywords: JSON.parse(book.keywords || '[]'),
    }));
  },

  // 获取推荐书籍（用于轮播等）
  getRecommendedBooks(limit = 5): Book[] {
    // 简单实现：返回下载量和浏览量最高的书籍
    const list = db.prepare(`
      SELECT * FROM books
      WHERE status = 'published' AND cover_path != ''
      ORDER BY (download_count + view_count) DESC
      LIMIT ?
    `).all(limit) as Book[];

    return list.map((book) => ({
      ...book,
      keywords: JSON.parse(book.keywords || '[]'),
    }));
  },

  // 获取相关书籍（同分类或同作者）
  getRelatedBooks(bookId: string, limit = 6): Book[] {
    const book = db.prepare('SELECT * FROM books WHERE book_id = ?').get(bookId) as Book | undefined;
    if (!book) return [];

    // 获取该书的分类
    const categories = db.prepare(`
      SELECT category_id FROM book_categories WHERE book_id = ?
    `).all(bookId) as { category_id: string }[];
    const categoryIds = categories.map((c) => c.category_id);

    let list: Book[] = [];

    // 先找同作者的书
    if (book.author) {
      list = db.prepare(`
        SELECT * FROM books
        WHERE status = 'published' AND book_id != ? AND author = ?
        ORDER BY download_count DESC
        LIMIT ?
      `).all(bookId, book.author, limit) as Book[];
    }

    // 如果不够，再找同分类的书
    if (list.length < limit && categoryIds.length > 0) {
      const existingIds = list.map((b) => b.book_id);
      existingIds.push(bookId);
      const placeholders = existingIds.map(() => '?').join(',');
      const categoryPlaceholders = categoryIds.map(() => '?').join(',');

      const remaining = limit - list.length;
      const moreBooks = db.prepare(`
        SELECT DISTINCT b.* FROM books b
        INNER JOIN book_categories bc ON bc.book_id = b.book_id
        WHERE b.status = 'published'
          AND b.book_id NOT IN (${placeholders})
          AND bc.category_id IN (${categoryPlaceholders})
        ORDER BY b.download_count DESC
        LIMIT ?
      `).all(...existingIds, ...categoryIds, remaining) as Book[];

      list = [...list, ...moreBooks];
    }

    return list.map((book) => ({
      ...book,
      keywords: JSON.parse(book.keywords || '[]'),
    }));
  },

  // 获取分类下的书籍
  getBooksByCategory(categoryId: string, page = 1, pageSize = 20): PaginatedData<Book> {
    const offset = (page - 1) * pageSize;

    const { total } = db.prepare(`
      SELECT COUNT(*) as total FROM books b
      INNER JOIN book_categories bc ON bc.book_id = b.book_id
      WHERE bc.category_id = ? AND b.status = 'published'
    `).get(categoryId) as { total: number };

    const list = db.prepare(`
      SELECT b.* FROM books b
      INNER JOIN book_categories bc ON bc.book_id = b.book_id
      WHERE bc.category_id = ? AND b.status = 'published'
      ORDER BY b.created_at DESC
      LIMIT ? OFFSET ?
    `).all(categoryId, pageSize, offset) as Book[];

    return {
      list: list.map((book) => ({
        ...book,
        keywords: JSON.parse(book.keywords || '[]'),
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  },

  // 增加浏览量
  incrementViewCount(bookId: string): void {
    db.prepare('UPDATE books SET view_count = view_count + 1 WHERE book_id = ?').run(bookId);
  },

  // 增加下载量
  incrementDownloadCount(bookId: string): void {
    db.prepare('UPDATE books SET download_count = download_count + 1 WHERE book_id = ?').run(bookId);
  },

  // 记录搜索日志
  logSearch(keyword: string, resultsCount: number, userId?: string): void {
    db.prepare(`
      INSERT INTO search_logs (user_id, keyword, results_count)
      VALUES (?, ?, ?)
    `).run(userId || null, keyword, resultsCount);
  },

  // 获取热门搜索词
  getHotSearchKeywords(limit = 10): { keyword: string; count: number }[] {
    return db.prepare(`
      SELECT keyword, COUNT(*) as count
      FROM search_logs
      WHERE created_at >= datetime('now', '-7 days')
      GROUP BY keyword
      ORDER BY count DESC
      LIMIT ?
    `).all(limit) as { keyword: string; count: number }[];
  },

  // 获取分类树（只返回有已发布书籍的分类）
  getCategoriesWithBooks(): any[] {
    const categories = db.prepare(`
      SELECT c.*,
        (SELECT COUNT(*) FROM book_categories bc
         INNER JOIN books b ON b.book_id = bc.book_id
         WHERE bc.category_id = c.id AND b.status = 'published') as book_count
      FROM categories c
      ORDER BY c.sort_order ASC, c.created_at ASC
    `).all() as any[];

    // 构建树形结构
    const buildTree = (parentId: string | null = null): any[] => {
      return categories
        .filter((c) => c.parent_id === parentId)
        .map((c) => ({
          ...c,
          children: buildTree(c.id),
        }));
    };

    return buildTree(null);
  },

  // 获取所有标签
  getAllTags(): any[] {
    return db.prepare(`
      SELECT t.*,
        (SELECT COUNT(*) FROM book_tags bt
         INNER JOIN books b ON b.book_id = bt.book_id
         WHERE bt.tag_id = t.id AND b.status = 'published') as book_count
      FROM tags t
      ORDER BY t.name ASC
    `).all();
  },
};
