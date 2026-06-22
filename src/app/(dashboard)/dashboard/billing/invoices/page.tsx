import Link from "next/link";
import { requireOrgScope } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { formatCents } from "@/lib/money";
import { getDisplayStatus } from "@/lib/invoice-status";

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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h1>{isAdmin ? "Invoices" : "My invoices"}</h1>
        {isAdmin ? <Link href="/dashboard/billing/invoices/new">Create invoice</Link> : null}
      </div>

      {invoices.length === 0 ? (
        <p>No invoices yet.</p>
      ) : (
        <ul>
          {invoices.map((invoice) => {
            const total = invoice.lineItems.reduce((sum, item) => sum + item.amountCents * item.quantity, 0);
            return (
              <li key={invoice.id}>
                <Link href={`/dashboard/billing/invoices/${invoice.id}`}>{invoice.invoiceNumber}</Link> —{" "}
                {invoice.unit.building.name} / Unit {invoice.unit.unitNumber} — {formatCents(total)} ·{" "}
                {getDisplayStatus(invoice)} · due {invoice.dueDate.toLocaleDateString()}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
