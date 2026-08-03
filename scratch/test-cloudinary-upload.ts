import { CloudinaryService } from '../src/server/services/cloudinary.service';

async function testLiveCloudinaryUpload() {
  console.log('=============== CLOUDINARY LIVE UPLOAD TEST ===============\n');

  // 1x1 PNG image buffer (Base64 decoded)
  const tinyPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const fileBuffer = Buffer.from(tinyPngBase64, 'base64');

  const testFolderId = 'test-v5-live';

  try {
    const result = await CloudinaryService.uploadProductImage(fileBuffer, testFolderId, 'image/png');

    console.log('Upload Response Received Successfully:');
    console.log(`- public_id: ${result.public_id}`);
    console.log(`- secure_url: ${result.secure_url}`);
    console.log(`- width: ${result.width}`);
    console.log(`- height: ${result.height}`);
    console.log(`- format: ${result.format}`);
    console.log(`- bytes: ${result.bytes}`);
    console.log(`- is_https: ${result.secure_url.startsWith('https://')}`);

    return result;
  } catch (error) {
    console.error('❌ Cloudinary Upload Failed:', error);
    process.exit(1);
  }
}

testLiveCloudinaryUpload();
