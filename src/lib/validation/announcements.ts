import { z } from "zod";

export const announcementSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  body: z.string().trim().min(1, "Body is required").max(20000),
  category: z.enum(["GENERAL", "MAINTENANCE", "EMERGENCY", "POLICY", "EVENT", "BILLING", "AMENITY"]),
  priority: z.enum(["NORMAL", "IMPORTANT", "URGENT"]),
  audience: z.enum(["ALL_ORG", "BUILDINGS", "UNITS", "FLOORS", "INDIVIDUALS", "ALL_STAFF", "INDIVIDUAL_STAFF"]),
  targetBuildingIds: z.array(z.string().trim().min(1)).default([]),
  targetUnitIds: z.array(z.string().trim().min(1)).default([]),
  targetFloors: z.array(z.string().trim().min(1)).default([]),
  includeUserIds: z.array(z.string().trim().min(1)).default([]),
  expiresAt: z.string().optional().or(z.literal("")),
  allowReplies: z.boolean().default(false),
  requireAcknowledgment: z.boolean().default(false),
  acknowledgmentReminderDays: z.coerce.number().int().min(1).max(60).optional(),
  sendTiming: z.enum(["NOW", "SCHEDULE", "DRAFT"]),
  scheduledAt: z.string().optional().or(z.literal("")),
  recurrence: z.enum(["NONE", "DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY", "QUARTERLY", "YEARLY", "CUSTOM"]).default("NONE"),
  recurrenceEndsAt: z.string().optional().or(z.literal("")),
});
