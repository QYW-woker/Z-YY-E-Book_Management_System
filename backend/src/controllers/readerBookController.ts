import type { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { readerBookService } from '../services/readerBookService.js';
import { userService } from '../services/userService.js';
import { bookService } from '../services/bookService.js';
import { config } from '../config/index.js';
import type { UserAuthRequest, ReaderSearchParams } from '../types/index.js';

export const readerBookController = {
  // 获取书籍列表
  getBooks(req: Request, res: Response): void {
    try {
      const params: ReaderSearchParams = {
        keyword: req.query.keyword as string,
        title: req.query.title as string,
        author: req.query.author as string,
        isbn: req.query.isbn as string,
        category_id: req.query.category_id as string,
        language: req.query.language as string,
        format: req.query.format ? (req.query.format as string).split(',') : undefined,
        publish_date_start: req.query.publish_date_start as string,
        publish_date_end: req.query.publish_date_end as string,
        sort_by: req.query.sort_by as any,
        page: parseInt(req.query.page as string) || 1,
        page_size: parseInt(req.query.page_size as string) || 20,
      };

      const data = readerBookService.getPublishedBooks(params);

      // 记录搜索日志
      if (params.keyword) {
        const userId = (req as UserAuthRequest).user?.userId;
        readerBookService.logSearch(params.keyword, data.total, userId);
      }

      res.json({
        code: 0,
        message: '获取成功',
        data,
      });
    } catch (error: any) {
      res.status(500).json({
        code: 500,
        message: error.message || '获取失败',
        data: null,
      });
    }
  },

  // 搜索书籍
  searchBooks(req: Request, res: Response): void {
    try {
      const params: ReaderSearchParams = {
        keyword: req.query.keyword as string || req.query.q as string,
        title: req.query.title as string,
        author: req.query.author as string,
        isbn: req.query.isbn as string,
        category_id: req.query.category_id as string,
        language: req.query.language as string,
        format: req.query.format ? (req.query.format as string).split(',') : undefined,
        publish_date_start: req.query.publish_date_start as string,
        publish_date_end: req.query.publish_date_end as string,
        sort_by: (req.query.sort_by as any) || 'relevance',
        page: parseInt(req.query.page as string) || 1,
        page_size: parseInt(req.query.page_size as string) || 20,
      };

      const data = readerBookService.getPublishedBooks(params);

      // 记录搜索日志
      const keyword = params.keyword || params.title || params.author;
      if (keyword) {
        const userId = (req as UserAuthRequest).user?.userId;
        readerBookService.logSearch(keyword, data.total, userId);
      }

      res.json({
        code: 0,
        message: '搜索成功',
        data,
      });
    } catch (error: any) {
      res.status(500).json({
        code: 500,
        message: error.message || '搜索失败',
        data: null,
      });
    }
  },

  // 获取书籍详情
  getBookDetail(req: Request, res: Response): void {
    try {
      const { id } = req.params;
      const book = readerBookService.getBookDetail(id);

      if (!book) {
        res.status(404).json({
          code: 404,
          message: '书籍不存在或未发布',
          data: null,
        });
        return;
      }

      // 增加浏览量
      readerBookService.incrementViewCount(id);

      // 记录浏览日志
      const ip = req.ip || req.socket.remoteAddress || '';
      const userAgent = req.headers['user-agent'] || '';
      bookService.logView(id, ip, userAgent);

      // 如果用户已登录，记录浏览历史
      const userId = (req as UserAuthRequest).user?.userId;
      if (userId) {
        userService.addViewHistory(userId, id, 0);
      }

      // 检查用户是否已收藏
      const isFavorited = userId ? userService.isFavorited(userId, id) : false;

      res.json({
        code: 0,
        message: '获取成功',
        data: {
          ...book,
          is_favorited: isFavorited,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        code: 500,
        message: error.message || '获取失败',
        data: null,
      });
    }
  },

  // 获取热门书籍
  getHotBooks(req: Request, res: Response): void {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const books = readerBookService.getHotBooks(limit);

      res.json({
        code: 0,
        message: '获取成功',
        data: books,
      });
    } catch (error: any) {
      res.status(500).json({
        code: 500,
        message: error.message || '获取失败',
        data: null,
      });
    }
  },

  // 获取最新书籍
  getNewestBooks(req: Request, res: Response): void {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const books = readerBookService.getNewestBooks(limit);

      res.json({
        code: 0,
        message: '获取成功',
        data: books,
      });
    } catch (error: any) {
      res.status(500).json({
        code: 500,
        message: error.message || '获取失败',
        data: null,
      });
    }
  },

  // 获取推荐书籍（轮播用）
  getRecommendedBooks(req: Request, res: Response): void {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const books = readerBookService.getRecommendedBooks(limit);

      res.json({
        code: 0,
        message: '获取成功',
        data: books,
      });
    } catch (error: any) {
      res.status(500).json({
        code: 500,
        message: error.message || '获取失败',
        data: null,
      });
    }
  },

  // 获取相关书籍
  getRelatedBooks(req: Request, res: Response): void {
    try {
      const { id } = req.params;
      const limit = parseInt(req.query.limit as string) || 6;
      const books = readerBookService.getRelatedBooks(id, limit);

      res.json({
        code: 0,
        message: '获取成功',
        data: books,
      });
    } catch (error: any) {
      res.status(500).json({
        code: 500,
        message: error.message || '获取失败',
        data: null,
      });
    }
  },

  // 获取下载链接
  getDownloadUrl(req: UserAuthRequest, res: Response): void {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      // 检查是否需要登录才能下载（可配置）
      const requireLogin = false; // 可从配置读取
      if (requireLogin && !userId) {
        res.status(401).json({
          code: 401,
          message: '请先登录后再下载',
          data: null,
        });
        return;
      }

      const book = readerBookService.getBookDetail(id);
      if (!book) {
        res.status(404).json({
          code: 404,
          message: '书籍不存在或未发布',
          data: null,
        });
        return;
      }

      if (!book.file_path) {
        res.status(404).json({
          code: 404,
          message: '文件不存在',
          data: null,
        });
        return;
      }

      // 生成带签名的下载URL（有效期30分钟）
      const expires = Date.now() + 30 * 60 * 1000;
      const signature = crypto
        .createHmac('sha256', config.jwt.secret)
        .update(`${id}:${expires}`)
        .digest('hex');

      res.json({
        code: 0,
        message: '获取成功',
        data: {
          download_url: `/api/books/${id}/file?expires=${expires}&signature=${signature}`,
          filename: `${book.title}.${book.format}`,
          file_size: book.file_size,
          format: book.format,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        code: 500,
        message: error.message || '获取失败',
        data: null,
      });
    }
  },

  // 下载文件
  downloadFile(req: Request, res: Response): void {
    try {
      const { id } = req.params;
      const { expires, signature } = req.query;

      // 验证签名
      if (!expires || !signature) {
        res.status(400).json({
          code: 400,
          message: '无效的下载链接',
          data: null,
        });
        return;
      }

      // 检查是否过期
      if (Date.now() > parseInt(expires as string)) {
        res.status(400).json({
          code: 400,
          message: '下载链接已过期',
          data: null,
        });
        return;
      }

      // 验证签名
      const expectedSignature = crypto
        .createHmac('sha256', config.jwt.secret)
        .update(`${id}:${expires}`)
        .digest('hex');

      if (signature !== expectedSignature) {
        res.status(400).json({
          code: 400,
          message: '无效的下载链接',
          data: null,
        });
        return;
      }

      const book = readerBookService.getBookDetail(id);
      if (!book || !book.file_path) {
        res.status(404).json({
          code: 404,
          message: '文件不存在',
          data: null,
        });
        return;
      }

      const filePath = path.join(config.upload.dir, book.file_path);
      if (!fs.existsSync(filePath)) {
        res.status(404).json({
          code: 404,
          message: '文件不存在',
          data: null,
        });
        return;
      }

      // 增加下载量
      readerBookService.incrementDownloadCount(id);

      // 记录下载日志
      const ip = req.ip || req.socket.remoteAddress || '';
      const userAgent = req.headers['user-agent'] || '';
      bookService.logDownload(id, ip, userAgent);

      // 如果用户已登录，记录下载历史
      const userId = (req as UserAuthRequest).user?.userId;
      if (userId) {
        userService.addDownloadRecord(userId, id, ip, userAgent);
      }

      // 设置下载文件名
      const filename = `${book.title}.${book.format}`;
      const encodedFilename = encodeURIComponent(filename);

      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFilename}`);
      res.setHeader('Content-Type', 'application/octet-stream');

      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error: any) {
      res.status(500).json({
        code: 500,
        message: error.message || '下载失败',
        data: null,
      });
    }
  },

  // 获取分类列表
  getCategories(req: Request, res: Response): void {
    try {
      const categories = readerBookService.getCategoriesWithBooks();

      res.json({
        code: 0,
        message: '获取成功',
        data: categories,
      });
    } catch (error: any) {
      res.status(500).json({
        code: 500,
        message: error.message || '获取失败',
        data: null,
      });
    }
  },

  // 获取分类下的书籍
  getCategoryBooks(req: Request, res: Response): void {
    try {
      const { id } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.page_size as string) || 20;

      const data = readerBookService.getBooksByCategory(id, page, pageSize);

      res.json({
        code: 0,
        message: '获取成功',
        data,
      });
    } catch (error: any) {
      res.status(500).json({
        code: 500,
        message: error.message || '获取失败',
        data: null,
      });
    }
  },

  // 获取标签列表
  getTags(req: Request, res: Response): void {
    try {
      const tags = readerBookService.getAllTags();

      res.json({
        code: 0,
        message: '获取成功',
        data: tags,
      });
    } catch (error: any) {
      res.status(500).json({
        code: 500,
        message: error.message || '获取失败',
        data: null,
      });
    }
  },

  // 获取热门搜索词
  getHotSearchKeywords(req: Request, res: Response): void {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const keywords = readerBookService.getHotSearchKeywords(limit);

      res.json({
        code: 0,
        message: '获取成功',
        data: keywords,
      });
    } catch (error: any) {
      res.status(500).json({
        code: 500,
        message: error.message || '获取失败',
        data: null,
      });
    }
  },

  // 获取阅读文件（用于在线阅读器）
  getReadFile(req: Request, res: Response): void {
    try {
      const { id } = req.params;

      const book = readerBookService.getBookDetail(id);
      if (!book || !book.file_path) {
        res.status(404).json({
          code: 404,
          message: '文件不存在',
          data: null,
        });
        return;
      }

      const filePath = path.join(config.upload.dir, book.file_path);
      if (!fs.existsSync(filePath)) {
        res.status(404).json({
          code: 404,
          message: '文件不存在',
          data: null,
        });
        return;
      }

      // 设置正确的Content-Type
      const mimeTypes: Record<string, string> = {
        pdf: 'application/pdf',
        epub: 'application/epub+zip',
        mobi: 'application/x-mobipocket-ebook',
      };

      const contentType = mimeTypes[book.format.toLowerCase()] || 'application/octet-stream';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', 'inline');

      // 支持Range请求（用于PDF等大文件的流式加载）
      const stat = fs.statSync(filePath);
      const fileSize = stat.size;
      const range = req.headers.range;

      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = end - start + 1;

        res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Content-Length', chunksize);
        res.status(206);

        const fileStream = fs.createReadStream(filePath, { start, end });
        fileStream.pipe(res);
      } else {
        res.setHeader('Content-Length', fileSize);
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
      }
    } catch (error: any) {
      res.status(500).json({
        code: 500,
        message: error.message || '获取失败',
        data: null,
      });
    }
  },
};
