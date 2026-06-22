"use server";

import { revalidatePath } from "next/cache";
import { requireAdminOrStaff } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { recordPaymentSchema } from "@/lib/validation/invoices";
import { dollarsToCents } from "@/lib/money";

export type FormActionState = { error: string } | undefined;

export async function recordPayment(
  invoiceId: string,
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const { user, organizationId } = await requireAdminOrStaff();

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, organizationId },
    include: { lineItems: true, payments: true },
  });
  if (!invoice) {
    return { error: "Invoice not found." };
  }
  if (invoice.status === "DRAFT" || invoice.status === "VOID") {
    return { error: "This invoice can't accept payments in its current status." };
  }

  const amountCents = dollarsToCents(String(formData.get("amount") ?? ""));
  if (amountCents === null || amountCents <= 0) {
    return { error: "Enter a valid payment amount." };
  }

  const parsed = recordPaymentSchema.safeParse({
    amountCents,
    method: formData.get("method"),
    paidAt: formData.get("paidAt"),
    reference: formData.get("reference"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }

  const paidAt = new Date(parsed.data.paidAt);
  if (Number.isNaN(paidAt.getTime())) {
    return { error: "Enter a valid payment date." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.payment.create({
      data: {
        invoiceId,
        recordedById: user.id,
        amountCents: parsed.data.amountCents,
        method: parsed.data.method,
        reference: parsed.data.reference || null,
        paidAt,
      },
    });

    const totalDue = invoice.lineItems.reduce((sum, item) => sum + item.amountCents * item.quantity, 0);
    const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amountCents, 0) + parsed.data.amountCents;

    const newStatus = totalPaid >= totalDue ? "PAID" : totalPaid > 0 ? "PARTIALLY_PAID" : invoice.status;

    await tx.invoice.update({ where: { id: invoiceId }, data: { status: newStatus } });
  });

  revalidatePath(`/dashboard/billing/invoices/${invoiceId}`);
}
