-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('PAYMENT', 'REFUND', 'PARTIAL_REFUND', 'CHARGEBACK');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "CustomerSubscriptionStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED', 'SUSPENDED');

-- CreateTable
CREATE TABLE "CustomerTransaction" (
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
    "transactionType" "TransactionType" NOT NULL DEFAULT 'PAYMENT',
    "status" "TransactionStatus" NOT NULL DEFAULT 'COMPLETED',
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
CREATE TABLE "CustomerSubscription" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "membershipPlanId" TEXT NOT NULL,
    "status" "CustomerSubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
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

    CONSTRAINT "CustomerSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformRevenue" (
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

-- CreateIndex
CREATE INDEX "CustomerTransaction_tenantId_idx" ON "CustomerTransaction"("tenantId");

-- CreateIndex
CREATE INDEX "CustomerTransaction_customerId_idx" ON "CustomerTransaction"("customerId");

-- CreateIndex
CREATE INDEX "CustomerTransaction_businessType_idx" ON "CustomerTransaction"("businessType");

-- CreateIndex
CREATE INDEX "CustomerTransaction_createdAt_idx" ON "CustomerTransaction"("createdAt");

-- CreateIndex
CREATE INDEX "CustomerTransaction_status_idx" ON "CustomerTransaction"("status");

-- CreateIndex
CREATE INDEX "CustomerTransaction_amount_idx" ON "CustomerTransaction"("amount");

-- CreateIndex
CREATE INDEX "CustomerSubscription_tenantId_idx" ON "CustomerSubscription"("tenantId");

-- CreateIndex
CREATE INDEX "CustomerSubscription_customerId_idx" ON "CustomerSubscription"("customerId");

-- CreateIndex
CREATE INDEX "CustomerSubscription_membershipPlanId_idx" ON "CustomerSubscription"("membershipPlanId");

-- CreateIndex
CREATE INDEX "CustomerSubscription_status_idx" ON "CustomerSubscription"("status");

-- CreateIndex
CREATE INDEX "CustomerSubscription_endDate_idx" ON "CustomerSubscription"("endDate");

-- CreateIndex
CREATE INDEX "PlatformRevenue_tenantId_idx" ON "PlatformRevenue"("tenantId");

-- CreateIndex
CREATE INDEX "PlatformRevenue_createdAt_idx" ON "PlatformRevenue"("createdAt");

-- CreateIndex
CREATE INDEX "PlatformRevenue_revenueType_idx" ON "PlatformRevenue"("revenueType");

-- CreateIndex
CREATE INDEX "PlatformRevenue_paymentStatus_idx" ON "PlatformRevenue"("paymentStatus");

-- AddForeignKey
ALTER TABLE "CustomerTransaction" ADD CONSTRAINT "CustomerTransaction_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerTransaction" ADD CONSTRAINT "CustomerTransaction_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerTransaction" ADD CONSTRAINT "CustomerTransaction_processedBy_fkey" FOREIGN KEY ("processedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerSubscription" ADD CONSTRAINT "CustomerSubscription_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerSubscription" ADD CONSTRAINT "CustomerSubscription_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerSubscription" ADD CONSTRAINT "CustomerSubscription_membershipPlanId_fkey" FOREIGN KEY ("membershipPlanId") REFERENCES "MembershipPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformRevenue" ADD CONSTRAINT "PlatformRevenue_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformRevenue" ADD CONSTRAINT "PlatformRevenue_sourceTransactionId_fkey" FOREIGN KEY ("sourceTransactionId") REFERENCES "CustomerTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
