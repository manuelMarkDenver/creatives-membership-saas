/*
  Warnings:

  - The values [ADMIN,MEMBER,CUSTOMER,SHOPPER] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."AccessLevel" AS ENUM ('FULL_ACCESS', 'MANAGER_ACCESS', 'STAFF_ACCESS', 'READ_ONLY');

-- AlterEnum
BEGIN;
CREATE TYPE "public"."Role_new" AS ENUM ('SUPER_ADMIN', 'OWNER', 'MANAGER', 'STAFF', 'GYM_TRAINER', 'GYM_NUTRITIONIST', 'GYM_FRONT_DESK', 'GYM_MAINTENANCE', 'GYM_MEMBER', 'STORE_MANAGER', 'PRODUCT_MANAGER', 'INVENTORY_MANAGER', 'CUSTOMER_SERVICE', 'MARKETING_MANAGER', 'FULFILLMENT_STAFF', 'VENDOR', 'ECOM_CUSTOMER', 'COFFEE_MANAGER', 'BARISTA', 'CASHIER', 'BAKER', 'SHIFT_SUPERVISOR', 'COFFEE_CUSTOMER');
ALTER TABLE "public"."User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "public"."User" ALTER COLUMN "role" TYPE "public"."Role_new" USING ("role"::text::"public"."Role_new");
ALTER TYPE "public"."Role" RENAME TO "Role_old";
ALTER TYPE "public"."Role_new" RENAME TO "Role";
DROP TYPE "public"."Role_old";
ALTER TABLE "public"."User" ALTER COLUMN "role" SET DEFAULT 'GYM_MEMBER';
COMMIT;

-- AlterTable
ALTER TABLE "public"."User" ALTER COLUMN "role" SET DEFAULT 'GYM_MEMBER';

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

-- CreateIndex
CREATE UNIQUE INDEX "Branch_tenantId_name_key" ON "public"."Branch"("tenantId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "UserBranch_userId_branchId_key" ON "public"."UserBranch"("userId", "branchId");

-- AddForeignKey
ALTER TABLE "public"."Branch" ADD CONSTRAINT "Branch_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserBranch" ADD CONSTRAINT "UserBranch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserBranch" ADD CONSTRAINT "UserBranch_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
