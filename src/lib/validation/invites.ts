import { z } from "zod";

export const createInviteSchema = z.object({
  role: z.enum(["RESIDENT", "STAFF"]),
  buildingId: z.string().trim().optional().or(z.literal("")),
  unitNumber: z.string().trim().max(20).optional().or(z.literal("")),
  email: z.string().trim().email("Enter a valid email address"),
  employeeId: z.string().trim().max(50).optional().or(z.literal("")),
});

export const redeemInviteSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(50),
  lastName: z.string().trim().min(1, "Last name is required").max(50),
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
});

// Additional fields required only when redeeming a RESIDENT invite.
export const residentRegistrationSchema = z.object({
  phone: z.string().trim().min(7, "Enter a valid phone number").max(30),
  dateOfBirth: z
    .string()
    .min(1, "Date of birth is required")
    .refine((value) => !Number.isNaN(new Date(value).getTime()), "Enter a valid date of birth")
    .refine((value) => {
      const dob = new Date(value);
      const eighteenYearsAgo = new Date();
      eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);
      return dob <= eighteenYearsAgo;
    }, "You must be at least 18 years old to register"),
  emergencyContactName: z.string().trim().min(1, "Emergency contact name is required").max(100),
  emergencyContactPhone: z.string().trim().min(7, "Enter a valid emergency contact phone number").max(30),
});
