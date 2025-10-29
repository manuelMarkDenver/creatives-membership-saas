import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WasabiStorageService } from './wasabi-storage.service';

// Export a token for dependency injection
export const STORAGE_PROVIDER = 'STORAGE_PROVIDER';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: STORAGE_PROVIDER,
      useClass: WasabiStorageService, // Switch to WasabiStorageService
    },
  ],
  exports: [STORAGE_PROVIDER],
})
export class StorageModule {}
