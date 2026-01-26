import { Router } from 'express';
import { userAuthMiddleware, optionalUserAuthMiddleware } from '../middlewares/userAuth.js';
import { readerUserController } from '../controllers/readerUserController.js';
import { readerBookController } from '../controllers/readerBookController.js';
import type { UserAuthRequest } from '../types/index.js';

const router = Router();

// ==================== 用户认证（无需登录） ====================
router.post('/user/register', readerUserController.register);
router.post('/user/login', readerUserController.login);
router.post('/user/refresh-token', readerUserController.refreshToken);

// ==================== 用户相关（需要登录） ====================
router.get('/user/profile', userAuthMiddleware as any, (req, res) => readerUserController.getProfile(req as UserAuthRequest, res));
router.put('/user/profile', userAuthMiddleware as any, (req, res) => readerUserController.updateProfile(req as UserAuthRequest, res));
router.post('/user/change-password', userAuthMiddleware as any, (req, res) => readerUserController.changePassword(req as UserAuthRequest, res));
router.post('/user/logout', userAuthMiddleware as any, (req, res) => readerUserController.logout(req as UserAuthRequest, res));

// 浏览历史
router.get('/user/view-history', userAuthMiddleware as any, (req, res) => readerUserController.getViewHistory(req as UserAuthRequest, res));
router.post('/user/view-log', optionalUserAuthMiddleware as any, (req, res) => readerUserController.addViewLog(req as UserAuthRequest, res));
router.delete('/user/view-history', userAuthMiddleware as any, (req, res) => readerUserController.clearViewHistory(req as UserAuthRequest, res));

// 下载记录
router.get('/user/download-history', userAuthMiddleware as any, (req, res) => readerUserController.getDownloadHistory(req as UserAuthRequest, res));

// 收藏
router.get('/user/favorites', userAuthMiddleware as any, (req, res) => readerUserController.getFavorites(req as UserAuthRequest, res));
router.post('/user/favorites', userAuthMiddleware as any, (req, res) => readerUserController.addFavorite(req as UserAuthRequest, res));
router.delete('/user/favorites/:book_id', userAuthMiddleware as any, (req, res) => readerUserController.removeFavorite(req as UserAuthRequest, res));
router.get('/user/favorites/:book_id/check', optionalUserAuthMiddleware as any, (req, res) => readerUserController.checkFavorite(req as UserAuthRequest, res));

// 阅读进度
router.get('/user/reading-progress/:book_id', userAuthMiddleware as any, (req, res) => readerUserController.getReadingProgress(req as UserAuthRequest, res));
router.post('/user/reading-progress/:book_id', userAuthMiddleware as any, (req, res) => readerUserController.saveReadingProgress(req as UserAuthRequest, res));

// ==================== 书籍相关（公开接口，可选登录） ====================
router.get('/books', optionalUserAuthMiddleware as any, readerBookController.getBooks);
router.get('/books/search', optionalUserAuthMiddleware as any, readerBookController.searchBooks);
router.get('/books/hot', readerBookController.getHotBooks);
router.get('/books/newest', readerBookController.getNewestBooks);
router.get('/books/recommended', readerBookController.getRecommendedBooks);
router.get('/books/hot-keywords', readerBookController.getHotSearchKeywords);
router.get('/books/:id', optionalUserAuthMiddleware as any, readerBookController.getBookDetail);
router.get('/books/:id/related', readerBookController.getRelatedBooks);
router.get('/books/:id/download', optionalUserAuthMiddleware as any, (req, res) => readerBookController.getDownloadUrl(req as UserAuthRequest, res));
router.get('/books/:id/file', optionalUserAuthMiddleware as any, readerBookController.downloadFile);
router.get('/books/:id/read', readerBookController.getReadFile);

// ==================== 分类相关（公开接口） ====================
router.get('/categories', readerBookController.getCategories);
router.get('/categories/:id/books', readerBookController.getCategoryBooks);

// ==================== 标签相关（公开接口） ====================
router.get('/tags', readerBookController.getTags);

export default router;
