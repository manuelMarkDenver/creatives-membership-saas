/*
  Warnings:

  - You are about to drop the column `membershipPlanId` on the `GymMemberSubscription` table. All the data in the column will be lost.
  - You are about to drop the `MembershipPlan` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `gymMembershipPlanId` on table `GymMemberSubscription` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."GymMemberSubscription" DROP CONSTRAINT "GymMemberSubscription_gymMembershipPlanId_fkey";

-- DropForeignKey
ALTER TABLE "public"."GymMemberSubscription" DROP CONSTRAINT "GymMemberSubscription_membershipPlanId_fkey";

-- DropForeignKey
ALTER TABLE "public"."MembershipPlan" DROP CONSTRAINT "MembershipPlan_tenantId_fkey";

-- DropIndex
DROP INDEX "public"."GymMemberSubscription_membershipPlanId_idx";

-- AlterTable
ALTER TABLE "public"."GymMemberSubscription" DROP COLUMN "membershipPlanId",
ALTER COLUMN "gymMembershipPlanId" SET NOT NULL;

-- DropTable
DROP TABLE "public"."MembershipPlan";

-- AddForeignKey
ALTER TABLE "public"."GymMemberSubscription" ADD CONSTRAINT "GymMemberSubscription_gymMembershipPlanId_fkey" FOREIGN KEY ("gymMembershipPlanId") REFERENCES "public"."GymMembershipPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
