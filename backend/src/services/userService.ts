import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../config/database.js';
import { config } from '../config/index.js';
import type { User, UserJwtPayload, PaginatedData } from '../types/index.js';

export const userService = {
  // 注册用户
  register(data: { username: string; password: string; email?: string; phone?: string }): User {
    const userId = uuidv4();
    const hashedPassword = bcrypt.hashSync(data.password, 10);

    db.prepare(`
      INSERT INTO users (user_id, username, password, email, phone, nickname)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      data.username,
      hashedPassword,
      data.email || null,
      data.phone || null,
      data.username
    );

    return this.getById(userId)!;
  },

  // 通过ID获取用户
  getById(userId: string): User | undefined {
    return db.prepare('SELECT * FROM users WHERE user_id = ?').get(userId) as User | undefined;
  },

  // 通过用户名获取用户
  getByUsername(username: string): User | undefined {
    return db.prepare('SELECT * FROM users WHERE username = ?').get(username) as User | undefined;
  },

  // 通过邮箱获取用户
  getByEmail(email: string): User | undefined {
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email) as User | undefined;
  },

  // 通过手机获取用户
  getByPhone(phone: string): User | undefined {
    return db.prepare('SELECT * FROM users WHERE phone = ?').get(phone) as User | undefined;
  },

  // 通过账户（用户名/邮箱/手机）获取用户
  getByAccount(account: string): User | undefined {
    return db.prepare(`
      SELECT * FROM users
      WHERE username = ? OR email = ? OR phone = ?
    `).get(account, account, account) as User | undefined;
  },

  // 验证密码
  verifyPassword(user: User, password: string): boolean {
    return bcrypt.compareSync(password, user.password);
  },

  // 生成JWT Token
  generateToken(user: User): { token: string; refresh_token: string; expires_in: number } {
    const payload: UserJwtPayload = {
      userId: user.user_id,
      username: user.username,
      type: 'user',
    };

    const token = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn as string,
    } as jwt.SignOptions);

    const refreshToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.refreshExpiresIn as string,
    } as jwt.SignOptions);

    return {
      token,
      refresh_token: refreshToken,
      expires_in: 7 * 24 * 60 * 60, // 7天（秒）
    };
  },

  // 验证Token
  verifyToken(token: string): UserJwtPayload | null {
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as UserJwtPayload;
      if (decoded.type !== 'user') return null;
      return decoded;
    } catch {
      return null;
    }
  },

  // 更新最后登录时间
  updateLastLogin(userId: string): void {
    db.prepare("UPDATE users SET last_login_at = datetime('now') WHERE user_id = ?").run(userId);
  },

  // 更新用户资料
  updateProfile(userId: string, data: { nickname?: string; avatar?: string; email?: string; phone?: string }): User {
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
    if (data.email !== undefined) {
      updates.push('email = ?');
      values.push(data.email || null);
    }
    if (data.phone !== undefined) {
      updates.push('phone = ?');
      values.push(data.phone || null);
    }

    if (updates.length > 0) {
      updates.push("updated_at = datetime('now')");
      values.push(userId);
      db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE user_id = ?`).run(...values);
    }

    return this.getById(userId)!;
  },

  // 修改密码
  changePassword(userId: string, newPassword: string): void {
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    db.prepare("UPDATE users SET password = ?, updated_at = datetime('now') WHERE user_id = ?").run(hashedPassword, userId);
  },

  // 检查用户名是否存在
  isUsernameExists(username: string): boolean {
    const user = this.getByUsername(username);
    return !!user;
  },

  // 检查邮箱是否存在
  isEmailExists(email: string): boolean {
    const user = this.getByEmail(email);
    return !!user;
  },

  // 检查手机是否存在
  isPhoneExists(phone: string): boolean {
    const user = this.getByPhone(phone);
    return !!user;
  },

  // 获取用户浏览历史
  getViewHistory(userId: string, page = 1, pageSize = 20): PaginatedData<any> {
    const offset = (page - 1) * pageSize;

    const { total } = db.prepare(`
      SELECT COUNT(DISTINCT book_id) as total FROM user_view_history WHERE user_id = ?
    `).get(userId) as { total: number };

    // 获取最近的浏览记录（去重，取每本书最后一次浏览）
    const list = db.prepare(`
      SELECT uvh.*, b.title, b.author, b.cover_path, b.format
      FROM user_view_history uvh
      INNER JOIN books b ON b.book_id = uvh.book_id
      WHERE uvh.user_id = ? AND uvh.id IN (
        SELECT MAX(id) FROM user_view_history WHERE user_id = ? GROUP BY book_id
      )
      ORDER BY uvh.view_time DESC
      LIMIT ? OFFSET ?
    `).all(userId, userId, pageSize, offset);

    return {
      list,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  },

  // 记录浏览历史
  addViewHistory(userId: string, bookId: string, duration = 0): void {
    db.prepare(`
      INSERT INTO user_view_history (user_id, book_id, duration)
      VALUES (?, ?, ?)
    `).run(userId, bookId, duration);
  },

  // 获取用户下载记录
  getDownloadHistory(userId: string, page = 1, pageSize = 20): PaginatedData<any> {
    const offset = (page - 1) * pageSize;

    const { total } = db.prepare(`
      SELECT COUNT(*) as total FROM user_downloads WHERE user_id = ?
    `).get(userId) as { total: number };

    const list = db.prepare(`
      SELECT ud.*, b.title, b.author, b.cover_path, b.format, b.file_size
      FROM user_downloads ud
      INNER JOIN books b ON b.book_id = ud.book_id
      WHERE ud.user_id = ?
      ORDER BY ud.download_time DESC
      LIMIT ? OFFSET ?
    `).all(userId, pageSize, offset);

    return {
      list,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  },

  // 记录下载
  addDownloadRecord(userId: string, bookId: string, ip: string, userAgent: string): void {
    db.prepare(`
      INSERT INTO user_downloads (user_id, book_id, ip, user_agent)
      VALUES (?, ?, ?, ?)
    `).run(userId, bookId, ip, userAgent);
  },

  // 获取用户收藏
  getFavorites(userId: string, page = 1, pageSize = 20): PaginatedData<any> {
    const offset = (page - 1) * pageSize;

    const { total } = db.prepare(`
      SELECT COUNT(*) as total FROM user_favorites WHERE user_id = ?
    `).get(userId) as { total: number };

    const list = db.prepare(`
      SELECT uf.*, b.title, b.author, b.cover_path, b.format, b.description
      FROM user_favorites uf
      INNER JOIN books b ON b.book_id = uf.book_id
      WHERE uf.user_id = ?
      ORDER BY uf.created_at DESC
      LIMIT ? OFFSET ?
    `).all(userId, pageSize, offset);

    return {
      list,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  },

  // 添加收藏
  addFavorite(userId: string, bookId: string): boolean {
    try {
      db.prepare(`
        INSERT INTO user_favorites (user_id, book_id)
        VALUES (?, ?)
      `).run(userId, bookId);
      return true;
    } catch {
      return false; // 可能是已存在
    }
  },

  // 取消收藏
  removeFavorite(userId: string, bookId: string): void {
    db.prepare('DELETE FROM user_favorites WHERE user_id = ? AND book_id = ?').run(userId, bookId);
  },

  // 检查是否已收藏
  isFavorited(userId: string, bookId: string): boolean {
    const result = db.prepare(`
      SELECT 1 FROM user_favorites WHERE user_id = ? AND book_id = ?
    `).get(userId, bookId);
    return !!result;
  },

  // 获取阅读进度
  getReadingProgress(userId: string, bookId: string): any {
    return db.prepare(`
      SELECT * FROM reading_progress WHERE user_id = ? AND book_id = ?
    `).get(userId, bookId);
  },

  // 保存阅读进度
  saveReadingProgress(userId: string, bookId: string, progress: number, currentPage: number, totalPages: number): void {
    const existing = this.getReadingProgress(userId, bookId);
    if (existing) {
      db.prepare(`
        UPDATE reading_progress
        SET progress = ?, current_page = ?, total_pages = ?, last_read_at = datetime('now')
        WHERE user_id = ? AND book_id = ?
      `).run(progress, currentPage, totalPages, userId, bookId);
    } else {
      db.prepare(`
        INSERT INTO reading_progress (user_id, book_id, progress, current_page, total_pages)
        VALUES (?, ?, ?, ?, ?)
      `).run(userId, bookId, progress, currentPage, totalPages);
    }
  },

  // 清除浏览历史
  clearViewHistory(userId: string): void {
    db.prepare('DELETE FROM user_view_history WHERE user_id = ?').run(userId);
  },
};
