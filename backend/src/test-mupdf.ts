// 测试 mupdf 是否正常工作
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testMupdf() {
  try {
    console.log('Loading mupdf module...');
    const mupdf = await import('mupdf');
    console.log('mupdf loaded successfully');

    // 检查 Document 的属性和方法
    console.log('\n--- Checking Document API ---');
    console.log('mupdf.Document:', typeof mupdf.Document);
    console.log('mupdf.Document properties:', Object.getOwnPropertyNames(mupdf.Document));

    // 检查是否有 prototype
    if (mupdf.Document.prototype) {
      console.log('Document prototype methods:', Object.getOwnPropertyNames(mupdf.Document.prototype));
    }

    // 检查 Matrix 的属性
    console.log('\n--- Checking Matrix API ---');
    console.log('mupdf.Matrix:', typeof mupdf.Matrix);
    console.log('mupdf.Matrix properties:', Object.getOwnPropertyNames(mupdf.Matrix));

    // 检查 ColorSpace
    console.log('\n--- Checking ColorSpace API ---');
    console.log('mupdf.ColorSpace:', typeof mupdf.ColorSpace);
    console.log('mupdf.ColorSpace properties:', Object.getOwnPropertyNames(mupdf.ColorSpace));
    console.log('ColorSpace.DeviceRGB:', mupdf.ColorSpace.DeviceRGB);

    // 创建测试目录
    const uploadsDir = path.join(__dirname, '../../uploads/books');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('\nCreated uploads/books directory');
    }

    // 查找任意 PDF 文件来测试
    const files = fs.readdirSync(uploadsDir);
    const pdfFile = files.find(f => f.toLowerCase().endsWith('.pdf'));

    if (!pdfFile) {
      console.log('\nNo PDF files found. Creating a simple test PDF...');
      // 使用 mupdf 创建一个简单的测试 PDF
      const pdfDoc = new mupdf.PDFDocument();
      const page = pdfDoc.addPage([0, 0, 612, 792], 0, null, '');
      pdfDoc.insertPage(-1, page);
      const buffer = pdfDoc.saveToBuffer('compress');
      const testPdfPath = path.join(uploadsDir, 'test.pdf');
      fs.writeFileSync(testPdfPath, buffer.asUint8Array());
      console.log('Created test PDF at:', testPdfPath);

      // 现在读取这个测试 PDF
      const pdfData = fs.readFileSync(testPdfPath);
      console.log('PDF file size:', pdfData.length, 'bytes');

      // 打开文档 - 尝试正确的方式
      console.log('\nTrying to open PDF document...');
      const doc = mupdf.Document.openDocument(pdfData, 'application/pdf');
      console.log('Document opened, pages:', doc.countPages());
    } else {
      const pdfPath = path.join(uploadsDir, pdfFile);
      console.log('\nTesting with existing PDF:', pdfPath);

      const pdfData = fs.readFileSync(pdfPath);
      console.log('PDF file size:', pdfData.length, 'bytes');

      const doc = mupdf.Document.openDocument(pdfData, 'application/pdf');
      console.log('Document opened, pages:', doc.countPages());

      const page = doc.loadPage(0);
      console.log('Page loaded');

      const matrix = mupdf.Matrix.scale(1.5, 1.5);
      console.log('Matrix created');

      const pixmap = page.toPixmap(matrix, mupdf.ColorSpace.DeviceRGB, false, true);
      console.log('Pixmap created, size:', pixmap.width, 'x', pixmap.height);

      const pngData = pixmap.asPNG();
      console.log('PNG data size:', pngData.length, 'bytes');

      const testCoverPath = path.join(__dirname, '../../uploads/test-cover.png');
      fs.writeFileSync(testCoverPath, pngData);
      console.log('Test cover saved to:', testCoverPath);

      console.log('\nSUCCESS! mupdf is working correctly');
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

testMupdf();
