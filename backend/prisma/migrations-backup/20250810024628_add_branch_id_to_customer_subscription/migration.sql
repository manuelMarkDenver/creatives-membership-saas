-- AlterTable
ALTER TABLE "public"."CustomerSubscription" ADD COLUMN     "branchId" TEXT;

-- CreateIndex
CREATE INDEX "CustomerSubscription_branchId_idx" ON "public"."CustomerSubscription"("branchId");

-- AddForeignKey
ALTER TABLE "public"."CustomerSubscription" ADD CONSTRAINT "CustomerSubscription_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
