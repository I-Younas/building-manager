"use server";

import { redirect } from "next/navigation";
import { requireOrgScope } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { getStripe } from "@/lib/stripe";

export async function createCheckoutSession(invoiceId: string): Promise<never> {
  const { user, organizationId, role } = await requireOrgScope();

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, organizationId },
    include: {
      lineItems: true,
      payments: true,
      unit: { include: { building: true } },
      billedTo: true,
    },
  });

  if (!invoice) throw new Error("Invoice not found.");
  if (invoice.status === "DRAFT" || invoice.status === "VOID" || invoice.status === "PAID") {
    throw new Error("This invoice cannot be paid online.");
  }

  if (role === "RESIDENT") {
    if (!invoice.unitId) throw new Error("Access denied.");
    const isResident = await prisma.unitResident.findUnique({
      where: { unitId_userId: { unitId: invoice.unitId, userId: user.id } },
    });
    if (!isResident) throw new Error("Access denied.");
  } else if (role === "STAFF") {
    if (invoice.billedToUserId !== user.id) throw new Error("Access denied.");
  } else {
    throw new Error("Org admins cannot pay invoices online.");
  }

  const totalCents = invoice.lineItems.reduce((sum, item) => sum + item.amountCents * item.quantity, 0);
  const paidCents = invoice.payments.reduce((sum, p) => sum + p.amountCents, 0);
  const balanceCents = totalCents - paidCents;

  if (balanceCents <= 0) throw new Error("No balance due on this invoice.");

  const baseUrl = process.env.APP_URL ?? "http://localhost:3000";

  const productName =
    invoice.unit
      ? `Invoice ${invoice.invoiceNumber} — ${invoice.unit.building.name} Unit ${invoice.unit.unitNumber}`
      : `Invoice ${invoice.invoiceNumber}`;

  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: invoice.currency.toLowerCase(),
          product_data: { name: productName },
          unit_amount: balanceCents,
        },
        quantity: 1,
      },
    ],
    metadata: { invoiceId: invoice.id },
    success_url: `${baseUrl}/dashboard/billing/invoices/${invoice.id}?paid=1`,
    cancel_url: `${baseUrl}/dashboard/billing/invoices/${invoice.id}`,
  });

  await prisma.invoice.update({
    where: { id: invoice.id },
    data: { stripeCheckoutSessionId: session.id },
  });

  redirect(session.url!);
}
