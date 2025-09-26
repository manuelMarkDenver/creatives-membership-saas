/*
  Warnings:

  - The values [GYM_TRAINER,GYM_NUTRITIONIST,GYM_FRONT_DESK,GYM_MAINTENANCE,GYM_MEMBER,STORE_MANAGER,PRODUCT_MANAGER,INVENTORY_MANAGER,CUSTOMER_SERVICE,MARKETING_MANAGER,FULFILLMENT_STAFF,VENDOR,ECOM_CUSTOMER,COFFEE_MANAGER,BARISTA,CASHIER,BAKER,SHIFT_SUPERVISOR,COFFEE_CUSTOMER] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - The `role` column on the `CoffeeCustomerProfile` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `role` column on the `GymMemberProfile` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `UserBranch` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."GymRole" AS ENUM ('GYM_TRAINER', 'GYM_NUTRITIONIST', 'GYM_FRONT_DESK', 'GYM_MAINTENANCE', 'GYM_MEMBER');

-- CreateEnum
CREATE TYPE "public"."CoffeeRole" AS ENUM ('COFFEE_MANAGER', 'BARISTA', 'CASHIER', 'BAKER', 'SHIFT_SUPERVISOR', 'COFFEE_CUSTOMER');

-- CreateEnum
CREATE TYPE "public"."EcommerceRole" AS ENUM ('STORE_MANAGER', 'PRODUCT_MANAGER', 'INVENTORY_MANAGER', 'CUSTOMER_SERVICE', 'MARKETING_MANAGER', 'FULFILLMENT_STAFF', 'VENDOR', 'ECOM_CUSTOMER');

-- AlterEnum
BEGIN;
CREATE TYPE "public"."Role_new" AS ENUM ('SUPER_ADMIN', 'OWNER', 'MANAGER', 'STAFF', 'CLIENT');
ALTER TABLE "public"."CoffeeCustomerProfile" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "public"."GymMemberProfile" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "public"."User" ALTER COLUMN "role" TYPE "public"."Role_new" USING ("role"::text::"public"."Role_new");
ALTER TABLE "public"."User" ALTER COLUMN "globalRole" TYPE "public"."Role_new" USING ("globalRole"::text::"public"."Role_new");
ALTER TYPE "public"."Role" RENAME TO "Role_old";
ALTER TYPE "public"."Role_new" RENAME TO "Role";
DROP TYPE "public"."Role_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."UserBranch" DROP CONSTRAINT "UserBranch_branchId_fkey";

-- DropForeignKey
ALTER TABLE "public"."UserBranch" DROP CONSTRAINT "UserBranch_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "public"."UserBranch" DROP CONSTRAINT "UserBranch_userId_fkey";

-- DropIndex
DROP INDEX "public"."CoffeeCustomerProfile_userId_idx";

-- DropIndex
DROP INDEX "public"."GymMemberProfile_userId_idx";

-- AlterTable
ALTER TABLE "public"."CoffeeCustomerProfile" DROP COLUMN "role",
ADD COLUMN     "role" "public"."CoffeeRole" NOT NULL DEFAULT 'COFFEE_CUSTOMER';

-- AlterTable
ALTER TABLE "public"."GymMemberProfile" DROP COLUMN "role",
ADD COLUMN     "role" "public"."GymRole" NOT NULL DEFAULT 'GYM_MEMBER';

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "globalRole" "public"."Role",
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "photos" JSONB,
ADD COLUMN     "role" "public"."Role",
ADD COLUMN     "tenantId" TEXT;

-- DropTable
DROP TABLE "public"."UserBranch";

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

-- CreateIndex
CREATE INDEX "GymUserBranch_tenantId_idx" ON "public"."GymUserBranch"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "GymUserBranch_userId_branchId_key" ON "public"."GymUserBranch"("userId", "branchId");

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GymUserBranch" ADD CONSTRAINT "GymUserBranch_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GymUserBranch" ADD CONSTRAINT "GymUserBranch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GymUserBranch" ADD CONSTRAINT "GymUserBranch_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
