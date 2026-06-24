/*
  Warnings:

  - You are about to drop the `Facility` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FacilityBooking` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Visitor` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Facility" DROP CONSTRAINT "Facility_buildingId_fkey";

-- DropForeignKey
ALTER TABLE "FacilityBooking" DROP CONSTRAINT "FacilityBooking_approvedById_fkey";

-- DropForeignKey
ALTER TABLE "FacilityBooking" DROP CONSTRAINT "FacilityBooking_facilityId_fkey";

-- DropForeignKey
ALTER TABLE "FacilityBooking" DROP CONSTRAINT "FacilityBooking_requestedById_fkey";

-- DropForeignKey
ALTER TABLE "FacilityBooking" DROP CONSTRAINT "FacilityBooking_unitId_fkey";

-- DropForeignKey
ALTER TABLE "Visitor" DROP CONSTRAINT "Visitor_registeredById_fkey";

-- DropForeignKey
ALTER TABLE "Visitor" DROP CONSTRAINT "Visitor_unitId_fkey";

-- DropTable
DROP TABLE "Facility";

-- DropTable
DROP TABLE "FacilityBooking";

-- DropTable
DROP TABLE "Visitor";

-- DropEnum
DROP TYPE "BookingStatus";

-- DropEnum
DROP TYPE "VisitorStatus";
