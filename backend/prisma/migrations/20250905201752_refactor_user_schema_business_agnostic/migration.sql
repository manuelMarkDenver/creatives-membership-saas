/*
  Warnings:

  - You are about to drop the column `isActive` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `User` table. All the data in the column will be lost.
  - Added the required column `tenantId` to the `CoffeeCustomerProfile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `GymMemberProfile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `UserBranch` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."User" DROP CONSTRAINT "User_tenantId_fkey";

-- AlterTable
ALTER TABLE "public"."CoffeeCustomerProfile" ADD COLUMN     "role" "public"."Role" NOT NULL DEFAULT 'COFFEE_CUSTOMER',
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active',
ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."GymMemberProfile" ADD COLUMN     "role" "public"."Role" NOT NULL DEFAULT 'GYM_MEMBER',
ADD COLUMN     "status" "public"."GymMemberSubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "isActive",
DROP COLUMN "name",
DROP COLUMN "role",
DROP COLUMN "tenantId";

-- AlterTable
ALTER TABLE "public"."UserBranch" ADD COLUMN     "tenantId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "CoffeeCustomerProfile_tenantId_idx" ON "public"."CoffeeCustomerProfile"("tenantId");

-- CreateIndex
CREATE INDEX "GymMemberProfile_tenantId_idx" ON "public"."GymMemberProfile"("tenantId");

-- CreateIndex
CREATE INDEX "UserBranch_tenantId_idx" ON "public"."UserBranch"("tenantId");

-- AddForeignKey
ALTER TABLE "public"."UserBranch" ADD CONSTRAINT "UserBranch_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GymMemberProfile" ADD CONSTRAINT "GymMemberProfile_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CoffeeCustomerProfile" ADD CONSTRAINT "CoffeeCustomerProfile_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
