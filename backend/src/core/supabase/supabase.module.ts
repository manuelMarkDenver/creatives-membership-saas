import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseService } from './supabase.service';
import { S3UploadService } from './s3-upload.service';

@Module({
  imports: [ConfigModule],
  providers: [SupabaseService, S3UploadService],
  exports: [SupabaseService, S3UploadService],
})
export class SupabaseModule {}
