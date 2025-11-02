import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { GoogleStrategy } from './google.strategy';
import { SupabaseModule } from '../supabase/supabase.module';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';
import { SystemSettingsModule } from '../system-settings/system-settings.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    SupabaseModule,
    PrismaModule,
    EmailModule,
    SystemSettingsModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard, GoogleStrategy],
  exports: [AuthService, AuthGuard],
})
export class AuthModule {}
