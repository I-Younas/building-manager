ALTER TABLE "Invoice" ADD COLUMN "stripeCheckoutSessionId" TEXT;
CREATE UNIQUE INDEX "Invoice_stripeCheckoutSessionId_key" ON "Invoice"("stripeCheckoutSessionId");
