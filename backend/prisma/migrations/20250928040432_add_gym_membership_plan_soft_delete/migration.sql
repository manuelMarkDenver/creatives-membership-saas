-- AlterTable
ALTER TABLE "public"."GymMemberSubscription" ADD COLUMN     "gymMembershipPlanId" TEXT;

-- AlterTable
ALTER TABLE "public"."SaasSubscription" ADD COLUMN     "saasPlanId" TEXT;

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
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "deleteReason" TEXT,
    "deleteNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GymMembershipPlan_pkey" PRIMARY KEY ("id")
);

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
CREATE INDEX "GymMemberSubscription_gymMembershipPlanId_idx" ON "public"."GymMemberSubscription"("gymMembershipPlanId");

-- CreateIndex
CREATE INDEX "SaasSubscription_saasPlanId_idx" ON "public"."SaasSubscription"("saasPlanId");

-- AddForeignKey
ALTER TABLE "public"."GymMembershipPlan" ADD CONSTRAINT "GymMembershipPlan_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GymMembershipPlan" ADD CONSTRAINT "GymMembershipPlan_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GymMemberSubscription" ADD CONSTRAINT "GymMemberSubscription_gymMembershipPlanId_fkey" FOREIGN KEY ("gymMembershipPlanId") REFERENCES "public"."GymMembershipPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SaasSubscription" ADD CONSTRAINT "SaasSubscription_saasPlanId_fkey" FOREIGN KEY ("saasPlanId") REFERENCES "public"."SaasTenantPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
