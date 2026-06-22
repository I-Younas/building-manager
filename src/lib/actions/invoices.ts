"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdminOrStaff } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { createInvoiceSchema } from "@/lib/validation/invoices";
import { dollarsToCents } from "@/lib/money";

export type FormActionState = { error: string } | undefined;

export async function createInvoice(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const { organizationId } = await requireAdminOrStaff();

  const parsed = createInvoiceSchema.safeParse({
    unitId: formData.get("unitId"),
    dueDate: formData.get("dueDate"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }

  const unit = await prisma.unit.findFirst({ where: { id: parsed.data.unitId, organizationId } });
  if (!unit) {
    return { error: "Unit not found." };
  }

  const dueDate = new Date(parsed.data.dueDate);
  if (Number.isNaN(dueDate.getTime())) {
    return { error: "Enter a valid due date." };
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

  const invoice = await prisma.$transaction(async (tx) => {
    const count = await tx.invoice.count({ where: { organizationId } });
    const invoiceNumber = `INV-${String(count + 1).padStart(4, "0")}`;

    return tx.invoice.create({
      data: {
        organizationId,
        unitId: unit.id,
        invoiceNumber,
        issueDate: new Date(),
        dueDate,
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
