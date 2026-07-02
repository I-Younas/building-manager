ALTER TABLE "InviteCode" ADD COLUMN "buildingId" TEXT;
ALTER TABLE "InviteCode" ADD COLUMN "unitNumber" TEXT;
ALTER TABLE "InviteCode" ADD CONSTRAINT "InviteCode_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE SET NULL ON UPDATE CASCADE;
