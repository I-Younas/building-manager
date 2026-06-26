import { z } from "zod";

export const updateContactInfoSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  phone: z.string().trim().min(7, "Enter a valid phone number").max(30),
});
