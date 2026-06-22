import { z } from "zod";

export const announcementSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  body: z.string().trim().min(1, "Body is required").max(5000),
  scope: z.enum(["ORGANIZATION", "BUILDING"]),
  buildingId: z.string().trim().min(1).optional().or(z.literal("")),
  expiresAt: z.string().optional().or(z.literal("")),
});
