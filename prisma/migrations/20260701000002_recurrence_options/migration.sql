ALTER TYPE "AnnouncementRecurrence" ADD VALUE 'DAILY';
ALTER TYPE "AnnouncementRecurrence" ADD VALUE 'BIWEEKLY';
ALTER TYPE "AnnouncementRecurrence" ADD VALUE 'QUARTERLY';
ALTER TYPE "AnnouncementRecurrence" ADD VALUE 'YEARLY';
ALTER TYPE "AnnouncementRecurrence" ADD VALUE 'CUSTOM';

ALTER TYPE "InvoiceRecurrence" ADD VALUE 'DAILY';
ALTER TYPE "InvoiceRecurrence" ADD VALUE 'BIWEEKLY';
ALTER TYPE "InvoiceRecurrence" ADD VALUE 'QUARTERLY';
ALTER TYPE "InvoiceRecurrence" ADD VALUE 'YEARLY';
ALTER TYPE "InvoiceRecurrence" ADD VALUE 'CUSTOM';

ALTER TABLE "Invoice" ADD COLUMN "recurrenceStartAt" TIMESTAMP(3);
