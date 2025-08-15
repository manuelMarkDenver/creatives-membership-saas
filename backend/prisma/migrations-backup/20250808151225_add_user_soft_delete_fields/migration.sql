/*
  Warnings:

  - The values [PARTIAL_REFUND] on the enum `TransactionType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."CustomerSubscriptionStatus" ADD VALUE 'INACTIVE';
ALTER TYPE "public"."CustomerSubscriptionStatus" ADD VALUE 'PENDING_ACTIVATION';

-- AlterEnum
ALTER TYPE "public"."TransactionStatus" ADD VALUE 'PROCESSING';

-- AlterEnum
BEGIN;
CREATE TYPE "public"."TransactionType_new" AS ENUM ('PAYMENT', 'REFUND', 'ADJUSTMENT', 'REVERSAL', 'CHARGEBACK');
ALTER TABLE "public"."CustomerTransaction" ALTER COLUMN "transactionType" DROP DEFAULT;
ALTER TABLE "public"."CustomerTransaction" ALTER COLUMN "transactionType" TYPE "public"."TransactionType_new" USING ("transactionType"::text::"public"."TransactionType_new");
ALTER TYPE "public"."TransactionType" RENAME TO "TransactionType_old";
ALTER TYPE "public"."TransactionType_new" RENAME TO "TransactionType";
DROP TYPE "public"."TransactionType_old";
ALTER TABLE "public"."CustomerTransaction" ALTER COLUMN "transactionType" SET DEFAULT 'PAYMENT';
COMMIT;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedBy" TEXT;

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
