-- CreateEnum
CREATE TYPE "public"."BusinessCategory" AS ENUM ('GYM', 'COFFEE_SHOP', 'ECOMMERCE', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."TenantStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('SUPER_ADMIN', 'OWNER', 'MANAGER', 'STAFF', 'CLIENT');

-- CreateEnum
CREATE TYPE "public"."GymRole" AS ENUM ('GYM_TRAINER', 'GYM_NUTRITIONIST', 'GYM_FRONT_DESK', 'GYM_MAINTENANCE', 'GYM_MEMBER');

-- CreateEnum
CREATE TYPE "public"."CoffeeRole" AS ENUM ('COFFEE_MANAGER', 'BARISTA', 'CASHIER', 'BAKER', 'SHIFT_SUPERVISOR', 'COFFEE_CUSTOMER');

-- CreateEnum
CREATE TYPE "public"."EcommerceRole" AS ENUM ('STORE_MANAGER', 'PRODUCT_MANAGER', 'INVENTORY_MANAGER', 'CUSTOMER_SERVICE', 'MARKETING_MANAGER', 'FULFILLMENT_STAFF', 'VENDOR', 'ECOM_CUSTOMER');

-- CreateEnum
CREATE TYPE "public"."AccessLevel" AS ENUM ('FULL_ACCESS', 'MANAGER_ACCESS', 'STAFF_ACCESS', 'READ_ONLY');

-- CreateEnum
CREATE TYPE "public"."PlanType" AS ENUM ('TRIAL', 'PAID');

-- CreateEnum
CREATE TYPE "public"."BillingCycle" AS ENUM ('TRIAL', 'MONTHLY', 'YEARLY', 'ONE_TIME');

-- CreateEnum
CREATE TYPE "public"."SubscriptionStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PAST_DUE', 'CANCELED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'SUCCESSFUL', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."MembershipType" AS ENUM ('DAY_PASS', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL', 'UNLIMITED', 'STUDENT', 'SENIOR', 'CORPORATE');

-- CreateEnum
CREATE TYPE "public"."TransactionType" AS ENUM ('PAYMENT', 'REFUND', 'ADJUSTMENT', 'REVERSAL', 'CHARGEBACK');

-- CreateEnum
CREATE TYPE "public"."TransactionStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "public"."GymMemberSubscriptionStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'CANCELLED', 'EXPIRED', 'PENDING_ACTIVATION', 'NO_SUBSCRIPTION');

-- CreateEnum
CREATE TYPE "public"."GymMemberCardStatus" AS ENUM ('NO_CARD', 'PENDING_CARD', 'ACTIVE', 'DISABLED');

-- CreateEnum
CREATE TYPE "public"."MemberAuditAction" AS ENUM ('ACCOUNT_CREATED', 'ACCOUNT_ACTIVATED', 'ACCOUNT_DEACTIVATED', 'ACCOUNT_DELETED', 'ACCOUNT_RESTORED', 'SUBSCRIPTION_STARTED', 'SUBSCRIPTION_RENEWED', 'SUBSCRIPTION_CANCELLED', 'SUBSCRIPTION_EXPIRED', 'SUBSCRIPTION_SUSPENDED', 'SUBSCRIPTION_RESUMED', 'PAYMENT_RECEIVED', 'PAYMENT_FAILED', 'PAYMENT_REFUNDED', 'PROFILE_UPDATED', 'PROFILE_PHOTO_UPDATED', 'FACILITY_ACCESS_GRANTED', 'FACILITY_ACCESS_REVOKED', 'LOGIN_SUCCESSFUL', 'LOGIN_FAILED');

-- CreateEnum
CREATE TYPE "public"."BusinessUnitType" AS ENUM ('LOCATION', 'CHANNEL', 'DEPARTMENT', 'FRANCHISE');

-- CreateEnum
CREATE TYPE "public"."SaasSubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'PAST_DUE', 'SUSPENDED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "public"."BranchAccessLevel" AS ENUM ('SINGLE_BRANCH', 'MULTI_BRANCH', 'ALL_BRANCHES');

