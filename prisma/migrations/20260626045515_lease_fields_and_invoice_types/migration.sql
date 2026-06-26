-- CreateEnum
CREATE TYPE "InvoiceType" AS ENUM ('RENT', 'SERVICE');

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "billedToUserId" TEXT,
ADD COLUMN     "rentPeriodEnd" TIMESTAMP(3),
ADD COLUMN     "rentPeriodStart" TIMESTAMP(3),
ADD COLUMN     "serviceDescription" TEXT,
ADD COLUMN     "servicePeriodEnd" TIMESTAMP(3),
ADD COLUMN     "servicePeriodStart" TIMESTAMP(3),
ADD COLUMN     "type" "InvoiceType" NOT NULL DEFAULT 'RENT',
ALTER COLUMN "unitId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "UnitResident" ADD COLUMN     "leaseEndDate" TIMESTAMP(3),
ADD COLUMN     "leaseStartDate" TIMESTAMP(3),
ADD COLUMN     "renewalSigned" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Invoice_billedToUserId_idx" ON "Invoice"("billedToUserId");

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_billedToUserId_fkey" FOREIGN KEY ("billedToUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
