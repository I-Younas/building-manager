import Link from "next/link";
import { requireAdminOrStaff } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getUnitStatus } from "@/lib/leases/status";
import {
  EmptyState,
  LinkButton,
  PageHeader,
  tableClasses,
  tableWrapClasses,
  tdClasses,
  thClasses,
  theadClasses,
  trClasses,
} from "@/components/ui";

export default async function BuildingsPage() {
  const { organizationId } = await requireAdminOrStaff();
  const dict = await getDictionary();

  const buildings = await prisma.building.findMany({
    where: { organizationId },
    include: {
      units: {
        include: {
          residentLinks: { select: { id: true } },
          leases: { where: { status: "ACTIVE" }, select: { status: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <PageHeader
        title={dict.buildings.heading}
        actions={
          <div className="flex items-center gap-3">
            <LinkButton href="/dashboard/buildings/new">{dict.buildings.addBuilding}</LinkButton>
            <LinkButton href="/dashboard/units/new">{dict.buildings.addUnit}</LinkButton>
          </div>
        }
      />

      {buildings.length === 0 ? (
        <EmptyState title={dict.buildings.noBuildings} description={dict.buildings.noBuildingsDescription} />
      ) : (
        <div className={tableWrapClasses}>
          <table className={tableClasses}>
            <thead className={theadClasses}>
              <tr>
                <th className={thClasses}>{dict.buildings.building}</th>
                <th className={thClasses}>{dict.buildings.units}</th>
                <th className={thClasses}>{dict.buildings.rentedUnits}</th>
                <th className={thClasses}>{dict.buildings.vacantUnits}</th>
                <th className={thClasses}></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {buildings.map((building) => {
                const statuses = building.units.map(getUnitStatus);
                const rented = statuses.filter((s) => s === "RENTED").length;
                const vacant = statuses.filter((s) => s === "VACANT").length;
                const pending = statuses.filter((s) => s === "PENDING").length;
                return (
                  <tr key={building.id} className={trClasses}>
                    <td className={tdClasses}>
                      <span className="font-medium text-slate-900">{building.name}</span>
                    </td>
                    <td className={tdClasses}>{building.units.length}</td>
                    <td className={tdClasses}>
                      <Link
                        href={`/dashboard/buildings/${building.id}/rented-units`}
                        className="text-blue-600 hover:underline"
                      >
                        {rented}
                      </Link>
                    </td>
                    <td className={tdClasses}>
                      <Link
                        href={`/dashboard/buildings/${building.id}/vacant-units`}
                        className="text-blue-600 hover:underline"
                      >
                        {vacant}
                      </Link>
                      {pending > 0 ? (
                        <Link
                          href={`/dashboard/buildings/${building.id}/pending-units`}
                          className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 hover:bg-amber-200"
                        >
                          {pending} {dict.buildings.pendingUnits}
                        </Link>
                      ) : null}
                    </td>
                    <td className={tdClasses}>
                      <Link
                        href={`/dashboard/buildings/${building.id}/edit`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {dict.common.edit}
                      </Link>
                    </td>
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
