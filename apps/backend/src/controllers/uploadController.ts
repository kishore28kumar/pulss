import { Request, Response } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { ApiResponse, UploadedFile } from '@pulss/types';
import multer from 'multer';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

export const uploadMiddleware = upload.single('file');

// ============================================
// UPLOAD FILE
// ============================================

export const uploadFile = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.file) {
      throw new AppError('No file provided', 400);
    }

    // Determine tenant ID for folder structure
    // SUPER_ADMIN can upload for any tenant (from header), others use their tenant
    const tenantId = req.tenantId || 'general';
    const subfolder = req.body.folder || 'products';

    // Upload to Cloudinary
    const uploadResult = await new Promise<UploadedFile>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `tenants/${tenantId}/${subfolder}`,
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary Upload Error:', error);
            reject(new AppError(`Failed to upload file: ${error.message}`, 500));
          } else if (result) {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              format: result.format,
              width: result.width,
              height: result.height,
            });
          } else {
            reject(new AppError('Upload failed', 500));
          }
        }
      );

      uploadStream.end(req.file!.buffer);
    });

    const response: ApiResponse<UploadedFile> = {
      success: true,
      data: uploadResult,
      message: 'File uploaded successfully',
    };

    res.json(response);
  }
);