-- CreateEnum
CREATE TYPE "public"."PasswordSecurityLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "public"."InventoryCardStatus" AS ENUM ('AVAILABLE', 'ASSIGNED', 'DISABLED');

-- CreateEnum
CREATE TYPE "public"."CardType" AS ENUM ('MONTHLY', 'DAILY');

-- CreateEnum
CREATE TYPE "public"."AssignmentPurpose" AS ENUM ('ONBOARD', 'REPLACE');

-- CreateEnum
CREATE TYPE "public"."AuthProvider" AS ENUM ('LOCAL', 'GOOGLE');

-- CreateTable
CREATE TABLE "public"."Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" "public"."BusinessCategory" NOT NULL,
    "status" "public"."TenantStatus" NOT NULL DEFAULT 'PENDING',
    "logoUrl" TEXT,
    "address" TEXT,
    "phoneNumber" TEXT,
    "email" TEXT,
    "primaryColor" TEXT,
    "secondaryColor" TEXT,
    "websiteUrl" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "freeBranchOverride" INTEGER NOT NULL DEFAULT 0,
    "onboardingCompletedAt" TIMESTAMP(3),
    "ownerPasswordChanged" BOOLEAN NOT NULL DEFAULT false,
    "paidModeEnabled" BOOLEAN NOT NULL DEFAULT false,
    "freeUnitsLimit" INTEGER NOT NULL DEFAULT 1,
    "trialDurationDays" INTEGER NOT NULL DEFAULT 28,
    "emailNotificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "welcomeEmailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "adminAlertEmailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "tenantNotificationEmailEnabled" BOOLEAN NOT NULL DEFAULT false,
    "tenantSignupNotificationEnabled" BOOLEAN NOT NULL DEFAULT true,
    "digestFrequency" TEXT,
    "adminEmailRecipients" TEXT[],

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Branch" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phoneNumber" TEXT,
    "email" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isMainBranch" BOOLEAN NOT NULL DEFAULT false,
    "branchData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BusinessUnit" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unitType" "public"."BusinessUnitType" NOT NULL DEFAULT 'LOCATION',
    "address" TEXT,
    "phoneNumber" TEXT,
    "email" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "trialEndsAt" TIMESTAMP(3),
    "subscriptionTier" TEXT DEFAULT 'basic',
    "monthlyPrice" DECIMAL(8,2) DEFAULT 3999,
    "businessUnitData" JSONB,
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Plan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "billingCycle" "public"."BillingCycle" NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Subscription" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "public"."SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Payment" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" TEXT,
    "transactionId" TEXT,
    "receiptUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SystemSettings" (
    "id" TEXT NOT NULL DEFAULT 'system',
    "passwordSecurityLevel" "public"."PasswordSecurityLevel" NOT NULL DEFAULT 'MEDIUM',
    "globalAdminEmails" TEXT[],
    "newTenantAlertsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "systemAlertsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "securityAlertsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "tenantNotificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "SystemSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "displayName" TEXT,
    "email" TEXT,
    "phoneNumber" TEXT,
    "notes" TEXT,
    "photoUrl" TEXT,
    "profilePicture" TEXT,
    "photos" JSONB,
    "role" "public"."Role",
    "tenantId" TEXT,
    "businessData" JSONB,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "password" TEXT,
    "initialPasswordSet" BOOLEAN NOT NULL DEFAULT false,
    "emailNotificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "marketingEmailsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerificationToken" TEXT,
    "emailVerificationExpiry" TIMESTAMP(3),
    "emailVerifiedAt" TIMESTAMP(3),
    "googleId" TEXT,
    "authProvider" "public"."AuthProvider" NOT NULL DEFAULT 'LOCAL',
    "onboardingCompletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GymUserBranch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "accessLevel" "public"."AccessLevel" NOT NULL DEFAULT 'STAFF_ACCESS',
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "permissions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GymUserBranch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GymMemberProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "primaryBranchId" TEXT,
    "accessLevel" "public"."BranchAccessLevel" NOT NULL DEFAULT 'ALL_BRANCHES',
    "role" "public"."GymRole" NOT NULL DEFAULT 'GYM_MEMBER',
    "status" "public"."GymMemberSubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "emergencyContactRelation" TEXT,
    "medicalConditions" TEXT,
    "fitnessGoals" TEXT,
    "preferredTrainer" TEXT,
    "trainerContactNumber" TEXT,
    "gender" TEXT,
    "height" INTEGER,
    "weight" INTEGER,
    "allergies" JSONB,
    "lastVisit" TIMESTAMP(3),
    "dateOfBirth" TIMESTAMP(3),
    "totalVisits" INTEGER DEFAULT 0,
    "fitnessLevel" TEXT,
    "notifications" JSONB,
    "favoriteEquipment" TEXT,
    "averageVisitsPerWeek" INTEGER,
    "preferredWorkoutTime" TEXT,
    "joinedDate" TIMESTAMP(3),
    "membershipHistory" JSONB,
    "profileMetadata" JSONB,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "deletionReason" TEXT,
    "deletionNotes" TEXT,
    "cardStatus" "public"."GymMemberCardStatus" DEFAULT 'NO_CARD',
    "cardUid" TEXT,
    "cardAssignedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GymMemberProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CoffeeCustomerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "role" "public"."CoffeeRole" NOT NULL DEFAULT 'COFFEE_CUSTOMER',
    "status" TEXT NOT NULL DEFAULT 'active',
    "favoriteDrinks" TEXT[],
    "dietaryPreferences" TEXT,
    "loyaltyPoints" INTEGER NOT NULL DEFAULT 0,
    "visitHistory" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoffeeCustomerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SaasTenantPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "monthlyPrice" DECIMAL(8,2) NOT NULL,
    "yearlyPrice" DECIMAL(8,2),
    "maxMembers" INTEGER NOT NULL DEFAULT 100,
    "maxBranches" INTEGER NOT NULL DEFAULT 1,
    "features" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SaasTenantPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GymMembershipPlan" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(8,2) NOT NULL,
    "duration" INTEGER NOT NULL,
    "type" "public"."MembershipType" NOT NULL,
    "benefits" JSONB,
    "accessLevel" "public"."BranchAccessLevel" NOT NULL DEFAULT 'ALL_BRANCHES',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "deleteReason" TEXT,
    "deleteNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GymMembershipPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CustomerTransaction" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "gymMemberSubscriptionId" TEXT,
    "businessType" TEXT NOT NULL DEFAULT 'gym',
    "transactionCategory" TEXT NOT NULL DEFAULT 'membership',
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT DEFAULT 'PHP',
    "taxAmount" DECIMAL(12,2) DEFAULT 0,
    "discountAmount" DECIMAL(12,2) DEFAULT 0,
    "netAmount" DECIMAL(12,2) NOT NULL,
    "paymentMethod" TEXT DEFAULT 'cash',
    "paymentReference" TEXT,
    "gatewayTransactionId" TEXT,
    "transactionType" "public"."TransactionType" NOT NULL DEFAULT 'PAYMENT',
    "status" "public"."TransactionStatus" NOT NULL DEFAULT 'COMPLETED',
    "relatedEntityType" TEXT,
    "relatedEntityId" TEXT,
    "relatedEntityName" TEXT,
    "description" TEXT,
    "notes" TEXT,
    "metadata" JSONB,
    "processedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GymMemberSubscription" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "branchId" TEXT,
    "memberId" TEXT NOT NULL,
    "gymMembershipPlanId" TEXT NOT NULL,
    "status" "public"."GymMemberSubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "currency" TEXT DEFAULT 'PHP',
    "usageData" JSONB,
    "cancelledAt" TIMESTAMP(3),
    "cancellationReason" TEXT,
    "cancellationNotes" TEXT,
    "autoRenew" BOOLEAN DEFAULT true,
    "nextBillingDate" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GymMemberSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PlatformRevenue" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "tenantName" TEXT NOT NULL,
    "businessType" TEXT NOT NULL,
    "revenueType" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT DEFAULT 'PHP',
    "billingPeriodStart" DATE,
    "billingPeriodEnd" DATE,
    "paymentStatus" TEXT DEFAULT 'pending',
    "paymentDate" TIMESTAMP(3),
    "paymentMethod" TEXT,
    "paymentReference" TEXT,
    "sourceTransactionId" TEXT,
    "subscriptionPlanId" TEXT,
    "description" TEXT,
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformRevenue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MemberAuditLog" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "action" "public"."MemberAuditAction" NOT NULL,
    "reason" TEXT,
    "notes" TEXT,
    "previousState" TEXT,
    "newState" TEXT,
    "performedBy" TEXT,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemberAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EmailSettings" (
    "id" TEXT NOT NULL,
    "smtpHost" TEXT NOT NULL,
    "smtpPort" INTEGER NOT NULL,
    "smtpUser" TEXT,
    "smtpPassword" TEXT,
    "fromEmail" TEXT NOT NULL,
    "fromName" TEXT NOT NULL,
    "brevoApiKey" TEXT,
    "mailpitEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EmailTemplate" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "templateType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "htmlContent" TEXT NOT NULL,
    "textContent" TEXT,
    "variables" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EmailLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "recipientEmail" TEXT NOT NULL,
    "recipientName" TEXT,
    "templateType" TEXT NOT NULL,
    "templateId" TEXT,
    "subject" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "errorMessage" TEXT,
    "sentAt" TIMESTAMP(3),
    "provider" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SaasSubscription" (
    "id" TEXT NOT NULL,
    "businessUnitId" TEXT NOT NULL,
    "saasPlanId" TEXT,
    "planName" TEXT NOT NULL DEFAULT 'basic',
    "status" "public"."SaasSubscriptionStatus" NOT NULL DEFAULT 'TRIAL',
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "trialEndsAt" DATE,
    "monthlyPrice" DECIMAL(8,2) NOT NULL DEFAULT 3999,
    "currency" TEXT NOT NULL DEFAULT 'PHP',
    "paymentMethod" TEXT,
    "paymentReference" TEXT,
    "lastPaymentDate" TIMESTAMP(3),
    "nextBillingDate" DATE,
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,
    "cancelledAt" TIMESTAMP(3),
    "cancellationReason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SaasSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Terminal" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "tenantId" TEXT,
    "name" TEXT NOT NULL,
    "secretHash" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSeenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Terminal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InventoryCard" (
    "uid" TEXT NOT NULL,
    "status" "public"."InventoryCardStatus" NOT NULL DEFAULT 'AVAILABLE',
    "allocatedGymId" TEXT NOT NULL,
    "batchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryCard_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "public"."Card" (
    "uid" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "type" "public"."CardType" NOT NULL DEFAULT 'MONTHLY',
    "memberId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Card_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "public"."PendingMemberAssignment" (
    "gymId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "purpose" "public"."AssignmentPurpose" NOT NULL DEFAULT 'ONBOARD',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PendingMemberAssignment_pkey" PRIMARY KEY ("gymId")
);

