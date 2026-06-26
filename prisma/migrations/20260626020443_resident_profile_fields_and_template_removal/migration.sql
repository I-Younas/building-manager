/*
  Warnings:

  - You are about to drop the column `isTemplate` on the `Announcement` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Announcement" DROP COLUMN "isTemplate";

-- AlterTable
ALTER TABLE "UnitResident" ALTER COLUMN "relationship" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "emergencyContactName" TEXT,
ADD COLUMN     "emergencyContactPhone" TEXT,
ADD COLUMN     "phone" TEXT;
