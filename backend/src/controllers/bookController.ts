import type { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { bookService } from '../services/bookService.js';
import { config } from '../config/index.js';
import { success, error, paginated } from '../utils/response.js';
import type { AuthRequest, BookStatus } from '../types/index.js';
import { extractPdfCover } from '../utils/pdfCover.js';

export const bookController = {
  // 获取书籍列表
  getList(req: Request, res: Response): void {
    const {
      page = '1',
      pageSize = '20',
      sortBy,
      sortOrder,
      keyword,
      status,
      category_id,
      tag_ids,
      language,
      format,
      date_start,
      date_end,
    } = req.query;

    const result = bookService.getList({
      page: parseInt(page as string, 10),
      pageSize: parseInt(pageSize as string, 10),
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
      keyword: keyword as string,
      status: status as BookStatus,
      category_id: category_id as string,
      tag_ids: tag_ids ? (Array.isArray(tag_ids) ? tag_ids as string[] : [tag_ids as string]) : undefined,
      language: language as string,
      format: format as string,
      date_start: date_start as string,
      date_end: date_end as string,
    });

    paginated(res, result.list, result.total, result.page, result.pageSize);
  },

  // 获取单个书籍
  getById(req: Request, res: Response): void {
    const { id } = req.params;

    const book = bookService.getById(id);
    if (!book) {
      error(res, '书籍不存在', -1, 404);
      return;
    }

    success(res, book);
  },

  // 创建书籍
  create(req: Request, res: Response): void {
    const data = req.body;

    if (!data.title) {
      error(res, '书名不能为空');
      return;
    }

    const book = bookService.create(data);
    success(res, book, '创建成功');
  },

  // 更新书籍
  update(req: Request, res: Response): void {
    const { id } = req.params;
    const data = req.body;

    const existing = bookService.getById(id);
    if (!existing) {
      error(res, '书籍不存在', -1, 404);
      return;
    }

    const book = bookService.update(id, data);
    success(res, book, '更新成功');
  },

  // 删除书籍
  delete(req: Request, res: Response): void {
    const { id } = req.params;

    const existing = bookService.getById(id);
    if (!existing) {
      error(res, '书籍不存在', -1, 404);
      return;
    }

    bookService.delete(id);
    success(res, null, '删除成功');
  },

  // 批量删除
  batchDelete(req: Request, res: Response): void {
    const { book_ids } = req.body;

    if (!book_ids || !Array.isArray(book_ids) || book_ids.length === 0) {
      error(res, '请选择要删除的书籍');
      return;
    }

    bookService.batchDelete(book_ids);
    success(res, null, '批量删除成功');
  },

  // 批量更新
  batchUpdate(req: Request, res: Response): void {
    const { book_ids, updates } = req.body;

    if (!book_ids || !Array.isArray(book_ids) || book_ids.length === 0) {
      error(res, '请选择要更新的书籍');
      return;
    }

    if (!updates || Object.keys(updates).length === 0) {
      error(res, '请提供要更新的字段');
      return;
    }

    bookService.batchUpdate(book_ids, updates);
    success(res, null, '批量更新成功');
  },

  // 更新状态
  updateStatus(req: Request, res: Response): void {
    const { id } = req.params;
    const { status } = req.body;

    if (!['draft', 'published', 'archived'].includes(status)) {
      error(res, '无效的状态值');
      return;
    }

    const existing = bookService.getById(id);
    if (!existing) {
      error(res, '书籍不存在', -1, 404);
      return;
    }

    bookService.updateStatus(id, status);
    success(res, null, '状态更新成功');
  },

  // 批量更新状态
  batchUpdateStatus(req: Request, res: Response): void {
    const { book_ids, status } = req.body;

    if (!book_ids || !Array.isArray(book_ids) || book_ids.length === 0) {
      error(res, '请选择要更新的书籍');
      return;
    }

    if (!['draft', 'published', 'archived'].includes(status)) {
      error(res, '无效的状态值');
      return;
    }

    book_ids.forEach((id: string) => bookService.updateStatus(id, status));
    success(res, null, '批量更新状态成功');
  },

  // 导入书籍
  async import(req: Request, res: Response): Promise<void> {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      error(res, '请上传文件');
      return;
    }

    const results: { filename: string; success: boolean; book_id?: string; error?: string }[] = [];

    for (const file of files) {
      try {
        // 修复中文文件名编码问题 (multer 使用 latin1，需要转换为 UTF-8)
        const originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
        const ext = path.extname(originalname).toLowerCase().slice(1);
        const title = path.basename(originalname, path.extname(originalname));
        const filePath = `${config.upload.booksDir}/${file.filename}`;

        const book = bookService.create({
          title,
          format: ext,
          file_path: filePath,
          file_size: file.size,
          status: 'draft',
        });

        // 如果是 PDF 文件，自动提取首页作为封面
        if (ext === 'pdf') {
          console.log('[import] Detected PDF file, extracting cover...');
          try {
            const fullFilePath = path.join(config.upload.dir, filePath);
            console.log('[import] Full file path:', fullFilePath);
            const coverPath = await extractPdfCover(fullFilePath);
            console.log('[import] Cover extraction result:', coverPath);
            if (coverPath) {
              bookService.update(book.book_id, { cover_path: coverPath });
              console.log('[import] Book cover updated successfully');
            }
          } catch (coverErr) {
            // 封面提取失败不影响导入结果，仅记录日志
            console.warn(`[import] Failed to extract cover for ${originalname}:`, coverErr);
          }
        }

        results.push({
          filename: originalname,
          success: true,
          book_id: book.book_id,
        });
      } catch (err: any) {
        // 尝试修复文件名编码用于错误报告
        let filename = file.originalname;
        try {
          filename = Buffer.from(file.originalname, 'latin1').toString('utf8');
        } catch {}
        results.push({
          filename,
          success: false,
          error: err.message || '导入失败',
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failedCount = results.filter((r) => !r.success).length;

    success(res, {
      success: successCount,
      failed: failedCount,
      results,
    });
  },

  // 上传封面
  uploadCover(req: Request, res: Response): void {
    const { id } = req.params;
    const file = req.file;

    if (!file) {
      error(res, '请上传封面图片');
      return;
    }

    const existing = bookService.getById(id);
    if (!existing) {
      // 删除已上传的文件
      fs.unlinkSync(file.path);
      error(res, '书籍不存在', -1, 404);
      return;
    }

    // 删除旧封面
    if (existing.cover_path) {
      const oldCoverPath = path.join(config.upload.dir, existing.cover_path);
      if (fs.existsSync(oldCoverPath)) {
        fs.unlinkSync(oldCoverPath);
      }
    }

    const coverPath = `${config.upload.coversDir}/${file.filename}`;
    bookService.update(id, { cover_path: coverPath });

    success(res, { cover_path: `/uploads/${coverPath}` });
  },

  // 从PDF提取封面
  async extractCover(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    const book = bookService.getById(id);
    if (!book) {
      error(res, '书籍不存在', -1, 404);
      return;
    }

    // 检查是否是 PDF 文件
    if (book.format?.toLowerCase() !== 'pdf') {
      error(res, '只有PDF文件支持提取封面');
      return;
    }

    // 检查文件是否存在
    const filePath = path.join(config.upload.dir, book.file_path);
    if (!fs.existsSync(filePath)) {
      error(res, '书籍文件不存在');
      return;
    }

    try {
      const coverPath = await extractPdfCover(filePath);
      if (!coverPath) {
        error(res, '封面提取失败');
        return;
      }

      // 删除旧封面
      if (book.cover_path) {
        const oldCoverPath = path.join(config.upload.dir, book.cover_path);
        if (fs.existsSync(oldCoverPath)) {
          fs.unlinkSync(oldCoverPath);
        }
      }

      // 更新书籍封面路径
      bookService.update(id, { cover_path: coverPath });

      success(res, { cover_path: `/uploads/${coverPath}` });
    } catch (err: any) {
      console.error('Extract cover error:', err);
      error(res, err.message || '封面提取失败');
    }
  },

  // 下载书籍
  download(req: AuthRequest, res: Response): void {
    const { id } = req.params;

    const book = bookService.getById(id);
    if (!book) {
      error(res, '书籍不存在', -1, 404);
      return;
    }

    if (!book.file_path) {
      error(res, '书籍文件不存在', -1, 404);
      return;
    }

    const filePath = path.join(config.upload.dir, book.file_path);
    if (!fs.existsSync(filePath)) {
      error(res, '书籍文件不存在', -1, 404);
      return;
    }

    // 记录下载日志
    const ip = req.ip || req.socket.remoteAddress || '';
    const userAgent = req.get('User-Agent') || '';
    bookService.logDownload(id, ip, userAgent);

    // 设置下载文件名
    const filename = `${book.title}.${book.format}`;
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.setHeader('Content-Type', 'application/octet-stream');

    fs.createReadStream(filePath).pipe(res);
  },

  // 导出书籍（批量）
  export(req: Request, res: Response): void {
    const { book_ids, category_id, tag_ids, include_metadata, metadata_format } = req.body;

    // 这里简化实现，实际需要打包成 ZIP
    error(res, '批量导出功能正在开发中');
  },
};
