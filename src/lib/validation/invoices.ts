import { z } from "zod";

export const createInvoiceSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("RENT"),
    unitId: z.string().trim().min(1, "Select a unit"),
    dueDate: z.string().min(1, "Select a due date"),
    rentPeriodStart: z.string().min(1, "Select a rent period start date"),
    rentPeriodEnd: z.string().min(1, "Select a rent period end date"),
  }),
  z.object({
    type: z.literal("SERVICE"),
    billedToUserId: z.string().trim().min(1, "Select a staff member"),
    dueDate: z.string().min(1, "Select a due date"),
    serviceDescription: z.string().trim().min(1, "Describe the service").max(2000),
    servicePeriodStart: z.string().min(1, "Select a service period start date"),
    servicePeriodEnd: z.string().min(1, "Select a service period end date"),
  }),
]);

export const recordPaymentSchema = z.object({
  amountCents: z.coerce.number().int().positive("Enter a valid amount"),
  method: z.enum(["CASH", "BANK_TRANSFER", "CHEQUE", "CARD", "ONLINE", "OTHER"]),
  paidAt: z.string().min(1, "Select a payment date"),
  reference: z.string().trim().max(200).optional().or(z.literal("")),
});
