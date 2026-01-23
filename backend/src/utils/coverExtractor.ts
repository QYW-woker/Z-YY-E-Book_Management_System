import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import AdmZip from 'adm-zip';
import { config } from '../config/index.js';

/**
 * 从EPUB文件提取封面
 * EPUB是一个ZIP压缩包，包含OPF元数据文件和图片资源
 */
export async function extractEpubCover(epubPath: string): Promise<Buffer | null> {
  console.log('[extractEpubCover] Starting extraction for:', epubPath);

  try {
    const zip = new AdmZip(epubPath);
    const entries = zip.getEntries();

    // 1. 首先尝试从container.xml找到OPF文件
    const containerEntry = entries.find(e => e.entryName.endsWith('container.xml'));
    let opfPath = '';

    if (containerEntry) {
      const containerContent = containerEntry.getData().toString('utf8');
      const opfMatch = containerContent.match(/full-path="([^"]+\.opf)"/i);
      if (opfMatch) {
        opfPath = opfMatch[1];
        console.log('[extractEpubCover] Found OPF path:', opfPath);
      }
    }

    // 2. 如果没找到，搜索.opf文件
    if (!opfPath) {
      const opfEntry = entries.find(e => e.entryName.endsWith('.opf'));
      if (opfEntry) {
        opfPath = opfEntry.entryName;
        console.log('[extractEpubCover] Found OPF by extension:', opfPath);
      }
    }

    let coverImagePath = '';
    const opfDir = opfPath ? path.dirname(opfPath) : '';

    // 3. 解析OPF文件查找封面引用
    if (opfPath) {
      const opfEntry = entries.find(e => e.entryName === opfPath);
      if (opfEntry) {
        const opfContent = opfEntry.getData().toString('utf8');

        // 查找cover meta标签
        const coverIdMatch = opfContent.match(/<meta[^>]*name="cover"[^>]*content="([^"]+)"/i) ||
                            opfContent.match(/<meta[^>]*content="([^"]+)"[^>]*name="cover"/i);

        if (coverIdMatch) {
          const coverId = coverIdMatch[1];
          console.log('[extractEpubCover] Cover ID from meta:', coverId);

          // 查找manifest中对应id的item
          const itemRegex = new RegExp(`<item[^>]*id="${coverId}"[^>]*href="([^"]+)"`, 'i');
          const itemMatch = opfContent.match(itemRegex);

          if (itemMatch) {
            coverImagePath = itemMatch[1];
            console.log('[extractEpubCover] Cover href from manifest:', coverImagePath);
          }
        }

        // 如果没找到，查找properties="cover-image"的item
        if (!coverImagePath) {
          const coverImageMatch = opfContent.match(/<item[^>]*properties="[^"]*cover-image[^"]*"[^>]*href="([^"]+)"/i) ||
                                 opfContent.match(/<item[^>]*href="([^"]+)"[^>]*properties="[^"]*cover-image[^"]*"/i);
          if (coverImageMatch) {
            coverImagePath = coverImageMatch[1];
            console.log('[extractEpubCover] Cover from properties:', coverImagePath);
          }
        }

        // 查找id包含cover的图片item
        if (!coverImagePath) {
          const coverItemMatch = opfContent.match(/<item[^>]*id="[^"]*cover[^"]*"[^>]*href="([^"]+\.(jpg|jpeg|png|gif))"/i);
          if (coverItemMatch) {
            coverImagePath = coverItemMatch[1];
            console.log('[extractEpubCover] Cover from id pattern:', coverImagePath);
          }
        }
      }
    }

    // 4. 如果OPF中没找到，按常见命名模式搜索
    if (!coverImagePath) {
      const coverPatterns = [
        /cover\.(jpg|jpeg|png|gif)$/i,
        /cover[-_]?image\.(jpg|jpeg|png|gif)$/i,
        /^images\/cover\.(jpg|jpeg|png|gif)$/i,
        /^OEBPS\/images\/cover\.(jpg|jpeg|png|gif)$/i,
        /^OEBPS\/cover\.(jpg|jpeg|png|gif)$/i,
      ];

      for (const pattern of coverPatterns) {
        const found = entries.find(e => pattern.test(e.entryName));
        if (found) {
          coverImagePath = found.entryName;
          console.log('[extractEpubCover] Cover from pattern:', coverImagePath);
          break;
        }
      }
    }

    // 5. 构建完整路径并提取图片
    if (coverImagePath) {
      // 处理相对路径
      let fullCoverPath = coverImagePath;
      if (opfDir && !coverImagePath.startsWith('/') && !entries.find(e => e.entryName === coverImagePath)) {
        fullCoverPath = path.join(opfDir, coverImagePath).replace(/\\/g, '/');
      }

      console.log('[extractEpubCover] Looking for cover at:', fullCoverPath);

      const coverEntry = entries.find(e =>
        e.entryName === fullCoverPath ||
        e.entryName === coverImagePath ||
        e.entryName.endsWith('/' + coverImagePath)
      );

      if (coverEntry) {
        console.log('[extractEpubCover] Found cover entry:', coverEntry.entryName);
        return coverEntry.getData();
      }
    }

    // 6. 最后尝试：找任何看起来像封面的大图片
    const imageEntries = entries.filter(e =>
      /\.(jpg|jpeg|png|gif)$/i.test(e.entryName) &&
      !e.entryName.includes('logo') &&
      !e.entryName.includes('icon')
    );

    if (imageEntries.length > 0) {
      // 按文件大小排序，取最大的（通常是封面）
      imageEntries.sort((a, b) => b.header.size - a.header.size);
      console.log('[extractEpubCover] Using largest image:', imageEntries[0].entryName);
      return imageEntries[0].getData();
    }

    console.log('[extractEpubCover] No cover found');
    return null;
  } catch (err) {
    console.error('[extractEpubCover] Error:', err);
    return null;
  }
}

