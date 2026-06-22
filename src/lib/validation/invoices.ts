import { z } from "zod";

export const createInvoiceSchema = z.object({
  unitId: z.string().trim().min(1, "Select a unit"),
  dueDate: z.string().min(1, "Select a due date"),
});

export const recordPaymentSchema = z.object({
  amountCents: z.coerce.number().int().positive("Enter a valid amount"),
  method: z.enum(["CASH", "BANK_TRANSFER", "CHEQUE", "CARD", "ONLINE", "OTHER"]),
  paidAt: z.string().min(1, "Select a payment date"),
  reference: z.string().trim().max(200).optional().or(z.literal("")),
});
