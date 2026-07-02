import { headers } from "next/headers";
import type Stripe from "stripe";
import { prisma } from "@/lib/db";
import { getStripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return new Response("STRIPE_WEBHOOK_SECRET not configured", { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    return new Response(`Webhook signature verification failed: ${(err as Error).message}`, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return new Response("OK", { status: 200 });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const invoiceId = session.metadata?.invoiceId;

  if (!invoiceId) {
    return new Response("Missing invoiceId in session metadata", { status: 400 });
  }

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, stripeCheckoutSessionId: session.id },
    include: { lineItems: true, payments: true },
  });

  if (!invoice) {
    return new Response("Invoice not found", { status: 404 });
  }

  const amountPaidCents = session.amount_total ?? 0;

  const orgAdmin = await prisma.orgMembership.findFirst({
    where: { organizationId: invoice.organizationId, role: "ORG_ADMIN" },
    orderBy: { createdAt: "asc" },
    select: { userId: true },
  });

  if (!orgAdmin) {
    return new Response("No org admin found", { status: 500 });
  }

  const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : null;

  await prisma.$transaction(async (tx) => {
    await tx.payment.create({
      data: {
        invoiceId: invoice.id,
        recordedById: orgAdmin.userId,
        amountCents: amountPaidCents,
        method: "ONLINE",
        reference: paymentIntentId,
        paidAt: new Date(),
      },
    });

    const totalDue = invoice.lineItems.reduce((sum, item) => sum + item.amountCents * item.quantity, 0);
    const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amountCents, 0) + amountPaidCents;
    const newStatus = totalPaid >= totalDue ? "PAID" : "PARTIALLY_PAID";

    await tx.invoice.update({
      where: { id: invoice.id },
      data: { status: newStatus },
    });
  });

  return new Response("OK", { status: 200 });
}
