import Link from "next/link";
import { requireOrgScope } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { getDictionary } from "@/lib/i18n/get-dictionary";
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

const STATUS_FILTERS = ["OPEN", "IN_PROGRESS", "ON_HOLD", "RESOLVED", "CLOSED"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

function parseStatusFilter(value: string | undefined): StatusFilter | undefined {
  return (STATUS_FILTERS as readonly string[]).includes(value ?? "") ? (value as StatusFilter) : undefined;
}

export default async function MaintenancePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { user, organizationId, role } = await requireOrgScope();
  const dict = await getDictionary();
  const status = parseStatusFilter((await searchParams).status);

  let unitIdFilter: { in: string[] } | undefined;
  if (role === "RESIDENT") {
    const myUnits = await prisma.unitResident.findMany({
      where: { userId: user.id, unit: { organizationId } },
      select: { unitId: true },
    });
    unitIdFilter = { in: myUnits.map((link) => link.unitId) };
  }

  const tickets = await prisma.maintenanceTicket.findMany({
    where: {
      organizationId,
      ...(status ? { status } : {}),
      ...(unitIdFilter ? { unitId: unitIdFilter } : {}),
    },
    include: { unit: { include: { building: true } }, assignedTo: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title={dict.maintenance.heading}
        actions={<LinkButton href="/dashboard/maintenance/new">{dict.maintenance.reportIssue}</LinkButton>}
      />

      {role !== "RESIDENT" ? (
        <nav className="mb-4 flex flex-wrap gap-2">
          <Link
            href="/dashboard/maintenance"
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              !status ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {dict.maintenance.all}
          </Link>
          {STATUS_FILTERS.map((s) => (
            <Link
              key={s}
              href={`/dashboard/maintenance?status=${s}`}
              className={`rounded-full px-3 py-1 text-sm font-medium ${
                status === s ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {s.replace("_", " ")}
            </Link>
          ))}
        </nav>
      ) : null}

      {tickets.length === 0 ? (
        <EmptyState title={dict.maintenance.noTickets} />
      ) : (
        <div className={tableWrapClasses}>
          <table className={tableClasses}>
            <thead className={theadClasses}>
              <tr>
                <th className={thClasses}>{dict.maintenance.title}</th>
                <th className={thClasses}>{dict.maintenance.status}</th>
                <th className={thClasses}>{dict.maintenance.priority}</th>
                <th className={thClasses}>{dict.maintenance.unit}</th>
                <th className={thClasses}>{dict.maintenance.assignedTo}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tickets.map((ticket) => (
                <tr key={ticket.id} className={trClasses}>
                  <td className={tdClasses}>
                    <Link href={`/dashboard/maintenance/${ticket.id}`} className="font-medium text-blue-600 hover:underline">
                      {ticket.title}
                    </Link>
                  </td>
                  <td className={tdClasses}>
                    <StatusBadge status={ticket.status} />
                  </td>
                  <td className={tdClasses}>
                    <StatusBadge status={ticket.priority} />
                  </td>
                  <td className={tdClasses}>
                    {ticket.unit.building.name} / Unit {ticket.unit.unitNumber}
                  </td>
                  <td className={tdClasses}>{ticket.assignedTo ? ticket.assignedTo.name : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
