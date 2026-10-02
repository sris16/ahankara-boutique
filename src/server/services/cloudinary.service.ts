import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { env } from '@/utils/env';

// Configure Cloudinary only if credentials are provided
if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
}

export class CloudinaryService {
  /**
   * Upload an image buffer to a specific folder in Cloudinary
   * @param fileBuffer The file buffer
   * @param folder The target folder path
   */
  private static async uploadImage(
    fileBuffer: Buffer,
    folder: string
  ): Promise<UploadApiResponse> {
    if (!env.CLOUDINARY_CLOUD_NAME) {
      throw new Error('Cloudinary is not configured. External configuration required.');
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
          resource_type: 'image',
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else if (result) {
            resolve(result);
          } else {
            reject(new Error('Unknown Cloudinary upload error'));
          }
        }
      );

      uploadStream.end(fileBuffer);
    });
  }

  /**
   * Upload a category image to Cloudinary
   */
  static async uploadCategoryImage(fileBuffer: Buffer): Promise<UploadApiResponse> {
    return this.uploadImage(fileBuffer, 'ahankara/categories');
  }

  /**
   * Upload a collection image to Cloudinary
   */
  static async uploadCollectionImage(fileBuffer: Buffer): Promise<UploadApiResponse> {
    return this.uploadImage(fileBuffer, 'ahankara/collections');
  }

  /**
   * Upload an image buffer to Cloudinary
   * @param fileBuffer The file buffer
   * @param productId The ID of the product for folder organization
   * @param _mimetype The MIME type of the file
   */
  static async uploadProductImage(
    fileBuffer: Buffer,
    productId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _mimetype: string
  ): Promise<UploadApiResponse> {
    return this.uploadImage(fileBuffer, `ahankara/products/${productId}`);
  }

  /**
   * Delete an image from Cloudinary by its public ID
   */
  static async deleteImage(publicId: string): Promise<boolean> {
    if (!env.CLOUDINARY_CLOUD_NAME) {
      // If not configured, we can't delete from it. Return true for testing purposes if env is missing.
      return true;
    }

    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result.result === 'ok';
    } catch (error) {
      console.error(`Failed to delete Cloudinary image: ${publicId}`, error);
      return false; // Safely return false if deletion fails
    }
  }
}
