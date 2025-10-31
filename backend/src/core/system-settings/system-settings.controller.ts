import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { SystemSettingsService } from './system-settings.service';
import { AuthGuard } from '../auth/auth.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UpdatePasswordSecurityDto } from './dto/update-password-security.dto';

@Controller('system-settings')
@UseGuards(AuthGuard, RoleGuard)
export class SystemSettingsController {
  constructor(private readonly systemSettingsService: SystemSettingsService) {}

  /**
   * GET /system-settings
   * Get all system settings (SUPER_ADMIN only)
   */
  @Get()
  @Roles('SUPER_ADMIN')
  async getSettings() {
    return this.systemSettingsService.getSettings();
  }

  /**
   * GET /system-settings/password-security-level
   * Get current password security level (Public - needed for password validation)
   */
  @Get('password-security-level')
  async getPasswordSecurityLevel() {
    const level =
      await this.systemSettingsService.getPasswordSecurityLevel();
    return { passwordSecurityLevel: level };
  }

  /**
   * PUT /system-settings/password-security-level
   * Update password security level (SUPER_ADMIN only)
   */
  @Put('password-security-level')
  @Roles('SUPER_ADMIN')
  async updatePasswordSecurityLevel(
    @Body() dto: UpdatePasswordSecurityDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id || 'system';
    return this.systemSettingsService.updatePasswordSecurityLevel(
      dto.passwordSecurityLevel,
      userId,
    );
  }
}
