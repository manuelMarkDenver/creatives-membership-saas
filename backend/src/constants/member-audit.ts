export const MEMBER_ACTION_REASONS = {
  ACTIVATION: [
    'PAYMENT_RECEIVED',
    'ISSUE_RESOLVED', 
    'POLICY_UPDATE',
    'ADMIN_DECISION',
    'SUBSCRIPTION_RENEWED',
    'OTHER'
  ],
  DEACTIVATION: [
    'NON_PAYMENT',
    'POLICY_VIOLATION',
    'MEMBER_REQUEST',
    'FACILITY_ABUSE',
    'SUBSCRIPTION_EXPIRED',
    'ADMIN_DECISION',
    'OTHER'
  ],
  CANCELLATION: [
    'NON_PAYMENT',
    'POLICY_VIOLATION',
    'MEMBER_REQUEST',
    'FACILITY_ABUSE',
    'ADMIN_DECISION',
    'OTHER'
  ],
  RESTORATION: [
    'DATA_ERROR',
    'POLICY_CHANGE', 
    'MEMBER_REQUEST',
    'ADMIN_ERROR',
    'PAYMENT_RESOLVED',
    'OTHER'
  ]
};

export const MEMBER_STATES = {
  ACTIVE: 'ACTIVE',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED',
  DELETED: 'DELETED'
} as const;

export const MEMBER_ACTION_DESCRIPTIONS = {
  ACCOUNT_CREATED: 'Member account was created',
  ACCOUNT_ACTIVATED: 'Member account was activated',
  ACCOUNT_DEACTIVATED: 'Member account was deactivated',
  ACCOUNT_DELETED: 'Member account was deleted',
  ACCOUNT_RESTORED: 'Member account was restored from deletion',
  SUBSCRIPTION_STARTED: 'New subscription was started',
  SUBSCRIPTION_RENEWED: 'Subscription was renewed',
  SUBSCRIPTION_CANCELLED: 'Subscription was cancelled',
  SUBSCRIPTION_EXPIRED: 'Subscription has expired',
  SUBSCRIPTION_SUSPENDED: 'Subscription was suspended',
  SUBSCRIPTION_RESUMED: 'Subscription was resumed',
  PAYMENT_RECEIVED: 'Payment was received',
  PAYMENT_FAILED: 'Payment failed',
  PAYMENT_REFUNDED: 'Payment was refunded',
  PROFILE_UPDATED: 'Member profile was updated',
  PROFILE_PHOTO_UPDATED: 'Member profile photo was updated',
  FACILITY_ACCESS_GRANTED: 'Facility access was granted',
  FACILITY_ACCESS_REVOKED: 'Facility access was revoked',
  LOGIN_SUCCESSFUL: 'Member logged in successfully',
  LOGIN_FAILED: 'Member login attempt failed'
};
