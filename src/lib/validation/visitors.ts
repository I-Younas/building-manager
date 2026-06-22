import { z } from "zod";

export const registerVisitorSchema = z.object({
  unitId: z.string().trim().min(1, "Select a unit"),
  name: z.string().trim().min(1, "Visitor name is required").max(200),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  purpose: z.string().trim().max(500).optional().or(z.literal("")),
  expectedAt: z.string().min(1, "Select an expected date/time"),
});
