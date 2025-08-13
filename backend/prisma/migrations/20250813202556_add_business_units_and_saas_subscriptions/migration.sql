-- CreateEnum
CREATE TYPE "public"."BusinessUnitType" AS ENUM ('LOCATION', 'CHANNEL', 'DEPARTMENT', 'FRANCHISE');

-- CreateEnum
CREATE TYPE "public"."SaasSubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'PAST_DUE', 'SUSPENDED', 'CANCELLED', 'EXPIRED');

-- AlterTable
ALTER TABLE "public"."Tenant" ADD COLUMN     "freeUnitsLimit" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "paidModeEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "trialDurationDays" INTEGER NOT NULL DEFAULT 28;

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
ALTER TABLE "public"."BusinessUnit" ADD CONSTRAINT "BusinessUnit_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SaasSubscription" ADD CONSTRAINT "SaasSubscription_businessUnitId_fkey" FOREIGN KEY ("businessUnitId") REFERENCES "public"."BusinessUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
