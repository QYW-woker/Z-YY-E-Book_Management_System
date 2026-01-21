import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/index.js';

// 确保上传目录存在
const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// 书籍文件上传配置
const bookStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(config.upload.dir, config.upload.booksDir);
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  },
});

// 封面文件上传配置
const coverStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(config.upload.dir, config.upload.coversDir);
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  },
});

// 书籍文件过滤
const bookFileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase().slice(1);
  if (config.upload.allowedFormats.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`不支持的文件格式: ${ext}`));
  }
};

// 图片文件过滤
const imageFileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('只支持 JPG/PNG/WebP 格式的图片'));
  }
};

// 书籍上传中间件
export const uploadBooks = multer({
  storage: bookStorage,
  fileFilter: bookFileFilter,
  limits: {
    fileSize: config.upload.maxFileSize,
  },
});

// 封面上传中间件
export const uploadCover = multer({
  storage: coverStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
});
