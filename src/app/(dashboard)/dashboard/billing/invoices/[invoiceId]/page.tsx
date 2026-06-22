import { notFound } from "next/navigation";
import { requireOrgScope } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { formatCents } from "@/lib/money";
import { getDisplayStatus } from "@/lib/invoice-status";
import { issueInvoice, voidInvoice } from "@/lib/actions/invoices";
import { PaymentForm } from "./payment-form";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ invoiceId: string }>;
}) {
  const { user, organizationId, role } = await requireOrgScope();
  const { invoiceId } = await params;
  const isAdmin = role !== "RESIDENT";

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, organizationId },
    include: {
      unit: { include: { building: true } },
      lineItems: true,
      payments: { include: { recordedBy: true }, orderBy: { paidAt: "asc" } },
    },
  });

  if (!invoice) notFound();

  if (!isAdmin) {
    if (invoice.status === "DRAFT") notFound();
    const isUnitMember = await prisma.unitResident.findUnique({
      where: { unitId_userId: { unitId: invoice.unitId, userId: user.id } },
    });
    if (!isUnitMember) notFound();
  }

  const totalCents = invoice.lineItems.reduce((sum, item) => sum + item.amountCents * item.quantity, 0);
  const paidCents = invoice.payments.reduce((sum, payment) => sum + payment.amountCents, 0);
  const balanceCents = totalCents - paidCents;

  return (
    <div>
      <p>
        {invoice.unit.building.name} / Unit {invoice.unit.unitNumber}
      </p>
      <h1>{invoice.invoiceNumber}</h1>
      <p>
        Status: {getDisplayStatus(invoice)} · Due {invoice.dueDate.toLocaleDateString()}
      </p>

      <h2>Line items</h2>
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>Qty</th>
            <th>Amount</th>
            <th>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {invoice.lineItems.map((item) => (
            <tr key={item.id}>
              <td>{item.description}</td>
              <td>{item.quantity}</td>
              <td>{formatCents(item.amountCents)}</td>
              <td>{formatCents(item.amountCents * item.quantity)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>
        <strong>Total: {formatCents(totalCents)}</strong>
      </p>
      <p>
        Paid: {formatCents(paidCents)} · Balance: {formatCents(balanceCents)}
      </p>

      {isAdmin && invoice.status === "DRAFT" ? (
        <form action={issueInvoice.bind(null, invoice.id)}>
          <button type="submit">Issue invoice</button>
        </form>
      ) : null}

      {isAdmin &&
      (invoice.status === "DRAFT" || invoice.status === "ISSUED") &&
      invoice.payments.length === 0 ? (
        <form action={voidInvoice.bind(null, invoice.id)}>
          <button type="submit">Void invoice</button>
        </form>
      ) : null}

      <h2>Payments</h2>
      {invoice.payments.length === 0 ? (
        <p>No payments recorded yet.</p>
      ) : (
        <ul>
          {invoice.payments.map((payment) => (
            <li key={payment.id}>
              {formatCents(payment.amountCents)} via {payment.method} on {payment.paidAt.toLocaleDateString()}
              {payment.reference ? ` (ref: ${payment.reference})` : ""}
              {isAdmin ? ` · recorded by ${payment.recordedBy.name}` : ""}
            </li>
          ))}
        </ul>
      )}

      {isAdmin && invoice.status !== "DRAFT" && invoice.status !== "VOID" && invoice.status !== "PAID" ? (
        <>
          <h2>Record a payment</h2>
          <PaymentForm invoiceId={invoice.id} />
        </>
      ) : null}
    </div>
  );
}
