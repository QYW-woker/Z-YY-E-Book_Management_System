import type { Request, Response } from 'express';
import { tagService } from '../services/tagService.js';
import { success, error } from '../utils/response.js';

export const tagController = {
  // 获取标签列表
  getList(req: Request, res: Response): void {
    const { keyword } = req.query;
    const tags = tagService.getList(keyword as string);
    success(res, tags);
  },

  // 获取单个标签
  getById(req: Request, res: Response): void {
    const { id } = req.params;

    const tag = tagService.getById(id);
    if (!tag) {
      error(res, '标签不存在', -1, 404);
      return;
    }

    success(res, tag);
  },

  // 创建标签
  create(req: Request, res: Response): void {
    const { name, color } = req.body;

    if (!name) {
      error(res, '标签名称不能为空');
      return;
    }

    // 检查名称是否重复
    const existing = tagService.findByName(name);
    if (existing) {
      error(res, '标签名称已存在');
      return;
    }

    const tag = tagService.create({ name, color });
    success(res, tag, '创建成功');
  },

  // 更新标签
  update(req: Request, res: Response): void {
    const { id } = req.params;
    const { name, color } = req.body;

    const existing = tagService.getById(id);
    if (!existing) {
      error(res, '标签不存在', -1, 404);
      return;
    }

    // 检查名称是否重复
    if (name && name !== existing.name) {
      const duplicate = tagService.findByName(name);
      if (duplicate) {
        error(res, '标签名称已存在');
        return;
      }
    }

    const tag = tagService.update(id, { name, color });
    success(res, tag, '更新成功');
  },

  // 删除标签
  delete(req: Request, res: Response): void {
    const { id } = req.params;

    const existing = tagService.getById(id);
    if (!existing) {
      error(res, '标签不存在', -1, 404);
      return;
    }

    tagService.delete(id);
    success(res, null, '删除成功');
  },

  // 批量删除
  batchDelete(req: Request, res: Response): void {
    const { tag_ids } = req.body;

    if (!tag_ids || !Array.isArray(tag_ids) || tag_ids.length === 0) {
      error(res, '请选择要删除的标签');
      return;
    }

    tagService.batchDelete(tag_ids);
    success(res, null, '批量删除成功');
  },
};