/**
 * 从MOBI文件提取封面
 * MOBI格式使用PalmDOC结构，封面存储在EXTH记录中
 */
export async function extractMobiCover(mobiPath: string): Promise<Buffer | null> {
  console.log('[extractMobiCover] Starting extraction for:', mobiPath);

  try {
    const data = fs.readFileSync(mobiPath);

    // PalmDOC header check
    const palmMagic = data.toString('ascii', 60, 68);
    if (palmMagic !== 'BOOKMOBI' && palmMagic !== 'TEXtREAd') {
      console.log('[extractMobiCover] Not a valid MOBI file, magic:', palmMagic);
      // 尝试作为AZW3处理
      return extractAzw3Cover(mobiPath);
    }

    // 读取PDB header获取记录数
    const numRecords = data.readUInt16BE(76);
    console.log('[extractMobiCover] Number of records:', numRecords);

    if (numRecords === 0) return null;

    // 读取记录偏移表
    const recordOffsets: number[] = [];
    for (let i = 0; i < numRecords; i++) {
      const offset = data.readUInt32BE(78 + i * 8);
      recordOffsets.push(offset);
    }

    // 第一个记录包含MOBI header
    const record0Offset = recordOffsets[0];

    // 检查MOBI header
    const mobiHeaderOffset = record0Offset + 16;
    const mobiMagic = data.toString('ascii', mobiHeaderOffset, mobiHeaderOffset + 4);

    if (mobiMagic !== 'MOBI') {
      console.log('[extractMobiCover] MOBI header not found');
      return null;
    }

    // 读取MOBI header信息
    const mobiHeaderLength = data.readUInt32BE(mobiHeaderOffset + 4);
    const exthFlags = data.readUInt32BE(mobiHeaderOffset + 128);

    console.log('[extractMobiCover] MOBI header length:', mobiHeaderLength);
    console.log('[extractMobiCover] EXTH flags:', exthFlags.toString(16));

    // 检查是否有EXTH header
    const hasExth = (exthFlags & 0x40) !== 0;

    if (!hasExth) {
      console.log('[extractMobiCover] No EXTH header');
      return tryExtractMobiImageByPattern(data, recordOffsets);
    }

    // 定位EXTH header
    const exthOffset = mobiHeaderOffset + mobiHeaderLength;
    const exthMagic = data.toString('ascii', exthOffset, exthOffset + 4);

    if (exthMagic !== 'EXTH') {
      console.log('[extractMobiCover] EXTH magic not found');
      return tryExtractMobiImageByPattern(data, recordOffsets);
    }

    const exthLength = data.readUInt32BE(exthOffset + 4);
    const exthCount = data.readUInt32BE(exthOffset + 8);

    console.log('[extractMobiCover] EXTH records:', exthCount);

    // 解析EXTH记录，找封面索引
    let coverOffset = -1;
    let pos = exthOffset + 12;

    for (let i = 0; i < exthCount && pos < exthOffset + exthLength; i++) {
      const recordType = data.readUInt32BE(pos);
      const recordLength = data.readUInt32BE(pos + 4);

      // Type 201 = CoverOffset (封面图片的记录索引偏移)
      if (recordType === 201 && recordLength >= 12) {
        coverOffset = data.readUInt32BE(pos + 8);
        console.log('[extractMobiCover] Cover offset found:', coverOffset);
      }

      pos += recordLength;
    }

    // 获取第一个图片记录的索引
    const firstImageIndex = data.readUInt32BE(mobiHeaderOffset + 108);
    console.log('[extractMobiCover] First image index:', firstImageIndex);

    // 计算封面记录索引
    let coverRecordIndex = firstImageIndex;
    if (coverOffset >= 0) {
      coverRecordIndex = firstImageIndex + coverOffset;
    }

    console.log('[extractMobiCover] Cover record index:', coverRecordIndex);

    // 提取封面图片
    if (coverRecordIndex > 0 && coverRecordIndex < numRecords - 1) {
      const imageStart = recordOffsets[coverRecordIndex];
      const imageEnd = recordOffsets[coverRecordIndex + 1];
      const imageData = data.subarray(imageStart, imageEnd);

      // 检查是否是有效的图片数据
      if (isValidImage(imageData)) {
        console.log('[extractMobiCover] Cover extracted, size:', imageData.length);
        return imageData;
      }
    }

    // 回退：尝试按模式查找图片
    return tryExtractMobiImageByPattern(data, recordOffsets);
  } catch (err) {
    console.error('[extractMobiCover] Error:', err);
    return null;
  }
}

