import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/index.js';

/**
 * 从 PDF 文件提取首页作为封面图片
 * @param pdfPath PDF 文件的完整路径
 * @returns 封面路径（相对于 upload 目录）或 null
 */
export async function extractPdfCover(pdfPath: string): Promise<string | null> {
  console.log('[extractPdfCover] Starting extraction for:', pdfPath);
  try {
    // 动态导入 mupdf (ESM 模块)
    console.log('[extractPdfCover] Loading mupdf module...');
    const mupdf = await import('mupdf');
    console.log('[extractPdfCover] mupdf loaded successfully');

    // 检查文件是否存在
    if (!fs.existsSync(pdfPath)) {
      console.error('[extractPdfCover] PDF file does not exist:', pdfPath);
      return null;
    }

    // 读取 PDF 文件
    console.log('[extractPdfCover] Reading PDF file...');
    const pdfData = fs.readFileSync(pdfPath);
    console.log('[extractPdfCover] PDF file size:', pdfData.length, 'bytes');

    // 打开 PDF 文档
    console.log('[extractPdfCover] Opening PDF document...');
    const doc = mupdf.Document.openDocument(pdfData, 'application/pdf');
    console.log('[extractPdfCover] Document opened, pages:', doc.countPages());

    if (doc.countPages() === 0) {
      console.warn('[extractPdfCover] PDF has no pages:', pdfPath);
      return null;
    }

    // 加载第一页 (索引从 0 开始)
    console.log('[extractPdfCover] Loading first page...');
    const page = doc.loadPage(0);

    // 转换为像素图 (scale 1.5 获得较好清晰度)
    console.log('[extractPdfCover] Creating pixmap...');
    const scale = 1.5;
    const matrix = mupdf.Matrix.scale(scale, scale);
    const pixmap = page.toPixmap(matrix, mupdf.ColorSpace.DeviceRGB, false, true);
    console.log('[extractPdfCover] Pixmap created, size:', pixmap.width, 'x', pixmap.height);

    // 转换为 PNG
    console.log('[extractPdfCover] Converting to PNG...');
    const pngData = pixmap.asPNG();
    console.log('[extractPdfCover] PNG data size:', pngData.length, 'bytes');

    // 确保封面目录存在
    const coverDir = path.join(config.upload.dir, config.upload.coversDir);
    console.log('[extractPdfCover] Cover directory:', coverDir);
    if (!fs.existsSync(coverDir)) {
      fs.mkdirSync(coverDir, { recursive: true });
      console.log('[extractPdfCover] Created cover directory');
    }

    // 生成封面文件名并保存
    const coverFilename = `${uuidv4()}.png`;
    const coverFullPath = path.join(coverDir, coverFilename);
    console.log('[extractPdfCover] Saving cover to:', coverFullPath);
    fs.writeFileSync(coverFullPath, pngData);
    console.log('[extractPdfCover] Cover saved successfully');

    // 返回相对路径
    const relativePath = `${config.upload.coversDir}/${coverFilename}`;
    console.log('[extractPdfCover] Returning relative path:', relativePath);
    return relativePath;
  } catch (err) {
    console.error('Failed to extract PDF cover:', err);
    return null;
  }
}
