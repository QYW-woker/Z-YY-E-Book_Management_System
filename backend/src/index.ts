import express from 'express';
import cors from 'cors';
import path from 'path';
import { config } from './config/index.js';
import { initDatabase, closeDatabase } from './config/database.js';
import { adminService } from './services/adminService.js';
import { logger } from './utils/logger.js';
import { errorHandler } from './middlewares/errorHandler.js';
import routes from './routes/index.js';

const app = express();

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use('/uploads', express.static(path.join(config.upload.dir)));

// API 路由
app.use('/api', routes);

// 健康检查
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 错误处理
app.use(errorHandler);

// 初始化数据库
initDatabase();

// 初始化默认管理员
adminService.initDefaultAdmin(config.defaultAdmin.username, config.defaultAdmin.password);
logger.info(`Default admin: ${config.defaultAdmin.username} / ${config.defaultAdmin.password}`);

// 启动服务器
const server = app.listen(config.port, () => {
  logger.info(`Server is running on http://localhost:${config.port}`);
  logger.info(`Environment: ${config.nodeEnv}`);
});

// 优雅关闭
const gracefulShutdown = () => {
  logger.info('Shutting down gracefully...');
  server.close(() => {
    closeDatabase();
    logger.info('Server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
