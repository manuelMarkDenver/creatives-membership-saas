-- CreateEnum
CREATE TYPE "public"."MemberAuditAction" AS ENUM ('ACCOUNT_CREATED', 'ACCOUNT_ACTIVATED', 'ACCOUNT_DEACTIVATED', 'ACCOUNT_DELETED', 'ACCOUNT_RESTORED', 'SUBSCRIPTION_STARTED', 'SUBSCRIPTION_RENEWED', 'SUBSCRIPTION_CANCELLED', 'SUBSCRIPTION_EXPIRED', 'SUBSCRIPTION_SUSPENDED', 'SUBSCRIPTION_RESUMED', 'PAYMENT_RECEIVED', 'PAYMENT_FAILED', 'PAYMENT_REFUNDED', 'PROFILE_UPDATED', 'PROFILE_PHOTO_UPDATED', 'FACILITY_ACCESS_GRANTED', 'FACILITY_ACCESS_REVOKED', 'LOGIN_SUCCESSFUL', 'LOGIN_FAILED');

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

-- CreateIndex
CREATE INDEX "MemberAuditLog_memberId_idx" ON "public"."MemberAuditLog"("memberId");

-- CreateIndex
CREATE INDEX "MemberAuditLog_performedAt_idx" ON "public"."MemberAuditLog"("performedAt");

-- CreateIndex
CREATE INDEX "MemberAuditLog_action_idx" ON "public"."MemberAuditLog"("action");

-- AddForeignKey
ALTER TABLE "public"."MemberAuditLog" ADD CONSTRAINT "MemberAuditLog_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MemberAuditLog" ADD CONSTRAINT "MemberAuditLog_performedBy_fkey" FOREIGN KEY ("performedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
