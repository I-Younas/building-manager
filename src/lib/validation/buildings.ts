import { z } from "zod";

export const buildingSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  addressLine1: z.string().trim().min(1, "Address is required").max(200),
  addressLine2: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().min(1, "City is required").max(100),
  region: z.string().trim().max(100).optional().or(z.literal("")),
  postalCode: z.string().trim().max(20).optional().or(z.literal("")),
  country: z.string().trim().min(1, "Country is required").max(100),
});

export const unitSchema = z.object({
  unitNumber: z.string().trim().min(1, "Unit number is required").max(50),
  floor: z.string().trim().max(50).optional().or(z.literal("")),
});