-- CreateTable
CREATE TABLE "public"."Event" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "terminalId" TEXT,
    "type" TEXT NOT NULL,
    "cardUid" TEXT,
    "memberId" TEXT,
    "actorUserId" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "public"."Tenant"("slug");

-- CreateIndex
CREATE INDEX "Branch_deletedAt_idx" ON "public"."Branch"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Branch_tenantId_name_key" ON "public"."Branch"("tenantId", "name");

-- CreateIndex
CREATE INDEX "BusinessUnit_tenantId_idx" ON "public"."BusinessUnit"("tenantId");

-- CreateIndex
CREATE INDEX "BusinessUnit_unitType_idx" ON "public"."BusinessUnit"("unitType");

-- CreateIndex
CREATE INDEX "BusinessUnit_isPaid_idx" ON "public"."BusinessUnit"("isPaid");

-- CreateIndex
CREATE INDEX "BusinessUnit_trialEndsAt_idx" ON "public"."BusinessUnit"("trialEndsAt");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessUnit_tenantId_name_key" ON "public"."BusinessUnit"("tenantId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Plan_name_key" ON "public"."Plan"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_transactionId_key" ON "public"."Payment"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_emailVerificationToken_key" ON "public"."User"("emailVerificationToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "public"."User"("googleId");

