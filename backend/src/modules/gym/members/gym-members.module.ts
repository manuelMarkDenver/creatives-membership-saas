import { Module } from '@nestjs/common';
import { GymMembersController } from './gym-members.controller';
import { GymMembersService } from './gym-members.service';
import { PrismaModule } from '../../../core/prisma/prisma.module';
import { SupabaseModule } from '../../../core/supabase/supabase.module';

@Module({
  imports: [PrismaModule, SupabaseModule],
  controllers: [GymMembersController],
  providers: [GymMembersService],
  exports: [GymMembersService],
})
export class GymMembersModule {}
