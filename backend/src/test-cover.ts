import { extractEpubCover, extractMobiCover, extractAzw3Cover } from './utils/coverExtractor.js';
import fs from 'fs';
import path from 'path';

async function testCoverExtraction() {
  const uploadsDir = path.join(process.cwd(), 'uploads', 'books');

  if (!fs.existsSync(uploadsDir)) {
    console.log('No uploads/books directory found');
    return;
  }

  const files = fs.readdirSync(uploadsDir);
  console.log('Files in uploads/books:', files);

  for (const file of files) {
    const filePath = path.join(uploadsDir, file);
    const ext = path.extname(file).toLowerCase();

    console.log('\n--- Testing:', file, '---');

    try {
      let coverData: Buffer | null = null;

      if (ext === '.epub') {
        coverData = await extractEpubCover(filePath);
      } else if (ext === '.mobi') {
        coverData = await extractMobiCover(filePath);
      } else if (ext === '.azw3') {
        coverData = await extractAzw3Cover(filePath);
      }

      if (coverData) {
        console.log('Cover extracted successfully! Size:', coverData.length, 'bytes');
        // Save test cover
        const testPath = path.join(process.cwd(), `test-cover-${ext.slice(1)}.jpg`);
        fs.writeFileSync(testPath, coverData);
        console.log('Test cover saved to:', testPath);
      } else {
        console.log('No cover found');
      }
    } catch (err) {
      console.error('Error:', err);
    }
  }
}

testCoverExtraction();
