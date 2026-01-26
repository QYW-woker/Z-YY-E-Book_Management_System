import type { Request, Response } from 'express';
import { userService } from '../services/userService.js';
import type { UserAuthRequest } from '../types/index.js';

export const readerUserController = {
  // 用户注册
  register(req: Request, res: Response): void {
    try {
      const { username, password, email, phone } = req.body;

      // 验证必填字段
      if (!username || !password) {
        res.status(400).json({
          code: 400,
          message: '用户名和密码不能为空',
          data: null,
        });
        return;
      }

      // 验证用户名格式（4-20位字母数字下划线）
      if (!/^[a-zA-Z0-9_]{4,20}$/.test(username)) {
        res.status(400).json({
          code: 400,
          message: '用户名必须为4-20位字母、数字或下划线',
          data: null,
        });
        return;
      }

      // 验证密码长度
      if (password.length < 6) {
        res.status(400).json({
          code: 400,
          message: '密码长度不能少于6位',
          data: null,
        });
        return;
      }

      // 检查用户名是否已存在
      if (userService.isUsernameExists(username)) {
        res.status(400).json({
          code: 400,
          message: '用户名已被注册',
          data: null,
        });
        return;
      }

      // 检查邮箱是否已存在
      if (email && userService.isEmailExists(email)) {
        res.status(400).json({
          code: 400,
          message: '邮箱已被注册',
          data: null,
        });
        return;
      }

      // 检查手机是否已存在
      if (phone && userService.isPhoneExists(phone)) {
        res.status(400).json({
          code: 400,
          message: '手机号已被注册',
          data: null,
        });
        return;
      }

      // 创建用户
      const user = userService.register({ username, password, email, phone });

      // 生成Token
      const tokens = userService.generateToken(user);

      res.json({
        code: 0,
        message: '注册成功',
        data: {
          ...tokens,
          user: {
            user_id: user.user_id,
            username: user.username,
            nickname: user.nickname,
            email: user.email,
            phone: user.phone,
            avatar: user.avatar,
            created_at: user.created_at,
          },
        },
      });
    } catch (error: any) {
      res.status(500).json({
        code: 500,
        message: error.message || '注册失败',
        data: null,
      });
    }
  },

  // 用户登录
  login(req: Request, res: Response): void {
    try {
      const { account, password } = req.body;

      if (!account || !password) {
        res.status(400).json({
          code: 400,
          message: '账户和密码不能为空',
          data: null,
        });
        return;
      }

      // 查找用户
      const user = userService.getByAccount(account);
      if (!user) {
        res.status(401).json({
          code: 401,
          message: '账户不存在',
          data: null,
        });
        return;
      }

      // 检查账户状态
      if (user.status !== 'active') {
        res.status(401).json({
          code: 401,
          message: '账户已被禁用',
          data: null,
        });
        return;
      }

      // 验证密码
      if (!userService.verifyPassword(user, password)) {
        res.status(401).json({
          code: 401,
          message: '密码错误',
          data: null,
        });
        return;
      }

      // 更新最后登录时间
      userService.updateLastLogin(user.user_id);

      // 生成Token
      const tokens = userService.generateToken(user);

      res.json({
        code: 0,
        message: '登录成功',
        data: {
          ...tokens,
          user: {
            user_id: user.user_id,
            username: user.username,
            nickname: user.nickname,
            email: user.email,
            phone: user.phone,
            avatar: user.avatar,
            created_at: user.created_at,
            last_login_at: user.last_login_at,
          },
        },
      });
    } catch (error: any) {
      res.status(500).json({
        code: 500,
        message: error.message || '登录失败',
        data: null,
      });
    }
  },

  // 刷新Token
  refreshToken(req: Request, res: Response): void {
    try {
      const { refresh_token } = req.body;

      if (!refresh_token) {
        res.status(400).json({
          code: 400,
          message: 'refresh_token不能为空',
          data: null,
        });
        return;
      }

      const payload = userService.verifyToken(refresh_token);
      if (!payload) {
        res.status(401).json({
          code: 401,
          message: 'refresh_token无效或已过期',
          data: null,
        });
        return;
      }

      const user = userService.getById(payload.userId);
      if (!user || user.status !== 'active') {
        res.status(401).json({
          code: 401,
          message: '用户不存在或已被禁用',
          data: null,
        });
        return;
      }

      const tokens = userService.generateToken(user);

      res.json({
        code: 0,
        message: '刷新成功',
        data: tokens,
      });
    } catch (error: any) {
      res.status(500).json({
        code: 500,
        message: error.message || '刷新失败',
        data: null,
      });
    }
  },

  // 获取个人资料
  getProfile(req: UserAuthRequest, res: Response): void {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          code: 401,
          message: '未登录',
          data: null,
        });
        return;
      }

      const user = userService.getById(userId);
      if (!user) {
        res.status(404).json({
          code: 404,
          message: '用户不存在',
          data: null,
        });
        return;
      }

      res.json({
        code: 0,
        message: '获取成功',
        data: {
          user_id: user.user_id,
          username: user.username,
          nickname: user.nickname,
          email: user.email,
          phone: user.phone,
          avatar: user.avatar,
          created_at: user.created_at,
          last_login_at: user.last_login_at,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        code: 500,
        message: error.message || '获取失败',
        data: null,
      });
    }
  },

  // 更新个人资料
  updateProfile(req: UserAuthRequest, res: Response): void {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          code: 401,
          message: '未登录',
          data: null,
        });
        return;
      }

      const { nickname, avatar, email, phone } = req.body;

      // 检查邮箱是否被其他用户占用
      if (email) {
        const existingUser = userService.getByEmail(email);
        if (existingUser && existingUser.user_id !== userId) {
          res.status(400).json({
            code: 400,
            message: '邮箱已被其他用户使用',
            data: null,
          });
          return;
        }
      }

      // 检查手机是否被其他用户占用
      if (phone) {
        const existingUser = userService.getByPhone(phone);
        if (existingUser && existingUser.user_id !== userId) {
          res.status(400).json({
            code: 400,
            message: '手机号已被其他用户使用',
            data: null,
          });
          return;
        }
      }

      const user = userService.updateProfile(userId, { nickname, avatar, email, phone });

      res.json({
        code: 0,
        message: '更新成功',
        data: {
          user_id: user.user_id,
          username: user.username,
          nickname: user.nickname,
          email: user.email,
          phone: user.phone,
          avatar: user.avatar,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        code: 500,
        message: error.message || '更新失败',
        data: null,
      });
    }
  },

  // 修改密码
  changePassword(req: UserAuthRequest, res: Response): void {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          code: 401,
          message: '未登录',
          data: null,
        });
        return;
      }

      const { old_password, new_password } = req.body;

      if (!old_password || !new_password) {
        res.status(400).json({
          code: 400,
          message: '旧密码和新密码不能为空',
          data: null,
        });
        return;
      }

      if (new_password.length < 6) {
        res.status(400).json({
          code: 400,
          message: '新密码长度不能少于6位',
          data: null,
        });
        return;
      }

      const user = userService.getById(userId);
      if (!user) {
        res.status(404).json({
          code: 404,
          message: '用户不存在',
          data: null,
        });
        return;
      }

      // 验证旧密码
      if (!userService.verifyPassword(user, old_password)) {
        res.status(400).json({
          code: 400,
          message: '旧密码错误',
          data: null,
        });
        return;
      }

      userService.changePassword(userId, new_password);

      res.json({
        code: 0,
        message: '密码修改成功',
        data: null,
      });
    } catch (error: any) {
      res.status(500).json({
        code: 500,
        message: error.message || '修改失败',
        data: null,
      });
    }
  },

  // 退出登录
  logout(req: UserAuthRequest, res: Response): void {
    // JWT无状态，客户端删除token即可
    res.json({
      code: 0,
      message: '退出成功',
      data: null,
    });
  },

  // 获取浏览历史
  getViewHistory(req: UserAuthRequest, res: Response): void {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          code: 401,
          message: '未登录',
          data: null,
        });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.page_size as string) || 20;

      const data = userService.getViewHistory(userId, page, pageSize);

      res.json({
        code: 0,
        message: '获取成功',
        data,
      });
    } catch (error: any) {
      res.status(500).json({
        code: 500,
        message: error.message || '获取失败',
        data: null,
      });
    }
  },

  // 记录浏览
  addViewLog(req: UserAuthRequest, res: Response): void {
    try {
      const userId = req.user?.userId;
      const { book_id, duration } = req.body;

      if (!book_id) {
        res.status(400).json({
          code: 400,
          message: 'book_id不能为空',
          data: null,
        });
        return;
      }

      if (userId) {
        userService.addViewHistory(userId, book_id, duration || 0);
      }

      res.json({
        code: 0,
        message: '记录成功',
        data: null,
      });
    } catch (error: any) {
      res.status(500).json({
        code: 500,
        message: error.message || '记录失败',
        data: null,
      });
    }
  },

  // 获取下载记录
  getDownloadHistory(req: UserAuthRequest, res: Response): void {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          code: 401,
          message: '未登录',
          data: null,
        });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.page_size as string) || 20;

      const data = userService.getDownloadHistory(userId, page, pageSize);

      res.json({
        code: 0,
        message: '获取成功',
        data,
      });
    } catch (error: any) {
      res.status(500).json({
        code: 500,
        message: error.message || '获取失败',
        data: null,
      });
    }
  },

  // 获取收藏列表
  getFavorites(req: UserAuthRequest, res: Response): void {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          code: 401,
          message: '未登录',
          data: null,
        });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.page_size as string) || 20;

      const data = userService.getFavorites(userId, page, pageSize);

      res.json({
        code: 0,
        message: '获取成功',
        data,
      });
    } catch (error: any) {
      res.status(500).json({
        code: 500,
        message: error.message || '获取失败',
        data: null,
      });
    }
  },

  // 添加收藏
  addFavorite(req: UserAuthRequest, res: Response): void {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          code: 401,
          message: '未登录',
          data: null,
        });
        return;
      }

      const { book_id } = req.body;

      if (!book_id) {
        res.status(400).json({
          code: 400,
          message: 'book_id不能为空',
          data: null,
        });
        return;
      }

      const success = userService.addFavorite(userId, book_id);

      if (!success) {
        res.json({
          code: 0,
          message: '已收藏',
          data: null,
        });
        return;
      }

      res.json({
        code: 0,
        message: '收藏成功',
        data: null,
      });
    } catch (error: any) {
      res.status(500).json({
        code: 500,
        message: error.message || '收藏失败',
        data: null,
      });
    }
  },

  // 取消收藏
  removeFavorite(req: UserAuthRequest, res: Response): void {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          code: 401,
          message: '未登录',
          data: null,
        });
        return;
      }

      const { book_id } = req.params;

      userService.removeFavorite(userId, book_id);

      res.json({
        code: 0,
        message: '取消收藏成功',
        data: null,
      });
    } catch (error: any) {
      res.status(500).json({
        code: 500,
        message: error.message || '取消失败',
        data: null,
      });
    }
  },

  // 检查是否已收藏
  checkFavorite(req: UserAuthRequest, res: Response): void {
    try {
      const userId = req.user?.userId;
      const { book_id } = req.params;

      const isFavorited = userId ? userService.isFavorited(userId, book_id) : false;

      res.json({
        code: 0,
        message: '获取成功',
        data: { is_favorited: isFavorited },
      });
    } catch (error: any) {
      res.status(500).json({
        code: 500,
        message: error.message || '获取失败',
        data: null,
      });
    }
  },

  // 获取阅读进度
  getReadingProgress(req: UserAuthRequest, res: Response): void {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          code: 401,
          message: '未登录',
          data: null,
        });
        return;
      }

      const { book_id } = req.params;

      const progress = userService.getReadingProgress(userId, book_id);

      res.json({
        code: 0,
        message: '获取成功',
        data: progress || { progress: 0, current_page: 0, total_pages: 0 },
      });
    } catch (error: any) {
      res.status(500).json({
        code: 500,
        message: error.message || '获取失败',
        data: null,
      });
    }
  },

  // 保存阅读进度
  saveReadingProgress(req: UserAuthRequest, res: Response): void {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          code: 401,
          message: '未登录',
          data: null,
        });
        return;
      }

      const { book_id } = req.params;
      const { progress, current_page, total_pages } = req.body;

      userService.saveReadingProgress(userId, book_id, progress || 0, current_page || 0, total_pages || 0);

      res.json({
        code: 0,
        message: '保存成功',
        data: null,
      });
    } catch (error: any) {
      res.status(500).json({
        code: 500,
        message: error.message || '保存失败',
        data: null,
      });
    }
  },

  // 清除浏览历史
  clearViewHistory(req: UserAuthRequest, res: Response): void {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          code: 401,
          message: '未登录',
          data: null,
        });
        return;
      }

      userService.clearViewHistory(userId);

      res.json({
        code: 0,
        message: '清除成功',
        data: null,
      });
    } catch (error: any) {
      res.status(500).json({
        code: 500,
        message: error.message || '清除失败',
        data: null,
      });
    }
  },
};
