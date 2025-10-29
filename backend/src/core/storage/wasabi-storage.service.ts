import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { StorageProvider } from './storage-provider.interface';

@Injectable()
export class WasabiStorageService implements StorageProvider {
  private readonly logger = new Logger(WasabiStorageService.name);
  private s3Client: S3Client | null = null;
  private bucketName: string;
  private region: string;
  private publicUrl: string;

  constructor(private configService: ConfigService) {
    // Wasabi configuration
    const accessKeyId = this.configService.get<string>('WASABI_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>(
      'WASABI_SECRET_ACCESS_KEY',
    );
    const bucketName =
      this.configService.get<string>('WASABI_BUCKET_NAME') || 'member-photos';
    const region = this.configService.get<string>('WASABI_REGION') || 'us-east-1';
    
    // Wasabi endpoint format: https://s3.{region}.wasabisys.com
    const endpoint = `https://s3.${region}.wasabisys.com`;
    
    // Public URL format for Wasabi (path-style): https://s3.{region}.wasabisys.com/{bucket}
    this.publicUrl = `https://s3.${region}.wasabisys.com/${bucketName}`;
    
    this.bucketName = bucketName;
    this.region = region;

    this.logger.log(`Wasabi Configuration:`);
    this.logger.log(`  Endpoint: ${endpoint}`);
    this.logger.log(`  Bucket: ${bucketName}`);
    this.logger.log(`  Region: ${region}`);
    this.logger.log(`  Public URL: ${this.publicUrl}`);
    this.logger.log(
      `  Access Key: ${accessKeyId ? accessKeyId.substring(0, 8) + '...' : 'NOT SET'}`,
    );

    if (accessKeyId && secretAccessKey) {
      try {
        this.s3Client = new S3Client({
          endpoint,
          region,
          credentials: {
            accessKeyId,
            secretAccessKey,
          },
          // Force path-style addressing for Wasabi
          forcePathStyle: true,
        });
        this.logger.log('✅ Wasabi S3 client initialized successfully');
      } catch (error) {
        this.logger.error('❌ Failed to initialize Wasabi S3 client:', error.message);
      }
    } else {
      this.logger.warn('⚠️  Wasabi credentials not configured - storage will not work');
    }
  }

  /**
   * Upload member photo to Wasabi
   */
  async uploadMemberPhoto(
    memberId: string,
    tenantId: string,
    file: Express.Multer.File,
  ): Promise<{ url: string; path: string }> {
    if (!this.s3Client) {
      throw new InternalServerErrorException(
        'Wasabi storage not available - client not configured',
      );
    }

    try {
      // Validate file type
      if (!file.mimetype.startsWith('image/')) {
        throw new BadRequestException('File must be an image');
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        throw new BadRequestException('File size must be less than 5MB');
      }

      // Generate consistent filename (always overwrite as profile.jpg)
      const fileName = `${tenantId}/${memberId}/profile.jpg`;

      this.logger.log(`📤 Uploading to Wasabi: ${fileName}`);

      // Upload to Wasabi
      const uploadCommand = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
        CacheControl: 'max-age=3600',
        ACL: 'public-read',
      });

      await this.s3Client.send(uploadCommand);

      // Generate pre-signed URL (valid for 7 days)
      const getObjectCommand = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
      });
      
      const signedUrl = await getSignedUrl(this.s3Client, getObjectCommand, {
        expiresIn: 7 * 24 * 60 * 60, // 7 days in seconds
      });

      this.logger.log(`✅ Photo uploaded successfully with signed URL`);

      return {
        url: signedUrl,
        path: fileName,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error(`❌ Wasabi upload failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException(
        `Failed to upload photo: ${error.message}`,
      );
    }
  }

  /**
   * Delete member photo from Wasabi
   */
  async deleteMemberPhoto(photoPath: string): Promise<boolean> {
    if (!this.s3Client) {
      this.logger.warn(
        'Wasabi photo deletion not available - client not configured',
      );
      return true;
    }

    try {
      if (!photoPath) {
        return true;
      }

      this.logger.log(`🗑️  Deleting from Wasabi: ${photoPath}`);

      const deleteCommand = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: photoPath,
      });

      await this.s3Client.send(deleteCommand);

      this.logger.log(`✅ Photo deleted successfully: ${photoPath}`);
      return true;
    } catch (error) {
      this.logger.warn(`⚠️  Wasabi delete failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Extract photo path from Wasabi URL
   */
  extractPhotoPath(photoUrl: string): string | null {
    try {
      if (!photoUrl || !photoUrl.includes(this.bucketName)) {
        return null;
      }

      // Extract path after bucket URL
      const bucketUrl = `${this.publicUrl}/`;
      const pathIndex = photoUrl.indexOf(bucketUrl);

      if (pathIndex === -1) {
        return null;
      }

      // Get path and remove query parameters
      const pathWithQuery = photoUrl.substring(pathIndex + bucketUrl.length);
      const path = pathWithQuery.split('?')[0];

      return path;
    } catch (error) {
      this.logger.warn(`Failed to extract photo path from URL: ${photoUrl}`);
      return null;
    }
  }

  /**
   * Generate a fresh signed URL for an existing photo
   */
  async getSignedPhotoUrl(photoPath: string): Promise<string> {
    if (!this.s3Client) {
      throw new InternalServerErrorException(
        'Wasabi storage not available - client not configured',
      );
    }

    try {
      const getObjectCommand = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: photoPath,
      });

      const signedUrl = await getSignedUrl(this.s3Client, getObjectCommand, {
        expiresIn: 7 * 24 * 60 * 60, // 7 days in seconds
      });

      return signedUrl;
    } catch (error) {
      this.logger.error(`Failed to generate signed URL for ${photoPath}:`, error.message);
      throw new InternalServerErrorException(
        `Failed to generate signed URL: ${error.message}`,
      );
    }
  }
}
