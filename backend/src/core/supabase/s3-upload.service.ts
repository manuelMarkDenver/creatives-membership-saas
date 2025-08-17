import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class S3UploadService {
  private readonly logger = new Logger(S3UploadService.name);
  private s3Client: S3Client | null = null;
  private bucketName = 'member-photos';
  private endpoint: string;
  private region = 'us-east-1'; // Supabase default region

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const s3Endpoint = this.configService.get<string>('SUPABASE_S3_ENDPOINT');
    const accessKeyId = this.configService.get<string>('SUPABASE_S3_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('SUPABASE_S3_SECRET_ACCESS_KEY');

    // Extract project ID from Supabase URL for S3 endpoint if not provided
    if (!s3Endpoint && supabaseUrl) {
      const projectId = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
      if (projectId) {
        this.endpoint = `https://${projectId}.storage.supabase.co/storage/v1/s3`;
      } else {
        this.logger.error('Could not extract project ID from Supabase URL');
        return;
      }
    } else {
      this.endpoint = s3Endpoint || '';
    }

    // Use provided credentials
    const finalAccessKey = accessKeyId || '76cf8298817e75467a20ac5456e9c694';
    const finalSecretKey = secretAccessKey || '6877a4d587f5a46923d00d3a2ccf55f0e26c2c6ffe72fd751651853a9ce2fef0';

    this.logger.log(`S3 Endpoint: ${this.endpoint}`);
    this.logger.log(`Access Key ID: ${finalAccessKey ? finalAccessKey.substring(0, 8) + '...' : 'NOT SET'}`);

    if (this.endpoint && finalAccessKey && finalSecretKey) {
      try {
        this.s3Client = new S3Client({
          endpoint: this.endpoint,
          region: this.region,
          credentials: {
            accessKeyId: finalAccessKey,
            secretAccessKey: finalSecretKey,
          },
          forcePathStyle: true,
        });
        this.logger.log('S3 client initialized successfully');
      } catch (error) {
        this.logger.error('Failed to initialize S3 client:', error.message);
      }
    } else {
      this.logger.warn('S3 credentials not configured');
    }
  }

  /**
   * Upload member photo using S3 API
   */
  async uploadMemberPhoto(
    memberId: string,
    tenantId: string,
    file: Express.Multer.File
  ): Promise<{ url: string; path: string }> {
    if (!this.s3Client) {
      throw new InternalServerErrorException('S3 upload not available - client not configured');
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

      this.logger.log(`Uploading photo via S3 for member ${memberId}: ${fileName}`);

      // Upload to S3
      const uploadCommand = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
        CacheControl: 'max-age=3600',
      });

      await this.s3Client.send(uploadCommand);

      // Generate public URL with cache busting
      const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
      const cacheBuster = Date.now();
      const publicUrl = `${supabaseUrl}/storage/v1/object/public/${this.bucketName}/${fileName}?v=${cacheBuster}`;

      this.logger.log(`Photo uploaded successfully via S3: ${publicUrl}`);

      return {
        url: publicUrl,
        path: fileName
      };

    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      this.logger.error(`S3 upload failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Failed to upload photo: ${error.message}`);
    }
  }

  /**
   * Delete member photo using S3 API
   */
  async deleteMemberPhoto(photoPath: string): Promise<boolean> {
    if (!this.s3Client) {
      this.logger.warn('S3 photo deletion not available - client not configured');
      return true;
    }

    try {
      if (!photoPath) {
        return true;
      }

      this.logger.log(`Deleting photo via S3: ${photoPath}`);

      const deleteCommand = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: photoPath,
      });

      await this.s3Client.send(deleteCommand);

      this.logger.log(`Photo deleted successfully via S3: ${photoPath}`);
      return true;

    } catch (error) {
      this.logger.warn(`S3 delete failed: ${error.message}`);
      return false;
    }
  }
}
