import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.js';
import { uploadBooks, uploadCover } from '../middlewares/upload.js';
import { authController } from '../controllers/authController.js';
import { bookController } from '../controllers/bookController.js';
import { categoryController } from '../controllers/categoryController.js';
import { tagController } from '../controllers/tagController.js';
import { statisticsController } from '../controllers/statisticsController.js';
import type { AuthRequest } from '../types/index.js';

const router = Router();

// ==================== 认证相关 ====================
router.post('/admin/login', authController.login);
router.post('/admin/refresh-token', authController.refreshToken);

// 以下路由需要认证
router.use('/admin', authMiddleware as any);

router.get('/admin/profile', (req, res) => authController.getProfile(req as AuthRequest, res));
router.put('/admin/profile', (req, res) => authController.updateProfile(req as AuthRequest, res));
router.post('/admin/change-password', (req, res) => authController.changePassword(req as AuthRequest, res));
router.post('/admin/logout', (req, res) => authController.logout(req as AuthRequest, res));

// ==================== 电子书管理 ====================
router.get('/admin/books', bookController.getList);
router.get('/admin/books/:id', bookController.getById);
router.post('/admin/books', bookController.create);
router.put('/admin/books/:id', bookController.update);
router.delete('/admin/books/:id', bookController.delete);
router.post('/admin/books/batch-delete', bookController.batchDelete);
router.post('/admin/books/batch-update', bookController.batchUpdate);
router.patch('/admin/books/:id/status', bookController.updateStatus);
router.post('/admin/books/batch-status', bookController.batchUpdateStatus);
router.post('/admin/books/import', uploadBooks.array('files', 50), bookController.import);
router.post('/admin/books/:id/cover', uploadCover.single('cover'), bookController.uploadCover);
router.get('/admin/books/:id/download', (req, res) => bookController.download(req as AuthRequest, res));
router.post('/admin/books/export', bookController.export);

// ==================== 分类管理 ====================
router.get('/admin/categories', categoryController.getList);
router.get('/admin/categories/tree', categoryController.getTree);
router.get('/admin/categories/:id', categoryController.getById);
router.post('/admin/categories', categoryController.create);
router.put('/admin/categories/:id', categoryController.update);
router.delete('/admin/categories/:id', categoryController.delete);
router.post('/admin/categories/sort', categoryController.updateSort);

// ==================== 标签管理 ====================
router.get('/admin/tags', tagController.getList);
router.get('/admin/tags/:id', tagController.getById);
router.post('/admin/tags', tagController.create);
router.put('/admin/tags/:id', tagController.update);
router.delete('/admin/tags/:id', tagController.delete);
router.post('/admin/tags/batch-delete', tagController.batchDelete);

// ==================== 统计相关 ====================
router.get('/admin/statistics/overview', statisticsController.getOverview);
router.get('/admin/statistics/trends', statisticsController.getTrends);
router.get('/admin/statistics/ranking/downloads', statisticsController.getDownloadRanking);
router.get('/admin/statistics/ranking/views', statisticsController.getViewRanking);
router.post('/admin/statistics/export', statisticsController.exportReport);

export default router;
