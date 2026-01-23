/**
 * 复制特定依赖到 backend/node_modules
 * 某些包（如 mupdf）需要在 backend 目录下才能正常工作
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '..');
const rootNodeModules = path.join(rootDir, 'node_modules');
const backendNodeModules = path.join(rootDir, 'backend', 'node_modules');

// 需要复制到 backend/node_modules 的包
const packagesToCopy = ['mupdf', 'adm-zip'];

function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    console.log(`  源目录不存在: ${src}`);
    return false;
  }

  // 创建目标目录
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }

  return true;
}

console.log('正在复制依赖到 backend/node_modules...');

// 确保 backend/node_modules 存在
if (!fs.existsSync(backendNodeModules)) {
  fs.mkdirSync(backendNodeModules, { recursive: true });
}

for (const pkg of packagesToCopy) {
  const srcPath = path.join(rootNodeModules, pkg);
  const destPath = path.join(backendNodeModules, pkg);

  // 如果目标已存在，跳过
  if (fs.existsSync(destPath)) {
    console.log(`  ${pkg}: 已存在，跳过`);
    continue;
  }

  console.log(`  复制 ${pkg}...`);
  if (copyDir(srcPath, destPath)) {
    console.log(`  ${pkg}: 复制成功`);
  } else {
    console.log(`  ${pkg}: 复制失败（可能在 workspace 中已安装）`);
  }
}

console.log('依赖复制完成！');