/**
 * 按模式尝试提取MOBI中的图片
 */
function tryExtractMobiImageByPattern(data: Buffer, recordOffsets: number[]): Buffer | null {
  console.log('[tryExtractMobiImageByPattern] Searching for images...');

  // 图片魔数
  const jpegMagic = Buffer.from([0xFF, 0xD8, 0xFF]);
  const pngMagic = Buffer.from([0x89, 0x50, 0x4E, 0x47]);
  const gifMagic = Buffer.from([0x47, 0x49, 0x46]);

  let largestImage: Buffer | null = null;
  let largestSize = 0;

  for (let i = 0; i < recordOffsets.length - 1; i++) {
    const start = recordOffsets[i];
    const end = recordOffsets[i + 1];
    const record = data.subarray(start, end);

    if (record.length < 10) continue;

    // 检查是否是图片
    const isJpeg = record.subarray(0, 3).equals(jpegMagic);
    const isPng = record.subarray(0, 4).equals(pngMagic);
    const isGif = record.subarray(0, 3).equals(gifMagic);

    if ((isJpeg || isPng || isGif) && record.length > largestSize) {
      largestImage = record;
      largestSize = record.length;
      console.log('[tryExtractMobiImageByPattern] Found image at record', i, 'size:', record.length);
    }
  }

  return largestImage;
}

/**
 * 从AZW3(KF8)文件提取封面
 * AZW3使用类似MOBI的结构，但可能有额外的KF8容器
 */
export async function extractAzw3Cover(azw3Path: string): Promise<Buffer | null> {
  console.log('[extractAzw3Cover] Starting extraction for:', azw3Path);

  try {
    const data = fs.readFileSync(azw3Path);

    // AZW3可能是包含在外层容器中
    // 先尝试查找嵌入的MOBI
    const mobiStart = data.indexOf(Buffer.from('BOOKMOBI'));

    if (mobiStart > 0) {
      console.log('[extractAzw3Cover] Found embedded MOBI at:', mobiStart);
      // 创建临时文件处理嵌入的MOBI
      const embeddedData = data.subarray(mobiStart - 60); // 包含PDB header
      return extractMobiCoverFromBuffer(embeddedData);
    }

    // 直接尝试作为MOBI处理
    return extractMobiCoverFromBuffer(data);
  } catch (err) {
    console.error('[extractAzw3Cover] Error:', err);
    return null;
  }
}

/**
 * 从Buffer提取MOBI封面（用于AZW3）
 */
function extractMobiCoverFromBuffer(data: Buffer): Buffer | null {
  try {
    // 检查PDB header
    const palmMagic = data.toString('ascii', 60, 68);
    if (palmMagic !== 'BOOKMOBI') {
      console.log('[extractMobiCoverFromBuffer] Not BOOKMOBI format');
      // 尝试直接搜索图片
      return searchImagesInBuffer(data);
    }

    // 读取记录数
    const numRecords = data.readUInt16BE(76);
    if (numRecords === 0) return null;

    // 读取记录偏移
    const recordOffsets: number[] = [];
    for (let i = 0; i < numRecords; i++) {
      const offset = data.readUInt32BE(78 + i * 8);
      recordOffsets.push(offset);
    }

    return tryExtractMobiImageByPattern(data, recordOffsets);
  } catch (err) {
    console.error('[extractMobiCoverFromBuffer] Error:', err);
    return null;
  }
}

