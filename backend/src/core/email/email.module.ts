import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';
import { EmailSettingsController } from './email-settings.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EmailController, EmailSettingsController],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
