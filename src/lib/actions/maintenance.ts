"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireOrgScope, requireAdminOrStaff } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import {
  createTicketSchema,
  ticketStatusSchema,
  assignTicketSchema,
  ticketCommentSchema,
} from "@/lib/validation/maintenance";

export type FormActionState = { error: string } | undefined;

export async function createTicket(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const { user, organizationId } = await requireOrgScope();

  const myUnits = await prisma.unitResident.findMany({
    where: { userId: user.id, unit: { organizationId } },
    select: { unitId: true },
  });
  const myUnitIds = new Set(myUnits.map((link) => link.unitId));

  if (myUnitIds.size === 0) {
    return { error: "You need to be linked to a unit to report an issue. Contact your building admin." };
  }

  const parsed = createTicketSchema.safeParse({
    unitId: formData.get("unitId"),
    title: formData.get("title"),
    description: formData.get("description"),
    category: formData.get("category"),
    priority: formData.get("priority"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }

  if (!myUnitIds.has(parsed.data.unitId)) {
    return { error: "You can only report issues for your own unit." };
  }

  const ticket = await prisma.$transaction(async (tx) => {
    const ticket = await tx.maintenanceTicket.create({
      data: {
        organizationId,
        unitId: parsed.data.unitId,
        reportedById: user.id,
        title: parsed.data.title,
        description: parsed.data.description,
        category: parsed.data.category || null,
        priority: parsed.data.priority,
      },
    });

    await tx.ticketStatusHistory.create({
      data: {
        ticketId: ticket.id,
        changedById: user.id,
        fromStatus: null,
        toStatus: "OPEN",
      },
    });

    return ticket;
  });

  redirect(`/dashboard/maintenance/${ticket.id}`);
}

export async function updateTicketStatus(
  ticketId: string,
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const { user, organizationId } = await requireAdminOrStaff();

  const ticket = await prisma.maintenanceTicket.findFirst({
    where: { id: ticketId, organizationId },
  });
  if (!ticket) {
    return { error: "Ticket not found." };
  }

  const parsed = ticketStatusSchema.safeParse({
    status: formData.get("status"),
    note: formData.get("note"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }

  const isClosing = parsed.data.status === "RESOLVED" || parsed.data.status === "CLOSED";

  await prisma.$transaction(async (tx) => {
    await tx.maintenanceTicket.update({
      where: { id: ticketId },
      data: {
        status: parsed.data.status,
        resolvedAt: isClosing ? new Date() : null,
      },
    });

    await tx.ticketStatusHistory.create({
      data: {
        ticketId,
        changedById: user.id,
        fromStatus: ticket.status,
        toStatus: parsed.data.status,
        note: parsed.data.note || null,
      },
    });
  });

  revalidatePath(`/dashboard/maintenance/${ticketId}`);
}

export async function assignTicket(
  ticketId: string,
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const { organizationId } = await requireAdminOrStaff();

  const ticket = await prisma.maintenanceTicket.findFirst({
    where: { id: ticketId, organizationId },
  });
  if (!ticket) {
    return { error: "Ticket not found." };
  }

  const parsed = assignTicketSchema.safeParse({
    assigneeUserId: formData.get("assigneeUserId"),
  });
  if (!parsed.success) {
    return { error: "Please check the form and try again." };
  }

  let assigneeUserId: string | null = null;
  if (parsed.data.assigneeUserId) {
    const membership = await prisma.orgMembership.findUnique({
      where: {
        userId_organizationId: { userId: parsed.data.assigneeUserId, organizationId },
      },
    });
    if (!membership || membership.role === "RESIDENT") {
      return { error: "Tickets can only be assigned to staff or admins in this organization." };
    }
    assigneeUserId = parsed.data.assigneeUserId;
  }

  await prisma.maintenanceTicket.update({
    where: { id: ticketId },
    data: { assignedToId: assigneeUserId, assignedAt: assigneeUserId ? new Date() : null },
  });

  revalidatePath(`/dashboard/maintenance/${ticketId}`);
}

export async function markTicketResolved(ticketId: string) {
  const { user, organizationId } = await requireAdminOrStaff();

  const ticket = await prisma.maintenanceTicket.findFirst({
    where: { id: ticketId, organizationId },
  });
  if (!ticket) return;

  await prisma.$transaction(async (tx) => {
    await tx.maintenanceTicket.update({
      where: { id: ticketId },
      data: { status: "RESOLVED", resolvedAt: new Date() },
    });

    await tx.ticketStatusHistory.create({
      data: {
        ticketId,
        changedById: user.id,
        fromStatus: ticket.status,
        toStatus: "RESOLVED",
      },
    });
  });

  revalidatePath(`/dashboard/maintenance/${ticketId}`);
}

export async function addTicketComment(
  ticketId: string,
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const { user, organizationId, role } = await requireOrgScope();

  const ticket = await prisma.maintenanceTicket.findFirst({
    where: { id: ticketId, organizationId },
  });
  if (!ticket) {
    return { error: "Ticket not found." };
  }

  if (role === "RESIDENT") {
    const isReporter = ticket.reportedById === user.id;
    const isUnitMember = isReporter
      ? true
      : Boolean(
          await prisma.unitResident.findUnique({
            where: { unitId_userId: { unitId: ticket.unitId, userId: user.id } },
          }),
        );
    if (!isUnitMember) {
      return { error: "You don't have access to this ticket." };
    }
  }

  const parsed = ticketCommentSchema.safeParse({
    body: formData.get("body"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }

  const isInternal = role !== "RESIDENT" && formData.get("isInternal") === "on";

  await prisma.ticketComment.create({
    data: {
      ticketId,
      authorId: user.id,
      body: parsed.data.body,
      isInternal,
    },
  });

  revalidatePath(`/dashboard/maintenance/${ticketId}`);
}
