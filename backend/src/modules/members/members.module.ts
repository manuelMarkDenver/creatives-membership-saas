import { Module } from '@nestjs/common';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { SupabaseModule } from '../../core/supabase/supabase.module';
import { AuthGuard } from '../../core/auth/auth.guard';

@Module({
  imports: [PrismaModule, SupabaseModule],
  controllers: [MembersController],
  providers: [MembersService, AuthGuard],
  exports: [MembersService],
})
export class MembersModule {}
