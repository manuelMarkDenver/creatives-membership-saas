/*
  Warnings:

  - You are about to drop the column `emergencyContact` on the `GymMemberProfile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."GymMemberProfile" DROP COLUMN "emergencyContact",
ADD COLUMN     "emergencyContactName" TEXT,
ADD COLUMN     "emergencyContactPhone" TEXT,
ADD COLUMN     "emergencyContactRelation" TEXT,
ADD COLUMN     "joinedDate" TIMESTAMP(3),
ADD COLUMN     "trainerContactNumber" TEXT;
