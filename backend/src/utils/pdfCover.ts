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
  try {
    // 动态导入 mupdf (ESM 模块)
    const mupdf = await import('mupdf');

    // 读取 PDF 文件
    const pdfData = fs.readFileSync(pdfPath);

    // 打开 PDF 文档
    const doc = mupdf.Document.openDocument(pdfData, 'application/pdf');

    if (doc.countPages() === 0) {
      console.warn('PDF has no pages:', pdfPath);
      return null;
    }

    // 加载第一页 (索引从 0 开始)
    const page = doc.loadPage(0);

    // 转换为像素图 (scale 1.5 获得较好清晰度)
    const scale = 1.5;
    const matrix = mupdf.Matrix.scale(scale, scale);
    const pixmap = page.toPixmap(matrix, mupdf.ColorSpace.DeviceRGB, false, true);

    // 转换为 PNG
    const pngData = pixmap.asPNG();

    // 确保封面目录存在
    const coverDir = path.join(config.upload.dir, config.upload.coversDir);
    if (!fs.existsSync(coverDir)) {
      fs.mkdirSync(coverDir, { recursive: true });
    }

    // 生成封面文件名并保存
    const coverFilename = `${uuidv4()}.png`;
    const coverFullPath = path.join(coverDir, coverFilename);
    fs.writeFileSync(coverFullPath, pngData);

    // 返回相对路径
    return `${config.upload.coversDir}/${coverFilename}`;
  } catch (err) {
    console.error('Failed to extract PDF cover:', err);
    return null;
  }
}
