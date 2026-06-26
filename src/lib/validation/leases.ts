import { z } from "zod";

export const leaseDatesSchema = z.object({
  leaseStartDate: z.string().min(1, "Select a lease start date"),
  leaseEndDate: z.string().min(1, "Select a lease end date"),
});
