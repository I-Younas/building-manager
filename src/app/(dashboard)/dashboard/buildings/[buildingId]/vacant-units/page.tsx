import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminOrStaff } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { getUnitStatus } from "@/lib/leases/status";
import { EmptyState, LinkButton, PageHeader, tableClasses, tableWrapClasses, tdClasses, thClasses, theadClasses, trClasses } from "@/components/ui";

export default async function VacantUnitsPage({
  params,
}: {
  params: Promise<{ buildingId: string }>;
}) {
  const { organizationId } = await requireAdminOrStaff();
  const { buildingId } = await params;

  const building = await prisma.building.findFirst({
    where: { id: buildingId, organizationId },
    include: {
      units: {
        include: {
          residentLinks: { select: { id: true } },
          leases: { orderBy: { leaseEndDate: "desc" }, take: 1, select: { status: true, leaseEndDate: true } },
        },
        orderBy: { unitNumber: "asc" },
      },
    },
  });

  if (!building) notFound();

  const vacantUnits = building.units
    .filter((unit) => getUnitStatus(unit) === "VACANT")
    .map((unit) => ({
      id: unit.id,
      unitNumber: unit.unitNumber,
      floor: unit.floor,
    }));

  return (
    <div>
      <Link href="/dashboard/buildings" className="text-sm text-blue-600 hover:underline">
        ← Buildings
      </Link>
      <PageHeader title={`${building.name} — Vacant units`} />

      {vacantUnits.length === 0 ? (
        <EmptyState title="No vacant units" />
      ) : (
        <div className={tableWrapClasses}>
          <table className={tableClasses}>
            <thead className={theadClasses}>
              <tr>
                <th className={thClasses}>Unit</th>
                <th className={thClasses}>Floor</th>
                <th className={thClasses}></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vacantUnits.map((unit) => (
                <tr key={unit.id} className={trClasses}>
                  <td className={tdClasses}>
                    <Link href={`/dashboard/units/${unit.id}`} className="font-medium text-blue-600 hover:underline">
                      Unit {unit.unitNumber}
                    </Link>
                  </td>
                  <td className={tdClasses}>{unit.floor ?? "—"}</td>
                  <td className={tdClasses}>
                    <LinkButton
                      href={`/dashboard/residents/invite?buildingName=${encodeURIComponent(building.name)}&unitNumber=${encodeURIComponent(unit.unitNumber)}`}
                      variant="secondary"
                    >
                      Invite Resident
                    </LinkButton>
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
