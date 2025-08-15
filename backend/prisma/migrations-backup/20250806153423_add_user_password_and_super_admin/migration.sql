-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "name" TEXT,
ADD COLUMN     "password" TEXT,
ALTER COLUMN "tenantId" DROP NOT NULL;
