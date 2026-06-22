import Link from "next/link";
import { requireAdminOrStaff } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { EmptyState, LinkButton, PageHeader, tableClasses, tableWrapClasses, tdClasses, thClasses, theadClasses, trClasses } from "@/components/ui";

export default async function BuildingsPage() {
  const { organizationId } = await requireAdminOrStaff();

  const buildings = await prisma.building.findMany({
    where: { organizationId },
    include: { _count: { select: { units: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="Buildings"
        actions={<LinkButton href="/dashboard/buildings/new">Add building</LinkButton>}
      />

      {buildings.length === 0 ? (
        <EmptyState title="No buildings yet" description="Add your first building to get started." />
      ) : (
        <div className={tableWrapClasses}>
          <table className={tableClasses}>
            <thead className={theadClasses}>
              <tr>
                <th className={thClasses}>Building</th>
                <th className={thClasses}>Units</th>
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
