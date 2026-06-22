import { notFound } from "next/navigation";
import { requireOrgScope } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { formatCents } from "@/lib/money";
import { getDisplayStatus } from "@/lib/invoice-status";
import { issueInvoice, voidInvoice } from "@/lib/actions/invoices";
import { PaymentForm } from "./payment-form";
import {
  Button,
  Card,
  PageHeader,
  StatusBadge,
  tableClasses,
  tableWrapClasses,
  tdClasses,
  thClasses,
  theadClasses,
} from "@/components/ui";

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
      <PageHeader
        title={invoice.invoiceNumber}
        description={`${invoice.unit.building.name} / Unit ${invoice.unit.unitNumber} · Due ${invoice.dueDate.toLocaleDateString()}`}
        actions={
          <>
            <StatusBadge status={getDisplayStatus(invoice)} />
            {isAdmin && invoice.status === "DRAFT" ? (
              <form action={issueInvoice.bind(null, invoice.id)}>
                <Button type="submit" size="sm">
                  Issue invoice
                </Button>
              </form>
            ) : null}
            {isAdmin && (invoice.status === "DRAFT" || invoice.status === "ISSUED") && invoice.payments.length === 0 ? (
              <form action={voidInvoice.bind(null, invoice.id)}>
                <Button type="submit" variant="danger" size="sm">
                  Void invoice
                </Button>
              </form>
            ) : null}
          </>
        }
      />

      <h2 className="mb-3 text-lg font-semibold text-slate-900">Line items</h2>
      <div className={`${tableWrapClasses} mb-6`}>
        <table className={tableClasses}>
          <thead className={theadClasses}>
            <tr>
              <th className={thClasses}>Description</th>
              <th className={thClasses}>Qty</th>
              <th className={thClasses}>Amount</th>
              <th className={thClasses}>Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoice.lineItems.map((item) => (
              <tr key={item.id}>
                <td className={tdClasses}>{item.description}</td>
                <td className={tdClasses}>{item.quantity}</td>
                <td className={tdClasses}>{formatCents(item.amountCents)}</td>
                <td className={tdClasses}>{formatCents(item.amountCents * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Card className="mb-8 max-w-sm">
        <p className="text-lg font-semibold text-slate-900">Total: {formatCents(totalCents)}</p>
        <p className="mt-1 text-sm text-slate-500">
          Paid: {formatCents(paidCents)} · Balance: {formatCents(balanceCents)}
        </p>
      </Card>

      <h2 className="mb-3 text-lg font-semibold text-slate-900">Payments</h2>
      {invoice.payments.length === 0 ? (
        <p className="mb-6 text-sm text-slate-500">No payments recorded yet.</p>
      ) : (
        <div className="mb-6 flex flex-col gap-2">
          {invoice.payments.map((payment) => (
            <Card key={payment.id} className="py-3">
              <p className="text-sm text-slate-700">
                {formatCents(payment.amountCents)} via {payment.method.replace("_", " ")} on{" "}
                {payment.paidAt.toLocaleDateString()}
                {payment.reference ? ` (ref: ${payment.reference})` : ""}
                {isAdmin ? ` · recorded by ${payment.recordedBy.name}` : ""}
              </p>
            </Card>
          ))}
        </div>
      )}

      {isAdmin && invoice.status !== "DRAFT" && invoice.status !== "VOID" && invoice.status !== "PAID" ? (
        <>
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Record a payment</h2>
          <PaymentForm invoiceId={invoice.id} />
        </>
      ) : null}
    </div>
  );
}
