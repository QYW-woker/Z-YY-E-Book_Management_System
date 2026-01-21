import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database.js';
import type { Admin } from '../types/index.js';

export const adminService = {
  // 通过用户名查找管理员
  findByUsername(username: string): Admin | undefined {
    return db.prepare('SELECT * FROM admins WHERE username = ?').get(username) as Admin | undefined;
  },

  // 通过ID查找管理员
  findById(id: string): Admin | undefined {
    return db.prepare('SELECT * FROM admins WHERE id = ?').get(id) as Admin | undefined;
  },

  // 创建管理员
  create(data: {
    username: string;
    password: string;
    nickname?: string;
    role?: 'super_admin' | 'editor';
  }): Admin {
    const id = uuidv4();
    const hashedPassword = bcrypt.hashSync(data.password, 10);

    db.prepare(`
      INSERT INTO admins (id, username, password, nickname, role)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, data.username, hashedPassword, data.nickname || '', data.role || 'editor');

    return this.findById(id)!;
  },

  // 验证密码
  verifyPassword(password: string, hashedPassword: string): boolean {
    return bcrypt.compareSync(password, hashedPassword);
  },

  // 更新最后登录时间
  updateLastLogin(id: string): void {
    db.prepare(`
      UPDATE admins SET last_login_at = datetime('now'), updated_at = datetime('now')
      WHERE id = ?
    `).run(id);
  },

  // 更新管理员信息
  update(id: string, data: Partial<Admin>): Admin {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.nickname !== undefined) {
      updates.push('nickname = ?');
      values.push(data.nickname);
    }
    if (data.avatar !== undefined) {
      updates.push('avatar = ?');
      values.push(data.avatar);
    }

    if (updates.length > 0) {
      updates.push("updated_at = datetime('now')");
      values.push(id);
      db.prepare(`UPDATE admins SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }

    return this.findById(id)!;
  },

  // 修改密码
  changePassword(id: string, newPassword: string): void {
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    db.prepare(`
      UPDATE admins SET password = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(hashedPassword, id);
  },

  // 初始化默认管理员
  initDefaultAdmin(username: string, password: string): void {
    const existing = this.findByUsername(username);
    if (!existing) {
      this.create({
        username,
        password,
        nickname: '超级管理员',
        role: 'super_admin',
      });
    }
  },
};