-- CreateIndex
CREATE INDEX "GymUserBranch_tenantId_idx" ON "public"."GymUserBranch"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "GymUserBranch_userId_branchId_key" ON "public"."GymUserBranch"("userId", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "GymMemberProfile_userId_key" ON "public"."GymMemberProfile"("userId");

-- CreateIndex
CREATE INDEX "GymMemberProfile_tenantId_idx" ON "public"."GymMemberProfile"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "CoffeeCustomerProfile_userId_key" ON "public"."CoffeeCustomerProfile"("userId");

-- CreateIndex
CREATE INDEX "CoffeeCustomerProfile_tenantId_idx" ON "public"."CoffeeCustomerProfile"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "SaasTenantPlan_name_key" ON "public"."SaasTenantPlan"("name");

-- CreateIndex
CREATE INDEX "GymMembershipPlan_tenantId_idx" ON "public"."GymMembershipPlan"("tenantId");

-- CreateIndex
CREATE INDEX "GymMembershipPlan_isActive_idx" ON "public"."GymMembershipPlan"("isActive");

-- CreateIndex
CREATE INDEX "GymMembershipPlan_deletedAt_idx" ON "public"."GymMembershipPlan"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "GymMembershipPlan_tenantId_name_key" ON "public"."GymMembershipPlan"("tenantId", "name");

-- CreateIndex
CREATE INDEX "CustomerTransaction_tenantId_idx" ON "public"."CustomerTransaction"("tenantId");

-- CreateIndex
CREATE INDEX "CustomerTransaction_customerId_idx" ON "public"."CustomerTransaction"("customerId");

-- CreateIndex
CREATE INDEX "CustomerTransaction_gymMemberSubscriptionId_idx" ON "public"."CustomerTransaction"("gymMemberSubscriptionId");

-- CreateIndex
CREATE INDEX "CustomerTransaction_businessType_idx" ON "public"."CustomerTransaction"("businessType");

-- CreateIndex
CREATE INDEX "CustomerTransaction_createdAt_idx" ON "public"."CustomerTransaction"("createdAt");

-- CreateIndex
CREATE INDEX "CustomerTransaction_status_idx" ON "public"."CustomerTransaction"("status");

-- CreateIndex
CREATE INDEX "CustomerTransaction_amount_idx" ON "public"."CustomerTransaction"("amount");

-- CreateIndex
CREATE INDEX "GymMemberSubscription_tenantId_idx" ON "public"."GymMemberSubscription"("tenantId");

-- CreateIndex
CREATE INDEX "GymMemberSubscription_branchId_idx" ON "public"."GymMemberSubscription"("branchId");

-- CreateIndex
CREATE INDEX "GymMemberSubscription_memberId_idx" ON "public"."GymMemberSubscription"("memberId");

-- CreateIndex
CREATE INDEX "GymMemberSubscription_gymMembershipPlanId_idx" ON "public"."GymMemberSubscription"("gymMembershipPlanId");

-- CreateIndex
CREATE INDEX "GymMemberSubscription_status_idx" ON "public"."GymMemberSubscription"("status");

-- CreateIndex
CREATE INDEX "GymMemberSubscription_endDate_idx" ON "public"."GymMemberSubscription"("endDate");

-- CreateIndex
CREATE INDEX "PlatformRevenue_tenantId_idx" ON "public"."PlatformRevenue"("tenantId");

-- CreateIndex
CREATE INDEX "PlatformRevenue_createdAt_idx" ON "public"."PlatformRevenue"("createdAt");

-- CreateIndex
CREATE INDEX "PlatformRevenue_revenueType_idx" ON "public"."PlatformRevenue"("revenueType");

-- CreateIndex
CREATE INDEX "PlatformRevenue_paymentStatus_idx" ON "public"."PlatformRevenue"("paymentStatus");

-- CreateIndex
CREATE INDEX "MemberAuditLog_memberId_idx" ON "public"."MemberAuditLog"("memberId");

-- CreateIndex
CREATE INDEX "MemberAuditLog_performedAt_idx" ON "public"."MemberAuditLog"("performedAt");

-- CreateIndex
CREATE INDEX "MemberAuditLog_action_idx" ON "public"."MemberAuditLog"("action");

-- CreateIndex
CREATE INDEX "EmailTemplate_tenantId_idx" ON "public"."EmailTemplate"("tenantId");

-- CreateIndex
CREATE INDEX "EmailTemplate_templateType_idx" ON "public"."EmailTemplate"("templateType");

-- CreateIndex
CREATE INDEX "EmailTemplate_isActive_idx" ON "public"."EmailTemplate"("isActive");

-- CreateIndex
CREATE INDEX "EmailLog_tenantId_idx" ON "public"."EmailLog"("tenantId");

-- CreateIndex
CREATE INDEX "EmailLog_templateId_idx" ON "public"."EmailLog"("templateId");

-- CreateIndex
CREATE INDEX "EmailLog_status_idx" ON "public"."EmailLog"("status");

-- CreateIndex
CREATE INDEX "EmailLog_createdAt_idx" ON "public"."EmailLog"("createdAt");

-- CreateIndex
CREATE INDEX "SaasSubscription_businessUnitId_idx" ON "public"."SaasSubscription"("businessUnitId");

-- CreateIndex
CREATE INDEX "SaasSubscription_saasPlanId_idx" ON "public"."SaasSubscription"("saasPlanId");

-- CreateIndex
CREATE INDEX "SaasSubscription_status_idx" ON "public"."SaasSubscription"("status");

-- CreateIndex
CREATE INDEX "SaasSubscription_endDate_idx" ON "public"."SaasSubscription"("endDate");

-- CreateIndex
CREATE INDEX "SaasSubscription_nextBillingDate_idx" ON "public"."SaasSubscription"("nextBillingDate");

-- CreateIndex
CREATE INDEX "SaasSubscription_trialEndsAt_idx" ON "public"."SaasSubscription"("trialEndsAt");

-- CreateIndex
CREATE INDEX "Terminal_gymId_idx" ON "public"."Terminal"("gymId");

-- CreateIndex
CREATE INDEX "InventoryCard_allocatedGymId_status_idx" ON "public"."InventoryCard"("allocatedGymId", "status");

-- CreateIndex
CREATE INDEX "Card_gymId_uid_idx" ON "public"."Card"("gymId", "uid");

-- CreateIndex
CREATE UNIQUE INDEX "PendingMemberAssignment_memberId_key" ON "public"."PendingMemberAssignment"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "PendingMemberAssignment_gymId_key" ON "public"."PendingMemberAssignment"("gymId");

-- CreateIndex
CREATE INDEX "Event_gymId_createdAt_idx" ON "public"."Event"("gymId", "createdAt");

-- CreateIndex
CREATE INDEX "Event_type_idx" ON "public"."Event"("type");

-- AddForeignKey
ALTER TABLE "public"."Branch" ADD CONSTRAINT "Branch_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Branch" ADD CONSTRAINT "Branch_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Branch" ADD CONSTRAINT "Branch_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BusinessUnit" ADD CONSTRAINT "BusinessUnit_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Subscription" ADD CONSTRAINT "Subscription_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "public"."Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "public"."Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GymUserBranch" ADD CONSTRAINT "GymUserBranch_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GymUserBranch" ADD CONSTRAINT "GymUserBranch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GymUserBranch" ADD CONSTRAINT "GymUserBranch_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GymMemberProfile" ADD CONSTRAINT "GymMemberProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GymMemberProfile" ADD CONSTRAINT "GymMemberProfile_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GymMemberProfile" ADD CONSTRAINT "GymMemberProfile_primaryBranchId_fkey" FOREIGN KEY ("primaryBranchId") REFERENCES "public"."Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CoffeeCustomerProfile" ADD CONSTRAINT "CoffeeCustomerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CoffeeCustomerProfile" ADD CONSTRAINT "CoffeeCustomerProfile_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GymMembershipPlan" ADD CONSTRAINT "GymMembershipPlan_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GymMembershipPlan" ADD CONSTRAINT "GymMembershipPlan_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CustomerTransaction" ADD CONSTRAINT "CustomerTransaction_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CustomerTransaction" ADD CONSTRAINT "CustomerTransaction_processedBy_fkey" FOREIGN KEY ("processedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CustomerTransaction" ADD CONSTRAINT "CustomerTransaction_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CustomerTransaction" ADD CONSTRAINT "CustomerTransaction_gymMemberSubscriptionId_fkey" FOREIGN KEY ("gymMemberSubscriptionId") REFERENCES "public"."GymMemberSubscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GymMemberSubscription" ADD CONSTRAINT "GymMemberSubscription_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GymMemberSubscription" ADD CONSTRAINT "GymMemberSubscription_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GymMemberSubscription" ADD CONSTRAINT "GymMemberSubscription_gymMembershipPlanId_fkey" FOREIGN KEY ("gymMembershipPlanId") REFERENCES "public"."GymMembershipPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GymMemberSubscription" ADD CONSTRAINT "GymMemberSubscription_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PlatformRevenue" ADD CONSTRAINT "PlatformRevenue_sourceTransactionId_fkey" FOREIGN KEY ("sourceTransactionId") REFERENCES "public"."CustomerTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PlatformRevenue" ADD CONSTRAINT "PlatformRevenue_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MemberAuditLog" ADD CONSTRAINT "MemberAuditLog_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MemberAuditLog" ADD CONSTRAINT "MemberAuditLog_performedBy_fkey" FOREIGN KEY ("performedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EmailTemplate" ADD CONSTRAINT "EmailTemplate_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EmailLog" ADD CONSTRAINT "EmailLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EmailLog" ADD CONSTRAINT "EmailLog_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."EmailTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SaasSubscription" ADD CONSTRAINT "SaasSubscription_businessUnitId_fkey" FOREIGN KEY ("businessUnitId") REFERENCES "public"."BusinessUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SaasSubscription" ADD CONSTRAINT "SaasSubscription_saasPlanId_fkey" FOREIGN KEY ("saasPlanId") REFERENCES "public"."SaasTenantPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Terminal" ADD CONSTRAINT "Terminal_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "public"."Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Terminal" ADD CONSTRAINT "Terminal_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InventoryCard" ADD CONSTRAINT "InventoryCard_allocatedGymId_fkey" FOREIGN KEY ("allocatedGymId") REFERENCES "public"."Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Card" ADD CONSTRAINT "Card_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "public"."Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Card" ADD CONSTRAINT "Card_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PendingMemberAssignment" ADD CONSTRAINT "PendingMemberAssignment_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "public"."Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PendingMemberAssignment" ADD CONSTRAINT "PendingMemberAssignment_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PendingMemberAssignment" ADD CONSTRAINT "PendingMemberAssignment_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Event" ADD CONSTRAINT "Event_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "public"."Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Event" ADD CONSTRAINT "Event_terminalId_fkey" FOREIGN KEY ("terminalId") REFERENCES "public"."Terminal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Event" ADD CONSTRAINT "Event_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Event" ADD CONSTRAINT "Event_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
