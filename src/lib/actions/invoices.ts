"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdminOrStaff } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { createInvoiceSchema, invoiceRecurrenceSchema } from "@/lib/validation/invoices";
import { dollarsToCents } from "@/lib/money";

export type FormActionState = { error: string } | undefined;

export async function createInvoice(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const { organizationId } = await requireAdminOrStaff();

  const parsed = createInvoiceSchema.safeParse(
    formData.get("type") === "SERVICE"
      ? {
          type: "SERVICE",
          billedToUserId: formData.get("billedToUserId"),
          dueDate: formData.get("dueDate"),
          serviceDescription: formData.get("serviceDescription"),
          servicePeriodStart: formData.get("servicePeriodStart"),
          servicePeriodEnd: formData.get("servicePeriodEnd"),
        }
      : {
          type: "RENT",
          unitId: formData.get("unitId"),
          dueDate: formData.get("dueDate"),
          rentPeriodStart: formData.get("rentPeriodStart"),
          rentPeriodEnd: formData.get("rentPeriodEnd"),
        },
  );
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }

  const dueDate = new Date(parsed.data.dueDate);
  if (Number.isNaN(dueDate.getTime())) {
    return { error: "Enter a valid due date." };
  }

  let invoiceData: {
    type: "RENT" | "SERVICE";
    unitId: string | null;
    billedToUserId: string | null;
    rentPeriodStart: Date | null;
    rentPeriodEnd: Date | null;
    serviceDescription: string | null;
    servicePeriodStart: Date | null;
    servicePeriodEnd: Date | null;
  };

  if (parsed.data.type === "RENT") {
    const unit = await prisma.unit.findFirst({ where: { id: parsed.data.unitId, organizationId } });
    if (!unit) {
      return { error: "Unit not found." };
    }

    const rentPeriodStart = new Date(parsed.data.rentPeriodStart);
    const rentPeriodEnd = new Date(parsed.data.rentPeriodEnd);
    if (Number.isNaN(rentPeriodStart.getTime()) || Number.isNaN(rentPeriodEnd.getTime())) {
      return { error: "Enter a valid rent period." };
    }

    invoiceData = {
      type: "RENT",
      unitId: unit.id,
      billedToUserId: null,
      rentPeriodStart,
      rentPeriodEnd,
      serviceDescription: null,
      servicePeriodStart: null,
      servicePeriodEnd: null,
    };
  } else {
    const membership = await prisma.orgMembership.findUnique({
      where: { userId_organizationId: { userId: parsed.data.billedToUserId, organizationId } },
    });
    if (!membership || membership.role !== "STAFF") {
      return { error: "Service invoices can only be billed to staff in this organization." };
    }

    const servicePeriodStart = new Date(parsed.data.servicePeriodStart);
    const servicePeriodEnd = new Date(parsed.data.servicePeriodEnd);
    if (Number.isNaN(servicePeriodStart.getTime()) || Number.isNaN(servicePeriodEnd.getTime())) {
      return { error: "Enter a valid service period." };
    }

    invoiceData = {
      type: "SERVICE",
      unitId: null,
      billedToUserId: membership.userId,
      rentPeriodStart: null,
      rentPeriodEnd: null,
      serviceDescription: parsed.data.serviceDescription,
      servicePeriodStart,
      servicePeriodEnd,
    };
  }

  const descriptions = formData.getAll("description").map(String);
  const amounts = formData.getAll("amount").map(String);
  const quantities = formData.getAll("quantity").map(String);

  const lineItems: { description: string; amountCents: number; quantity: number }[] = [];
  for (let i = 0; i < descriptions.length; i++) {
    const description = descriptions[i].trim();
    if (!description) continue;

    const amountCents = dollarsToCents(amounts[i] ?? "");
    if (amountCents === null || amountCents <= 0) {
      return { error: `Enter a valid amount for "${description}".` };
    }

    const quantity = Number.parseInt(quantities[i] ?? "1", 10);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      return { error: `Enter a valid quantity for "${description}".` };
    }

    lineItems.push({ description, amountCents, quantity });
  }

  if (lineItems.length === 0) {
    return { error: "Add at least one line item." };
  }

  const recurrenceParsed = invoiceRecurrenceSchema.safeParse({
    recurrence: formData.get("recurrence") ?? "NONE",
    recurrenceStartAt: formData.get("recurrenceStartAt") ?? "",
    recurrenceEndsAt: formData.get("recurrenceEndsAt") ?? "",
  });
  const recurrence = recurrenceParsed.success ? recurrenceParsed.data.recurrence : "NONE";
  const recurrenceStartAtRaw = recurrenceParsed.success ? recurrenceParsed.data.recurrenceStartAt : "";
  const recurrenceStartAt = recurrenceStartAtRaw ? new Date(recurrenceStartAtRaw) : null;
  const recurrenceEndsAtRaw = recurrenceParsed.success ? recurrenceParsed.data.recurrenceEndsAt : "";
  const recurrenceEndsAt = recurrenceEndsAtRaw ? new Date(recurrenceEndsAtRaw) : null;

  const invoice = await prisma.$transaction(async (tx) => {
    const count = await tx.invoice.count({ where: { organizationId } });
    const invoiceNumber = `INV-${String(count + 1).padStart(4, "0")}`;

    return tx.invoice.create({
      data: {
        organizationId,
        invoiceNumber,
        issueDate: new Date(),
        dueDate,
        recurrence,
        recurrenceStartAt,
        recurrenceEndsAt,
        ...invoiceData,
        lineItems: { create: lineItems },
      },
    });
  });

  redirect(`/dashboard/billing/invoices/${invoice.id}`);
}

export async function issueInvoice(invoiceId: string) {
  const { organizationId } = await requireAdminOrStaff();

  const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, organizationId } });
  if (!invoice) throw new Error("Invoice not found.");
  if (invoice.status !== "DRAFT") throw new Error("Only draft invoices can be issued.");

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: "ISSUED", issueDate: new Date() },
  });

  revalidatePath(`/dashboard/billing/invoices/${invoiceId}`);
}

export async function voidInvoice(invoiceId: string) {
  const { organizationId } = await requireAdminOrStaff();

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, organizationId },
    include: { payments: true },
  });
  if (!invoice) throw new Error("Invoice not found.");
  if (invoice.payments.length > 0) throw new Error("Cannot void an invoice that has payments recorded.");

  await prisma.invoice.update({ where: { id: invoiceId }, data: { status: "VOID" } });

  revalidatePath(`/dashboard/billing/invoices/${invoiceId}`);
  revalidatePath("/dashboard/billing/invoices");
}
