CREATE TYPE "InvoiceRecurrence" AS ENUM ('NONE', 'WEEKLY', 'MONTHLY');
ALTER TABLE "Invoice" ADD COLUMN "recurrence" "InvoiceRecurrence" NOT NULL DEFAULT 'NONE';
ALTER TABLE "Invoice" ADD COLUMN "recurrenceEndsAt" TIMESTAMP(3);
