import { NextRequest } from 'next/server';
import { AuthService } from '@/server/services/auth.service';
import { CloudinaryService } from '@/server/services/cloudinary.service';
import { successResponse } from '@/utils/api-response';
import { handleError } from '@/utils/error-handler';
import { AppError } from '@/utils/errors';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Removed PURPOSE_FOLDERS mapping since we use explicit methods
export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate & Require ADMIN role
    await AuthService.requireRole(req.headers, 'ADMIN');

    // 2. Parse FormData
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const purpose = formData.get('purpose') as string | null;

    // 3. Validate presence
    if (!file) {
      throw new AppError('File is required', 400, 'BAD_REQUEST');
    }
    if (!purpose) {
      throw new AppError('Purpose is required', 400, 'BAD_REQUEST');
    }

    // 4. Validate purpose mapping
    if (purpose !== 'category' && purpose !== 'collection') {
      throw new AppError('Invalid media purpose', 400, 'BAD_REQUEST');
    }

    // 5. Validate file constraints
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new AppError('File size exceeds 5MB limit', 400, 'BAD_REQUEST');
    }
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      throw new AppError('Invalid file format. Only JPEG, PNG, and WebP are allowed.', 400, 'BAD_REQUEST');
    }

    // 6. Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 7. Upload to Cloudinary using secure semantic boundary
    let uploadResult;
    if (purpose === 'category') {
      uploadResult = await CloudinaryService.uploadCategoryImage(buffer);
    } else {
      uploadResult = await CloudinaryService.uploadCollectionImage(buffer);
    }

    // 8. Return safe metadata
    return successResponse({
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      width: uploadResult.width,
      height: uploadResult.height,
      format: uploadResult.format,
    }, 'Media uploaded successfully', 201);
  } catch (error) {
    return handleError(error);
  }
}
