/*
  Warnings:

  - You are about to drop the column `buildingId` on the `Announcement` table. All the data in the column will be lost.
  - You are about to drop the column `scope` on the `Announcement` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "AnnouncementAudience" AS ENUM ('ALL_ORG', 'BUILDINGS', 'UNITS', 'INDIVIDUALS');

-- CreateEnum
CREATE TYPE "AnnouncementCategory" AS ENUM ('GENERAL', 'MAINTENANCE', 'EMERGENCY', 'POLICY', 'EVENT', 'BILLING', 'AMENITY');

-- CreateEnum
CREATE TYPE "AnnouncementPriority" AS ENUM ('NORMAL', 'IMPORTANT', 'URGENT');

-- CreateEnum
CREATE TYPE "AnnouncementStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'SENT');

-- CreateEnum
CREATE TYPE "AnnouncementRecurrence" AS ENUM ('NONE', 'WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "RecipientOverrideMode" AS ENUM ('INCLUDE', 'EXCLUDE');

-- CreateEnum
CREATE TYPE "AnnouncementDeliveryStatus" AS ENUM ('QUEUED', 'SENT', 'DELIVERED', 'BOUNCED', 'FAILED');

-- DropForeignKey
ALTER TABLE "Announcement" DROP CONSTRAINT "Announcement_buildingId_fkey";

-- DropIndex
DROP INDEX "Announcement_buildingId_idx";

-- AlterTable
ALTER TABLE "Announcement" DROP COLUMN "buildingId",
DROP COLUMN "scope",
ADD COLUMN     "acknowledgmentReminderDays" INTEGER,
ADD COLUMN     "allowReplies" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "audience" "AnnouncementAudience" NOT NULL DEFAULT 'ALL_ORG',
ADD COLUMN     "category" "AnnouncementCategory" NOT NULL DEFAULT 'GENERAL',
ADD COLUMN     "correctsAnnouncementId" TEXT,
ADD COLUMN     "isTemplate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "nextRunAt" TIMESTAMP(3),
ADD COLUMN     "priority" "AnnouncementPriority" NOT NULL DEFAULT 'NORMAL',
ADD COLUMN     "recurrence" "AnnouncementRecurrence" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "recurrenceEndsAt" TIMESTAMP(3),
ADD COLUMN     "requireAcknowledgment" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "scheduledAt" TIMESTAMP(3),
ADD COLUMN     "status" "AnnouncementStatus" NOT NULL DEFAULT 'SENT',
ADD COLUMN     "targetBuildingIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "targetUnitIds" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "MaintenanceTicket" ADD COLUMN     "assignedAt" TIMESTAMP(3);

-- DropEnum
DROP TYPE "AnnouncementScope";

-- CreateTable
CREATE TABLE "AnnouncementAttachment" (
    "id" TEXT NOT NULL,
    "announcementId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "contentType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnnouncementAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnnouncementRecipientOverride" (
    "id" TEXT NOT NULL,
    "announcementId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mode" "RecipientOverrideMode" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnnouncementRecipientOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnnouncementAcknowledgment" (
    "id" TEXT NOT NULL,
    "announcementId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "acknowledgedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnnouncementAcknowledgment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnnouncementDelivery" (
    "id" TEXT NOT NULL,
    "announcementId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "resendMessageId" TEXT,
    "status" "AnnouncementDeliveryStatus" NOT NULL DEFAULT 'QUEUED',
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "bouncedAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "reminderSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnnouncementDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnnouncementAttachment_announcementId_idx" ON "AnnouncementAttachment"("announcementId");

-- CreateIndex
CREATE UNIQUE INDEX "AnnouncementRecipientOverride_announcementId_userId_key" ON "AnnouncementRecipientOverride"("announcementId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "AnnouncementAcknowledgment_announcementId_userId_key" ON "AnnouncementAcknowledgment"("announcementId", "userId");

-- CreateIndex
CREATE INDEX "AnnouncementDelivery_resendMessageId_idx" ON "AnnouncementDelivery"("resendMessageId");

-- CreateIndex
CREATE UNIQUE INDEX "AnnouncementDelivery_announcementId_userId_key" ON "AnnouncementDelivery"("announcementId", "userId");

-- CreateIndex
CREATE INDEX "Announcement_organizationId_status_idx" ON "Announcement"("organizationId", "status");

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_correctsAnnouncementId_fkey" FOREIGN KEY ("correctsAnnouncementId") REFERENCES "Announcement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementAttachment" ADD CONSTRAINT "AnnouncementAttachment_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "Announcement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementRecipientOverride" ADD CONSTRAINT "AnnouncementRecipientOverride_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "Announcement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementRecipientOverride" ADD CONSTRAINT "AnnouncementRecipientOverride_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementAcknowledgment" ADD CONSTRAINT "AnnouncementAcknowledgment_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "Announcement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementAcknowledgment" ADD CONSTRAINT "AnnouncementAcknowledgment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementDelivery" ADD CONSTRAINT "AnnouncementDelivery_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "Announcement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementDelivery" ADD CONSTRAINT "AnnouncementDelivery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
