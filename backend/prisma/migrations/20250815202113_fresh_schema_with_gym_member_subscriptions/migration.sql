-- CreateEnum
CREATE TYPE "public"."BusinessCategory" AS ENUM ('GYM', 'COFFEE_SHOP', 'ECOMMERCE', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('SUPER_ADMIN', 'OWNER', 'MANAGER', 'STAFF', 'GYM_TRAINER', 'GYM_NUTRITIONIST', 'GYM_FRONT_DESK', 'GYM_MAINTENANCE', 'GYM_MEMBER', 'STORE_MANAGER', 'PRODUCT_MANAGER', 'INVENTORY_MANAGER', 'CUSTOMER_SERVICE', 'MARKETING_MANAGER', 'FULFILLMENT_STAFF', 'VENDOR', 'ECOM_CUSTOMER', 'COFFEE_MANAGER', 'BARISTA', 'CASHIER', 'BAKER', 'SHIFT_SUPERVISOR', 'COFFEE_CUSTOMER');

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
CREATE TYPE "public"."GymMemberSubscriptionStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'CANCELLED', 'EXPIRED', 'PENDING_ACTIVATION');

-- CreateEnum
CREATE TYPE "public"."MemberAuditAction" AS ENUM ('ACCOUNT_CREATED', 'ACCOUNT_ACTIVATED', 'ACCOUNT_DEACTIVATED', 'ACCOUNT_DELETED', 'ACCOUNT_RESTORED', 'SUBSCRIPTION_STARTED', 'SUBSCRIPTION_RENEWED', 'SUBSCRIPTION_CANCELLED', 'SUBSCRIPTION_EXPIRED', 'SUBSCRIPTION_SUSPENDED', 'SUBSCRIPTION_RESUMED', 'PAYMENT_RECEIVED', 'PAYMENT_FAILED', 'PAYMENT_REFUNDED', 'PROFILE_UPDATED', 'PROFILE_PHOTO_UPDATED', 'FACILITY_ACCESS_GRANTED', 'FACILITY_ACCESS_REVOKED', 'LOGIN_SUCCESSFUL', 'LOGIN_FAILED');

-- CreateEnum
CREATE TYPE "public"."BusinessUnitType" AS ENUM ('LOCATION', 'CHANNEL', 'DEPARTMENT', 'FRANCHISE');

-- CreateEnum
CREATE TYPE "public"."SaasSubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'PAST_DUE', 'SUSPENDED', 'CANCELLED', 'EXPIRED');

-- CreateTable
CREATE TABLE "public"."Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" "public"."BusinessCategory" NOT NULL,
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
    "paidModeEnabled" BOOLEAN NOT NULL DEFAULT false,
    "freeUnitsLimit" INTEGER NOT NULL DEFAULT 1,
    "trialDurationDays" INTEGER NOT NULL DEFAULT 28,

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
    "branchData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

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
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phoneNumber" TEXT,
    "role" "public"."Role" NOT NULL DEFAULT 'GYM_MEMBER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "photoUrl" TEXT,
    "businessData" JSONB,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT,
    "password" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserBranch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "accessLevel" "public"."AccessLevel" NOT NULL DEFAULT 'STAFF_ACCESS',
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "permissions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserBranch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MembershipPlan" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(65,30) NOT NULL,
    "duration" INTEGER NOT NULL,
    "type" "public"."MembershipType" NOT NULL,
    "benefits" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MembershipPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CustomerTransaction" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
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
    "membershipPlanId" TEXT NOT NULL,
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
CREATE TABLE "public"."SaasSubscription" (
    "id" TEXT NOT NULL,
    "businessUnitId" TEXT NOT NULL,
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

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "public"."Tenant"("slug");

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
CREATE UNIQUE INDEX "UserBranch_userId_branchId_key" ON "public"."UserBranch"("userId", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "MembershipPlan_tenantId_name_key" ON "public"."MembershipPlan"("tenantId", "name");

-- CreateIndex
CREATE INDEX "CustomerTransaction_tenantId_idx" ON "public"."CustomerTransaction"("tenantId");

-- CreateIndex
CREATE INDEX "CustomerTransaction_customerId_idx" ON "public"."CustomerTransaction"("customerId");

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
CREATE INDEX "GymMemberSubscription_membershipPlanId_idx" ON "public"."GymMemberSubscription"("membershipPlanId");

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
CREATE INDEX "SaasSubscription_businessUnitId_idx" ON "public"."SaasSubscription"("businessUnitId");

-- CreateIndex
CREATE INDEX "SaasSubscription_status_idx" ON "public"."SaasSubscription"("status");

-- CreateIndex
CREATE INDEX "SaasSubscription_endDate_idx" ON "public"."SaasSubscription"("endDate");

-- CreateIndex
CREATE INDEX "SaasSubscription_nextBillingDate_idx" ON "public"."SaasSubscription"("nextBillingDate");

-- CreateIndex
CREATE INDEX "SaasSubscription_trialEndsAt_idx" ON "public"."SaasSubscription"("trialEndsAt");

-- AddForeignKey
ALTER TABLE "public"."Branch" ADD CONSTRAINT "Branch_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BusinessUnit" ADD CONSTRAINT "BusinessUnit_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Subscription" ADD CONSTRAINT "Subscription_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "public"."Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "public"."Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserBranch" ADD CONSTRAINT "UserBranch_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserBranch" ADD CONSTRAINT "UserBranch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MembershipPlan" ADD CONSTRAINT "MembershipPlan_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CustomerTransaction" ADD CONSTRAINT "CustomerTransaction_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CustomerTransaction" ADD CONSTRAINT "CustomerTransaction_processedBy_fkey" FOREIGN KEY ("processedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CustomerTransaction" ADD CONSTRAINT "CustomerTransaction_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GymMemberSubscription" ADD CONSTRAINT "GymMemberSubscription_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GymMemberSubscription" ADD CONSTRAINT "GymMemberSubscription_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GymMemberSubscription" ADD CONSTRAINT "GymMemberSubscription_membershipPlanId_fkey" FOREIGN KEY ("membershipPlanId") REFERENCES "public"."MembershipPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
ALTER TABLE "public"."SaasSubscription" ADD CONSTRAINT "SaasSubscription_businessUnitId_fkey" FOREIGN KEY ("businessUnitId") REFERENCES "public"."BusinessUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
