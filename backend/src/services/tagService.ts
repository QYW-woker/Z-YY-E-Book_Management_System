import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database.js';
import type { Tag } from '../types/index.js';

export const tagService = {
  // 获取标签列表
  getList(keyword?: string): Tag[] {
    let sql = `
      SELECT t.*, COUNT(bt.book_id) as book_count
      FROM tags t
      LEFT JOIN book_tags bt ON bt.tag_id = t.id
    `;
    const params: any[] = [];

    if (keyword) {
      sql += ' WHERE t.name LIKE ?';
      params.push(`%${keyword}%`);
    }

    sql += ' GROUP BY t.id ORDER BY t.created_at DESC';

    return db.prepare(sql).all(...params) as Tag[];
  },

  // 获取单个标签
  getById(id: string): Tag | undefined {
    const tag = db.prepare(`
      SELECT t.*, COUNT(bt.book_id) as book_count
      FROM tags t
      LEFT JOIN book_tags bt ON bt.tag_id = t.id
      WHERE t.id = ?
      GROUP BY t.id
    `).get(id) as Tag | undefined;
    return tag;
  },

  // 通过名称查找
  findByName(name: string): Tag | undefined {
    return db.prepare('SELECT * FROM tags WHERE name = ?').get(name) as Tag | undefined;
  },

  // 创建标签
  create(data: Partial<Tag>): Tag {
    const id = uuidv4();
    db.prepare(`
      INSERT INTO tags (id, name, color)
      VALUES (?, ?, ?)
    `).run(id, data.name || '', data.color || '#409eff');

    return this.getById(id)!;
  },

  // 更新标签
  update(id: string, data: Partial<Tag>): Tag {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      values.push(data.name);
    }
    if (data.color !== undefined) {
      updates.push('color = ?');
      values.push(data.color);
    }

    if (updates.length > 0) {
      updates.push("updated_at = datetime('now')");
      values.push(id);
      db.prepare(`UPDATE tags SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }

    return this.getById(id)!;
  },

  // 删除标签
  delete(id: string): void {
    db.prepare('DELETE FROM tags WHERE id = ?').run(id);
  },

  // 批量删除
  batchDelete(ids: string[]): void {
    const placeholders = ids.map(() => '?').join(',');
    db.prepare(`DELETE FROM tags WHERE id IN (${placeholders})`).run(...ids);
  },
};
