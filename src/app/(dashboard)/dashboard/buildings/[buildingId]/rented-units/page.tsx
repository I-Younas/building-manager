import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminOrStaff } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { getLeaseDisplayStatus, getRenewalChain } from "@/lib/leases/status";
import { EmptyState, PageHeader, StatusBadge, tableClasses, tableWrapClasses, tdClasses, thClasses, theadClasses, trClasses } from "@/components/ui";

type SortKey = "unit" | "resident" | "leaseStart" | "leaseEnd" | "status" | "renewed" | "renewalCount" | "renewalStatus";

const SORT_COLUMNS: { key: SortKey; label: string }[] = [
  { key: "unit", label: "Unit" },
  { key: "resident", label: "Resident" },
  { key: "leaseStart", label: "Lease start" },
  { key: "leaseEnd", label: "Lease end" },
  { key: "status", label: "Status" },
  { key: "renewed", label: "Renewed" },
  { key: "renewalCount", label: "Renewal count" },
  { key: "renewalStatus", label: "Renewal status" },
];

export default async function RentedUnitsPage({
  params,
  searchParams,
}: {
  params: Promise<{ buildingId: string }>;
  searchParams: Promise<{ sort?: string; dir?: string }>;
}) {
  const { organizationId } = await requireAdminOrStaff();
  const { buildingId } = await params;
  const { sort, dir } = await searchParams;
  const sortKey: SortKey = (SORT_COLUMNS.some((c) => c.key === sort) ? sort : "leaseEnd") as SortKey;
  const sortDir = dir === "desc" ? "desc" : "asc";

  const building = await prisma.building.findFirst({
    where: { id: buildingId, organizationId },
    include: {
      units: {
        include: {
          leases: { where: { status: "ACTIVE" }, include: { primaryResident: true } },
        },
        orderBy: { unitNumber: "asc" },
      },
    },
  });

  if (!building) notFound();

  const rows = await Promise.all(
    building.units
      .filter((unit) => unit.leases.length > 0)
      .map(async (unit) => {
        const lease = unit.leases[0];
        const { renewed, renewalCount } = await getRenewalChain(lease.id);
        return {
          unitId: unit.id,
          unitNumber: unit.unitNumber,
          residentName: lease.primaryResident.name,
          leaseStartDate: lease.leaseStartDate,
          leaseEndDate: lease.leaseEndDate,
          status: getLeaseDisplayStatus(lease),
          renewed,
          renewalCount,
          renewalStatus: lease.renewalStatus,
        };
      }),
  );

  rows.sort((a, b) => {
    let cmp = 0;
    switch (sortKey) {
      case "unit":
        cmp = a.unitNumber.localeCompare(b.unitNumber);
        break;
      case "resident":
        cmp = a.residentName.localeCompare(b.residentName);
        break;
      case "leaseStart":
        cmp = a.leaseStartDate.getTime() - b.leaseStartDate.getTime();
        break;
      case "leaseEnd":
        cmp = a.leaseEndDate.getTime() - b.leaseEndDate.getTime();
        break;
      case "status":
        cmp = a.status.localeCompare(b.status);
        break;
      case "renewed":
        cmp = Number(a.renewed) - Number(b.renewed);
        break;
      case "renewalCount":
        cmp = a.renewalCount - b.renewalCount;
        break;
      case "renewalStatus":
        cmp = (a.renewalStatus ?? "").localeCompare(b.renewalStatus ?? "");
        break;
    }
    return sortDir === "desc" ? -cmp : cmp;
  });

  return (
    <div>
      <Link href={`/dashboard/buildings/${building.id}`} className="text-sm text-blue-600 hover:underline">
        ← {building.name}
      </Link>
      <PageHeader title={`${building.name} — Rented units`} />

      {rows.length === 0 ? (
        <EmptyState title="No rented units yet" />
      ) : (
        <div className={tableWrapClasses}>
          <table className={tableClasses}>
            <thead className={theadClasses}>
              <tr>
                {SORT_COLUMNS.map((col) => {
                  const nextDir = sortKey === col.key && sortDir === "asc" ? "desc" : "asc";
                  return (
                    <th key={col.key} className={thClasses}>
                      <Link
                        href={`?sort=${col.key}&dir=${nextDir}`}
                        className="flex items-center gap-1 hover:text-slate-700"
                      >
                        {col.label}
                        {sortKey === col.key ? <span>{sortDir === "asc" ? "▲" : "▼"}</span> : null}
                      </Link>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.unitId} className={trClasses}>
                  <td className={tdClasses}>
                    <Link href={`/dashboard/units/${row.unitId}`} className="font-medium text-blue-600 hover:underline">
                      Unit {row.unitNumber}
                    </Link>
                  </td>
                  <td className={tdClasses}>{row.residentName}</td>
                  <td className={tdClasses}>{row.leaseStartDate.toLocaleDateString()}</td>
                  <td className={tdClasses}>{row.leaseEndDate.toLocaleDateString()}</td>
                  <td className={tdClasses}>
                    <StatusBadge status={row.status} />
                  </td>
                  <td className={tdClasses}>{row.renewed ? "Yes" : "No"}</td>
                  <td className={tdClasses}>{row.renewalCount}</td>
                  <td className={tdClasses}>
                    {row.renewalStatus ? <StatusBadge status={row.renewalStatus} /> : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
