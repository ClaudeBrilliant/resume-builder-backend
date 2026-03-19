import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { Express } from 'express';

@Injectable()
export class UploadService {
  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadImage(file: Express.Multer.File, folder: string = 'jazacv'): Promise<string> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Only images are allowed.');
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 5MB limit.');
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: 'image',
          transformation: [
            { width: 800, height: 800, crop: 'limit' },
            { quality: 'auto' },
            { format: 'auto' },
          ],
        },
        (error, result) => {
          if (error) {
            reject(new BadRequestException(`Upload failed: ${error.message}`));
          } else {
            resolve(result.secure_url);
          }
        },
      );

      uploadStream.end(file.buffer);
    });
  }

  async uploadPDF(file: Express.Multer.File, folder: string = 'jazacv/resumes'): Promise<string> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file type
    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Invalid file type. Only PDF files are allowed.');
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 10MB limit.');
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: 'raw',
          format: 'pdf',
        },
        (error, result) => {
          if (error) {
            reject(new BadRequestException(`Upload failed: ${error.message}`));
          } else {
            resolve(result.secure_url);
          }
        },
      );

      uploadStream.end(file.buffer);
    });
  }

  async uploadAvatar(file: Express.Multer.File): Promise<string> {
    return this.uploadImage(file, 'jazacv/avatars');
  }

  async deleteFile(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error('Error deleting file from Cloudinary:', error);
      // Don't throw - file deletion failure shouldn't break the flow
    }
  }

  extractPublicId(url: string): string | null {
    // Extract public_id from Cloudinary URL
    // Format: https://res.cloudinary.com/{cloud_name}/image/upload/{version}/{public_id}.{format}
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
    return match ? match[1] : null;
  }
}
