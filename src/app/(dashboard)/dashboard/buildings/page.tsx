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
    include: { _count: { select: { units: true } } },
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
                <th className={thClasses}>{dict.buildings.units}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {buildings.map((building) => (
                <tr key={building.id} className={trClasses}>
                  <td className={tdClasses}>
                    <Link href={`/dashboard/buildings/${building.id}`} className="font-medium text-blue-600 hover:underline">
                      {building.name}
                    </Link>
                  </td>
                  <td className={tdClasses}>{building._count.units}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
