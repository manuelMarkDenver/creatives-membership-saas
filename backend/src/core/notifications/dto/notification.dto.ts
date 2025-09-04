import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsObject,
} from 'class-validator';

export class NotificationDataDto {
  @IsString()
  userId: string;

  @IsString()
  recipientName: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsString()
  tenantId: string;

  @IsEnum(['GYM', 'COFFEE_SHOP', 'E_COMMERCE'])
  @IsOptional()
  businessType?: 'GYM' | 'COFFEE_SHOP' | 'E_COMMERCE';

  @IsEnum([
    'expired',
    'expiring_soon',
    'welcome',
    'general',
    'reminder',
    'promotion',
    'update',
  ])
  notificationType:
    | 'expired'
    | 'expiring_soon'
    | 'welcome'
    | 'general'
    | 'reminder'
    | 'promotion'
    | 'update';

  @IsObject()
  @IsOptional()
  templateData?: Record<string, any>;

  @IsObject()
  @IsOptional()
  tenantBranding?: {
    name: string;
    logo?: string;
    colors?: {
      primary: string;
      secondary: string;
    };
  };
}

export class BulkNotificationDto {
  notifications: NotificationDataDto[];
}

export class SendNotificationDto {
  @IsString()
  userId: string;

  @IsString()
  recipientName: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsString()
  tenantId: string;

  @IsEnum(['GYM', 'COFFEE_SHOP', 'E_COMMERCE'])
  @IsOptional()
  businessType?: 'GYM' | 'COFFEE_SHOP' | 'E_COMMERCE';

  @IsEnum([
    'expired',
    'expiring_soon',
    'welcome',
    'general',
    'reminder',
    'promotion',
    'update',
  ])
  notificationType:
    | 'expired'
    | 'expiring_soon'
    | 'welcome'
    | 'general'
    | 'reminder'
    | 'promotion'
    | 'update';

  @IsObject()
  @IsOptional()
  templateData?: {
    // For expiration notifications
    membershipType?: string;
    expirationDate?: string;
    daysUntilExpiry?: number;

    // For promotions
    offerDetails?: string;
    discountPercent?: number;
    promoCode?: string;

    // For updates
    updateDetails?: string;

    // For reminders
    message?: string;
    actionRequired?: string;
    dueDate?: string;

    // Generic fields
    [key: string]: any;
  };

  @IsObject()
  @IsOptional()
  tenantBranding?: {
    name: string;
    logo?: string;
    colors?: {
      primary: string;
      secondary: string;
    };
  };
}

// Response DTOs
export class NotificationResultDto {
  success: boolean;
  message: string;
  provider?: 'email' | 'sms' | 'push';
  externalId?: string;
}

export class BulkNotificationResultDto {
  sent: number;
  failed: number;
  results: NotificationResultDto[];
}
