-- CreateEnum
CREATE TYPE "LeaseStatus" AS ENUM ('ACTIVE', 'SUPERSEDED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "RenewalStatus" AS ENUM ('PENDING_DECISION', 'RENEWAL_IN_PROGRESS', 'RENEWED', 'NOT_RENEWING');

-- AlterTable
ALTER TABLE "UnitResident" DROP COLUMN "leaseEndDate",
DROP COLUMN "leaseStartDate",
DROP COLUMN "renewalSigned";

-- CreateTable
CREATE TABLE "Lease" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "primaryResidentId" TEXT NOT NULL,
    "leaseStartDate" TIMESTAMP(3) NOT NULL,
    "leaseEndDate" TIMESTAMP(3) NOT NULL,
    "status" "LeaseStatus" NOT NULL DEFAULT 'ACTIVE',
    "renewalStatus" "RenewalStatus",
    "previousLeaseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lease_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Lease_previousLeaseId_key" ON "Lease"("previousLeaseId");

-- CreateIndex
CREATE INDEX "Lease_unitId_status_idx" ON "Lease"("unitId", "status");

-- AddForeignKey
ALTER TABLE "Lease" ADD CONSTRAINT "Lease_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lease" ADD CONSTRAINT "Lease_primaryResidentId_fkey" FOREIGN KEY ("primaryResidentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lease" ADD CONSTRAINT "Lease_previousLeaseId_fkey" FOREIGN KEY ("previousLeaseId") REFERENCES "Lease"("id") ON DELETE SET NULL ON UPDATE CASCADE;

