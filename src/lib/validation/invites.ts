import { z } from "zod";

export const createInviteSchema = z.object({
  role: z.enum(["RESIDENT", "STAFF"]),
  buildingName: z.string().trim().max(200).optional().or(z.literal("")),
  unitNumber: z.string().trim().max(50).optional().or(z.literal("")),
  relationship: z.enum(["OWNER", "TENANT", "FAMILY_MEMBER", "OTHER"]).optional().or(z.literal("")),
  email: z.string().trim().email("Enter a valid email address"),
});

export const redeemInviteSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(50),
  lastName: z.string().trim().min(1, "Last name is required").max(50),
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
});
