import { request } from '@/utils/request'
import type { BookMetadata, BookFilter, PaginatedData, BatchUpdateRequest, ImportResult } from '@/types'

export const booksApi = {
  /**
   * 获取电子书列表
   */
  getList(params: BookFilter & { page?: number; pageSize?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' }): Promise<PaginatedData<BookMetadata>> {
    return request.get('/admin/books', { params })
  },

  /**
   * 获取电子书详情
   */
  getById(id: string): Promise<BookMetadata> {
    return request.get(`/admin/books/${id}`)
  },

  /**
   * 创建电子书
   */
  create(data: Partial<BookMetadata>): Promise<BookMetadata> {
    return request.post('/admin/books', data)
  },

  /**
   * 更新电子书
   */
  update(id: string, data: Partial<BookMetadata>): Promise<BookMetadata> {
    return request.put(`/admin/books/${id}`, data)
  },

  /**
   * 删除电子书
   */
  delete(id: string): Promise<void> {
    return request.delete(`/admin/books/${id}`)
  },

  /**
   * 批量删除电子书
   */
  batchDelete(ids: string[]): Promise<void> {
    return request.post('/admin/books/batch-delete', { book_ids: ids })
  },

  /**
   * 批量更新电子书
   */
  batchUpdate(data: BatchUpdateRequest): Promise<void> {
    return request.post('/admin/books/batch-update', data)
  },

  /**
   * 导入电子书
   */
  import(files: File[], onProgress?: (progress: number) => void): Promise<ImportResult> {
    const formData = new FormData()
    files.forEach((file) => {
      formData.append('files', file)
    })
    return request.upload('/admin/books/import', formData, onProgress)
  },

  /**
   * 上传封面
   */
  uploadCover(bookId: string, file: File): Promise<{ cover_path: string }> {
    const formData = new FormData()
    formData.append('cover', file)
    return request.upload(`/admin/books/${bookId}/cover`, formData)
  },

  /**
   * 预览PDF封面（上传文件并提取第一页作为base64返回）
   */
  previewCover(file: File): Promise<{ cover: string }> {
    const formData = new FormData()
    formData.append('file', file)
    return request.upload('/admin/books/preview-cover', formData)
  },

  /**
   * 从PDF提取封面
   */
  extractCover(bookId: string): Promise<{ cover_path: string }> {
    return request.post(`/admin/books/${bookId}/extract-cover`)
  },

  /**
   * 下载电子书
   */
  download(id: string): Promise<void> {
    return request.download(`/admin/books/${id}/download`)
  },

  /**
   * 批量导出电子书
   */
  batchExport(params: { book_ids?: string[]; category_id?: string; tag_ids?: string[]; include_metadata?: boolean; metadata_format?: 'json' | 'csv' }): Promise<void> {
    return request.post('/admin/books/export', params, { responseType: 'blob' })
  },

  /**
   * 更新电子书状态
   */
  updateStatus(id: string, status: 'draft' | 'published' | 'archived'): Promise<void> {
    return request.patch(`/admin/books/${id}/status`, { status })
  },

  /**
   * 批量更新状态
   */
  batchUpdateStatus(ids: string[], status: 'draft' | 'published' | 'archived'): Promise<void> {
    return request.post('/admin/books/batch-status', { book_ids: ids, status })
  },
}