/**
 * 在Buffer中搜索图片
 */
function searchImagesInBuffer(data: Buffer): Buffer | null {
  console.log('[searchImagesInBuffer] Searching for images in buffer...');

  // 查找JPEG
  const jpegStart = data.indexOf(Buffer.from([0xFF, 0xD8, 0xFF]));
  if (jpegStart >= 0) {
    // 查找JPEG结束标记
    const jpegEnd = data.indexOf(Buffer.from([0xFF, 0xD9]), jpegStart);
    if (jpegEnd > jpegStart) {
      const imageData = data.subarray(jpegStart, jpegEnd + 2);
      console.log('[searchImagesInBuffer] Found JPEG, size:', imageData.length);
      return imageData;
    }
  }

  // 查找PNG
  const pngStart = data.indexOf(Buffer.from([0x89, 0x50, 0x4E, 0x47]));
  if (pngStart >= 0) {
    // PNG结束标记 IEND
    const iendMarker = Buffer.from([0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82]);
    const pngEnd = data.indexOf(iendMarker, pngStart);
    if (pngEnd > pngStart) {
      const imageData = data.subarray(pngStart, pngEnd + 8);
      console.log('[searchImagesInBuffer] Found PNG, size:', imageData.length);
      return imageData;
    }
  }

  return null;
}

/**
 * 检查是否是有效的图片数据
 */
function isValidImage(data: Buffer): boolean {
  if (data.length < 10) return false;

  // JPEG: FF D8 FF
  if (data[0] === 0xFF && data[1] === 0xD8 && data[2] === 0xFF) {
    return true;
  }

  // PNG: 89 50 4E 47
  if (data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4E && data[3] === 0x47) {
    return true;
  }

  // GIF: 47 49 46
  if (data[0] === 0x47 && data[1] === 0x49 && data[2] === 0x46) {
    return true;
  }

  return false;
}

/**
 * 获取图片的MIME类型
 */
export function getImageMimeType(data: Buffer): string {
  if (data[0] === 0xFF && data[1] === 0xD8) return 'image/jpeg';
  if (data[0] === 0x89 && data[1] === 0x50) return 'image/png';
  if (data[0] === 0x47 && data[1] === 0x49) return 'image/gif';
  return 'image/jpeg'; // 默认
}

/**
 * 获取图片扩展名
 */
export function getImageExtension(data: Buffer): string {
  if (data[0] === 0xFF && data[1] === 0xD8) return 'jpg';
  if (data[0] === 0x89 && data[1] === 0x50) return 'png';
  if (data[0] === 0x47 && data[1] === 0x49) return 'gif';
  return 'jpg';
}

/**
 * 统一的封面提取接口
 */
export async function extractCover(filePath: string): Promise<{ data: Buffer; mimeType: string } | null> {
  const ext = path.extname(filePath).toLowerCase();

  let coverData: Buffer | null = null;

  switch (ext) {
    case '.epub':
      coverData = await extractEpubCover(filePath);
      break;
    case '.mobi':
      coverData = await extractMobiCover(filePath);
      break;
    case '.azw3':
    case '.azw':
      coverData = await extractAzw3Cover(filePath);
      break;
    default:
      console.log('[extractCover] Unsupported format:', ext);
      return null;
  }

  if (coverData) {
    return {
      data: coverData,
      mimeType: getImageMimeType(coverData),
    };
  }

  return null;
}

/**
 * 提取封面并保存到文件，返回相对路径
 */
export async function extractCoverToFile(filePath: string): Promise<string | null> {
  const result = await extractCover(filePath);

  if (!result) return null;

  try {
    // 确保封面目录存在
    const coverDir = path.join(config.upload.dir, config.upload.coversDir);
    if (!fs.existsSync(coverDir)) {
      fs.mkdirSync(coverDir, { recursive: true });
    }

    // 生成封面文件名并保存
    const ext = getImageExtension(result.data);
    const coverFilename = `${uuidv4()}.${ext}`;
    const coverFullPath = path.join(coverDir, coverFilename);

    fs.writeFileSync(coverFullPath, result.data);
    console.log('[extractCoverToFile] Cover saved to:', coverFullPath);

    return `${config.upload.coversDir}/${coverFilename}`;
  } catch (err) {
    console.error('[extractCoverToFile] Failed to save cover:', err);
    return null;
  }
}

/**
 * 提取封面并返回Base64
 */
export async function extractCoverToBase64(filePath: string): Promise<string | null> {
  const result = await extractCover(filePath);

  if (!result) return null;

  const base64 = result.data.toString('base64');
  return `data:${result.mimeType};base64,${base64}`;
}
