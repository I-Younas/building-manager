-- AddForeignKey
ALTER TABLE "InviteCode" ADD CONSTRAINT "InviteCode_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
