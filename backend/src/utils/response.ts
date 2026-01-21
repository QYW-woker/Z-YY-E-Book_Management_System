import type { Response } from 'express';
import type { ApiResponse } from '../types/index.js';

// 成功响应
export function success<T>(res: Response, data: T, message = 'success'): void {
  const response: ApiResponse<T> = {
    code: 0,
    message,
    data,
  };
  res.json(response);
}

// 错误响应
export function error(res: Response, message: string, code = -1, statusCode = 400): void {
  const response: ApiResponse<null> = {
    code,
    message,
    data: null,
  };
  res.status(statusCode).json(response);
}

// 分页响应
export function paginated<T>(
  res: Response,
  list: T[],
  total: number,
  page: number,
  pageSize: number
): void {
  success(res, {
    list,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}
