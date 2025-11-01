import { Module } from '@nestjs/common';
import { GymMembersController } from './gym-members.controller';
import { GymMembersService } from './gym-members.service';
import { PrismaModule } from '../../../core/prisma/prisma.module';
import { SupabaseModule } from '../../../core/supabase/supabase.module';
import { EmailModule } from '../../../core/email/email.module';

@Module({
  imports: [PrismaModule, SupabaseModule, EmailModule],
  controllers: [GymMembersController],
  providers: [GymMembersService],
  exports: [GymMembersService],
})
export class GymMembersModule {}
