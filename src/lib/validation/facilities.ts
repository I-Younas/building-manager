import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const facilitySchema = z.object({
  buildingId: z.string().trim().min(1, "Select a building"),
  name: z.string().trim().min(1, "Name is required").max(200),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  openTime: z.string().regex(timeRegex, "Use HH:MM format"),
  closeTime: z.string().regex(timeRegex, "Use HH:MM format"),
  minNoticeHours: z.coerce.number().int().min(0).max(720),
  maxDurationMinutes: z.coerce.number().int().min(15).max(1440),
});

export const bookingRequestSchema = z.object({
  facilityId: z.string().trim().min(1, "Select a facility"),
  unitId: z.string().trim().min(1, "Select a unit"),
  startsAt: z.string().min(1, "Select a start time"),
  endsAt: z.string().min(1, "Select an end time"),
});
