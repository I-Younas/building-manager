-- AlterEnum
ALTER TYPE "AnnouncementAudience" ADD VALUE 'FLOORS';

-- AlterTable
ALTER TABLE "Announcement" ADD COLUMN     "targetFloors" TEXT[] DEFAULT ARRAY[]::TEXT[];
