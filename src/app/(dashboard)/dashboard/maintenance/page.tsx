import Link from "next/link";
import { requireOrgScope } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";

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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h1>Maintenance</h1>
        <Link href="/dashboard/maintenance/new">Report an issue</Link>
      </div>

      {role !== "RESIDENT" ? (
        <nav style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <Link href="/dashboard/maintenance">All</Link>
          {STATUS_FILTERS.map((s) => (
            <Link key={s} href={`/dashboard/maintenance?status=${s}`}>
              {s}
            </Link>
          ))}
        </nav>
      ) : null}

      {tickets.length === 0 ? (
        <p>No tickets yet.</p>
      ) : (
        <ul>
          {tickets.map((ticket) => (
            <li key={ticket.id}>
              <Link href={`/dashboard/maintenance/${ticket.id}`}>{ticket.title}</Link> — {ticket.status} ·{" "}
              {ticket.priority} · {ticket.unit.building.name} / Unit {ticket.unit.unitNumber}
              {ticket.assignedTo ? ` · assigned to ${ticket.assignedTo.name}` : ""}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
