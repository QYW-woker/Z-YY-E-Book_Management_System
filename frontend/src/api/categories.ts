import { request } from '@/utils/request'
import type { Category } from '@/types'

export const categoriesApi = {
  /**
   * 获取分类列表（树形结构）
   */
  getTree(): Promise<Category[]> {
    return request.get('/admin/categories/tree')
  },

  /**
   * 获取分类列表（扁平结构）
   */
  getList(): Promise<Category[]> {
    return request.get('/admin/categories')
  },

  /**
   * 获取分类详情
   */
  getById(id: string): Promise<Category> {
    return request.get(`/admin/categories/${id}`)
  },

  /**
   * 创建分类
   */
  create(data: Partial<Category>): Promise<Category> {
    return request.post('/admin/categories', data)
  },

  /**
   * 更新分类
   */
  update(id: string, data: Partial<Category>): Promise<Category> {
    return request.put(`/admin/categories/${id}`, data)
  },

  /**
   * 删除分类
   */
  delete(id: string): Promise<void> {
    return request.delete(`/admin/categories/${id}`)
  },

  /**
   * 更新分类排序
   */
  updateSort(data: { id: string; sort_order: number; parent_id?: string | null }[]): Promise<void> {
    return request.post('/admin/categories/sort', { items: data })
  },
}
