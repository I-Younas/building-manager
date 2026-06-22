import { requireAdminOrStaff } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
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

export default async function ResidentsPage() {
  const { organizationId } = await requireAdminOrStaff();

  const memberships = await prisma.orgMembership.findMany({
    where: { organizationId, role: "RESIDENT" },
    include: {
      user: {
        include: {
          unitMemberships: { include: { unit: { include: { building: true } } } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <PageHeader title="Residents" actions={<LinkButton href="/dashboard/residents/invite">Invite resident</LinkButton>} />

      {memberships.length === 0 ? (
        <EmptyState title="No residents yet" />
      ) : (
        <div className={tableWrapClasses}>
          <table className={tableClasses}>
            <thead className={theadClasses}>
              <tr>
                <th className={thClasses}>Name</th>
                <th className={thClasses}>Email</th>
                <th className={thClasses}>Unit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {memberships.map((membership) => {
                const units = membership.user.unitMemberships.filter(
                  (link) => link.unit.organizationId === organizationId,
                );

                return (
                  <tr key={membership.id} className={trClasses}>
                    <td className={`${tdClasses} font-medium text-slate-900`}>{membership.user.name}</td>
                    <td className={tdClasses}>{membership.user.email}</td>
                    <td className={tdClasses}>
                      {units.length > 0
                        ? units.map((link) => `${link.unit.building.name} / Unit ${link.unit.unitNumber}`).join(", ")
                        : "no unit linked"}
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
