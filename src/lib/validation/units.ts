import { z } from "zod";

export const updateLeaseSchema = z.object({
  leaseStartDate: z.string().trim().optional().or(z.literal("")),
  leaseEndDate: z.string().trim().optional().or(z.literal("")),
});
