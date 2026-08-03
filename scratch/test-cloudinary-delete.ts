import { CloudinaryService } from '../src/server/services/cloudinary.service';
import { prisma } from '../src/lib/prisma';
import { v2 as cloudinary } from 'cloudinary';
import { env } from '../src/utils/env';

async function testLiveCloudinaryDelete() {
  console.log('=============== CLOUDINARY LIVE DELETE TEST ===============\n');

  const targetPublicId = 'ahankara/products/test-v5-live/mkntx8okbp8vlylfdfcn';

  // Task 1: Real Cloudinary Delete Request
  console.log(`1. Deleting target asset from Cloudinary: ${targetPublicId}...`);
  
  // Configure Cloudinary explicitly if env vars exist
  if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
    });
  }

  // Execute raw Cloudinary destroy API directly to verify provider response payload
  const destroyResult = await cloudinary.uploader.destroy(targetPublicId);
  console.log(`   - Provider Delete Response Result: ${destroyResult.result}`);
  
  const deleteServiceSuccess = destroyResult.result === 'ok' || destroyResult.result === 'not_found';
  console.log(`   - Cloudinary Delete Service Status: ${deleteServiceSuccess ? 'PASSED' : 'FAILED'}`);

  // Task 2: Verify Asset Removal via Cloudinary API
  console.log('\n2. Verifying Asset Removal via Cloudinary API Resource Lookup...');
  let assetExists = false;
  try {
    const resource = await cloudinary.api.resource(targetPublicId);
    if (resource && resource.public_id === targetPublicId) {
      assetExists = true;
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (errorMsg.includes('not_found') || errorMsg.includes('Resource not found') || errorMsg.includes('404')) {
      assetExists = false;
    } else {
      console.log(`   - Resource Lookup Info: ${errorMsg}`);
    }
  }
  console.log(`   - Asset Exists After Delete: ${assetExists ? 'YES' : 'NO'}`);

  // Task 3: Database Orphan Check
  console.log('\n3. Checking Database ProductImage Table...');
  const matchingDbRows = await prisma.productImage.count({
    where: { publicId: targetPublicId },
  });
  console.log(`   - ProductImage Rows Found for Test Asset: ${matchingDbRows}`);

  await prisma.$disconnect();

  console.log('\n=============== CLOUDINARY LIVE DELETE TEST COMPLETED ===============\n');
}

testLiveCloudinaryDelete().catch((err) => {
  console.error('❌ Delete Verification Failed:', err);
  process.exit(1);
});
