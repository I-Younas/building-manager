import Link from "next/link";
import { requireAdminOrStaff } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { EmptyState, LinkButton, PageHeader, tableClasses, tableWrapClasses, tdClasses, thClasses, theadClasses, trClasses } from "@/components/ui";

export default async function BuildingsPage() {
  const { organizationId } = await requireAdminOrStaff();
  const dict = await getDictionary();

  const buildings = await prisma.building.findMany({
    where: { organizationId },
    include: { units: { include: { _count: { select: { residentLinks: true } } } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <PageHeader
        title={dict.buildings.heading}
        actions={<LinkButton href="/dashboard/buildings/new">{dict.buildings.addBuilding}</LinkButton>}
      />

      {buildings.length === 0 ? (
        <EmptyState title={dict.buildings.noBuildings} description={dict.buildings.noBuildingsDescription} />
      ) : (
        <div className={tableWrapClasses}>
          <table className={tableClasses}>
            <thead className={theadClasses}>
              <tr>
                <th className={thClasses}>{dict.buildings.building}</th>
                <th className={thClasses}>{dict.buildings.rentedUnits}</th>
                <th className={thClasses}>{dict.buildings.vacantUnits}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {buildings.map((building) => {
                const rented = building.units.filter((u) => u._count.residentLinks > 0).length;
                const vacant = building.units.length - rented;
                return (
                  <tr key={building.id} className={trClasses}>
                    <td className={tdClasses}>
                      <Link href={`/dashboard/buildings/${building.id}`} className="font-medium text-blue-600 hover:underline">
                        {building.name}
                      </Link>
                    </td>
                    <td className={tdClasses}>
                      <Link href={`/dashboard/buildings/${building.id}/rented-units`} className="text-blue-600 hover:underline">
                        {rented}
                      </Link>
                    </td>
                    <td className={tdClasses}>
                      <Link href={`/dashboard/buildings/${building.id}/vacant-units`} className="text-blue-600 hover:underline">
                        {vacant}
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
