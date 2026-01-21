import type { Request, Response } from 'express';
import { categoryService } from '../services/categoryService.js';
import { success, error } from '../utils/response.js';

export const categoryController = {
  // 获取分类列表
  getList(_req: Request, res: Response): void {
    const categories = categoryService.getList();
    success(res, categories);
  },

  // 获取分类树
  getTree(_req: Request, res: Response): void {
    const tree = categoryService.getTree();
    success(res, tree);
  },

  // 获取单个分类
  getById(req: Request, res: Response): void {
    const { id } = req.params;

    const category = categoryService.getById(id);
    if (!category) {
      error(res, '分类不存在', -1, 404);
      return;
    }

    success(res, category);
  },

  // 创建分类
  create(req: Request, res: Response): void {
    const { name, parent_id, sort_order } = req.body;

    if (!name) {
      error(res, '分类名称不能为空');
      return;
    }

    const category = categoryService.create({ name, parent_id, sort_order });
    success(res, category, '创建成功');
  },

  // 更新分类
  update(req: Request, res: Response): void {
    const { id } = req.params;
    const { name, parent_id, sort_order } = req.body;

    const existing = categoryService.getById(id);
    if (!existing) {
      error(res, '分类不存在', -1, 404);
      return;
    }

    // 防止将自己设为父级
    if (parent_id === id) {
      error(res, '不能将自己设为父级分类');
      return;
    }

    const category = categoryService.update(id, { name, parent_id, sort_order });
    success(res, category, '更新成功');
  },

  // 删除分类
  delete(req: Request, res: Response): void {
    const { id } = req.params;

    const existing = categoryService.getById(id);
    if (!existing) {
      error(res, '分类不存在', -1, 404);
      return;
    }

    categoryService.delete(id);
    success(res, null, '删除成功');
  },

  // 更新排序
  updateSort(req: Request, res: Response): void {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      error(res, '请提供排序数据');
      return;
    }

    categoryService.updateSort(items);
    success(res, null, '排序更新成功');
  },
};
