-- CreateEnum
CREATE TYPE "public"."MembershipType" AS ENUM ('DAY_PASS', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL', 'UNLIMITED', 'STUDENT', 'SENIOR', 'CORPORATE');

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

-- CreateIndex
CREATE UNIQUE INDEX "MembershipPlan_tenantId_name_key" ON "public"."MembershipPlan"("tenantId", "name");

-- AddForeignKey
ALTER TABLE "public"."MembershipPlan" ADD CONSTRAINT "MembershipPlan_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
