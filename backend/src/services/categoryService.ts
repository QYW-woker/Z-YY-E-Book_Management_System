import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database.js';
import type { Category } from '../types/index.js';

export const categoryService = {
  // 获取分类列表（扁平）
  getList(): Category[] {
    const categories = db.prepare(`
      SELECT c.*, COUNT(bc.book_id) as book_count
      FROM categories c
      LEFT JOIN book_categories bc ON bc.category_id = c.id
      GROUP BY c.id
      ORDER BY c.sort_order ASC, c.created_at ASC
    `).all() as Category[];
    return categories;
  },

  // 获取分类树
  getTree(): Category[] {
    const categories = this.getList();
    return this.buildTree(categories);
  },

  // 构建树形结构
  buildTree(categories: Category[], parentId: string | null = null): Category[] {
    return categories
      .filter((c) => c.parent_id === parentId)
      .map((c) => ({
        ...c,
        children: this.buildTree(categories, c.id),
      }))
      .sort((a, b) => a.sort_order - b.sort_order);
  },

  // 获取单个分类
  getById(id: string): Category | undefined {
    const category = db.prepare(`
      SELECT c.*, COUNT(bc.book_id) as book_count
      FROM categories c
      LEFT JOIN book_categories bc ON bc.category_id = c.id
      WHERE c.id = ?
      GROUP BY c.id
    `).get(id) as Category | undefined;
    return category;
  },

  // 创建分类
  create(data: Partial<Category>): Category {
    const id = uuidv4();
    db.prepare(`
      INSERT INTO categories (id, name, parent_id, sort_order)
      VALUES (?, ?, ?, ?)
    `).run(id, data.name || '', data.parent_id || null, data.sort_order || 0);

    return this.getById(id)!;
  },

  // 更新分类
  update(id: string, data: Partial<Category>): Category {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      values.push(data.name);
    }
    if (data.parent_id !== undefined) {
      updates.push('parent_id = ?');
      values.push(data.parent_id);
    }
    if (data.sort_order !== undefined) {
      updates.push('sort_order = ?');
      values.push(data.sort_order);
    }

    if (updates.length > 0) {
      updates.push("updated_at = datetime('now')");
      values.push(id);
      db.prepare(`UPDATE categories SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }

    return this.getById(id)!;
  },

  // 删除分类
  delete(id: string): void {
    // 将子分类的 parent_id 设为 null
    db.prepare('UPDATE categories SET parent_id = NULL WHERE parent_id = ?').run(id);
    // 删除分类
    db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  },

  // 批量更新排序
  updateSort(items: { id: string; sort_order: number; parent_id?: string | null }[]): void {
    const updateStmt = db.prepare(`
      UPDATE categories SET sort_order = ?, parent_id = ?, updated_at = datetime('now')
      WHERE id = ?
    `);

    const transaction = db.transaction(() => {
      items.forEach((item) => {
        updateStmt.run(item.sort_order, item.parent_id ?? null, item.id);
      });
    });

    transaction();
  },
};
