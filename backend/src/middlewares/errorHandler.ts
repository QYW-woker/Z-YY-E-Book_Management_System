import type { Request, Response, NextFunction } from 'express';
import { MulterError } from 'multer';
import { logger } from '../utils/logger.js';
import { error } from '../utils/response.js';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  logger.error(err);

  // Multer 错误处理
  if (err instanceof MulterError) {
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        error(res, '文件大小超出限制', -1, 400);
        return;
      case 'LIMIT_FILE_COUNT':
        error(res, '文件数量超出限制', -1, 400);
        return;
      case 'LIMIT_UNEXPECTED_FILE':
        error(res, '非预期的文件字段', -1, 400);
        return;
      default:
        error(res, `文件上传错误: ${err.message}`, -1, 400);
        return;
    }
  }

  // 自定义错误
  if (err.message) {
    error(res, err.message, -1, 400);
    return;
  }

  // 未知错误
  error(res, '服务器内部错误', -1, 500);
}
