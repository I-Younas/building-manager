import { z } from "zod";

export const createInviteSchema = z.object({
  role: z.enum(["RESIDENT", "STAFF"]),
  buildingId: z.string().trim().min(1).optional().or(z.literal("")),
  unitNumber: z.string().trim().max(50).optional().or(z.literal("")),
  relationship: z.enum(["OWNER", "TENANT", "FAMILY_MEMBER", "OTHER"]).optional().or(z.literal("")),
  email: z.string().trim().email().optional().or(z.literal("")),
});

export const redeemInviteSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
});
