import { z } from "zod";

export const createTicketSchema = z.object({
  unitId: z.string().trim().min(1, "Select a unit"),
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().min(1, "Description is required").max(5000),
  category: z.string().trim().max(100).optional().or(z.literal("")),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
});

export const ticketStatusSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "ON_HOLD", "RESOLVED", "CLOSED"]),
  note: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const assignTicketSchema = z.object({
  assigneeUserId: z.string().trim().max(100).optional().or(z.literal("")),
});

export const ticketCommentSchema = z.object({
  body: z.string().trim().min(1, "Comment cannot be empty").max(5000),
});
