import Link from "next/link";
import { requireOrgScope } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { formatCents } from "@/lib/money";
import { getDisplayStatus } from "@/lib/invoice-status";
import {
  EmptyState,
  LinkButton,
  PageHeader,
  StatusBadge,
  tableClasses,
  tableWrapClasses,
  tdClasses,
  thClasses,
  theadClasses,
  trClasses,
} from "@/components/ui";

export default async function InvoicesPage() {
  const { user, organizationId, role } = await requireOrgScope();
  const isAdmin = role !== "RESIDENT";

  let unitIdFilter: { in: string[] } | undefined;
  if (!isAdmin) {
    const myUnits = await prisma.unitResident.findMany({
      where: { userId: user.id, unit: { organizationId } },
      select: { unitId: true },
    });
    unitIdFilter = { in: myUnits.map((link) => link.unitId) };
  }

  const invoices = await prisma.invoice.findMany({
    where: {
      organizationId,
      ...(unitIdFilter ? { unitId: unitIdFilter } : {}),
      ...(isAdmin ? {} : { status: { not: "DRAFT" } }),
    },
    include: { unit: { include: { building: true } }, lineItems: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title={isAdmin ? "Invoices" : "My invoices"}
        actions={isAdmin ? <LinkButton href="/dashboard/billing/invoices/new">Create invoice</LinkButton> : null}
      />

      {invoices.length === 0 ? (
        <EmptyState title="No invoices yet" />
      ) : (
        <div className={tableWrapClasses}>
          <table className={tableClasses}>
            <thead className={theadClasses}>
              <tr>
                <th className={thClasses}>Invoice</th>
                <th className={thClasses}>Unit</th>
                <th className={thClasses}>Total</th>
                <th className={thClasses}>Status</th>
                <th className={thClasses}>Due</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((invoice) => {
                const total = invoice.lineItems.reduce((sum, item) => sum + item.amountCents * item.quantity, 0);
                return (
                  <tr key={invoice.id} className={trClasses}>
                    <td className={tdClasses}>
                      <Link
                        href={`/dashboard/billing/invoices/${invoice.id}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {invoice.invoiceNumber}
                      </Link>
                    </td>
                    <td className={tdClasses}>
                      {invoice.unit.building.name} / Unit {invoice.unit.unitNumber}
                    </td>
                    <td className={tdClasses}>{formatCents(total)}</td>
                    <td className={tdClasses}>
                      <StatusBadge status={getDisplayStatus(invoice)} />
                    </td>
                    <td className={tdClasses}>{invoice.dueDate.toLocaleDateString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
