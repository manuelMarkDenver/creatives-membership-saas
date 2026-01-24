-- CreateTable
CREATE TABLE "TapCooldown" (
    "terminalId" TEXT NOT NULL,
    "cardUid" TEXT NOT NULL,
    "lastTapAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TapCooldown_pkey" PRIMARY KEY ("terminalId","cardUid")
);

-- AddForeignKey
ALTER TABLE "TapCooldown" ADD CONSTRAINT "TapCooldown_terminalId_fkey" FOREIGN KEY ("terminalId") REFERENCES "Terminal"("id") ON DELETE CASCADE ON UPDATE CASCADE;