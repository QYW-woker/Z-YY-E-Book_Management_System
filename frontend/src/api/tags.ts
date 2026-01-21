import { request } from '@/utils/request'
import type { Tag } from '@/types'

export const tagsApi = {
  /**
   * 获取标签列表
   */
  getList(params?: { keyword?: string }): Promise<Tag[]> {
    return request.get('/admin/tags', { params })
  },

  /**
   * 获取标签详情
   */
  getById(id: string): Promise<Tag> {
    return request.get(`/admin/tags/${id}`)
  },

  /**
   * 创建标签
   */
  create(data: Partial<Tag>): Promise<Tag> {
    return request.post('/admin/tags', data)
  },

  /**
   * 更新标签
   */
  update(id: string, data: Partial<Tag>): Promise<Tag> {
    return request.put(`/admin/tags/${id}`, data)
  },

  /**
   * 删除标签
   */
  delete(id: string): Promise<void> {
    return request.delete(`/admin/tags/${id}`)
  },

  /**
   * 批量删除标签
   */
  batchDelete(ids: string[]): Promise<void> {
    return request.post('/admin/tags/batch-delete', { tag_ids: ids })
  },
}
