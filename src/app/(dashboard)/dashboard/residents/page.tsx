import { requireAdminOrStaff } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { getDictionary } from "@/lib/i18n/get-dictionary";
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
  const dict = await getDictionary();

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
      <PageHeader
        title={dict.residents.heading}
        actions={<LinkButton href="/dashboard/residents/invite">{dict.residents.inviteResident}</LinkButton>}
      />

      {memberships.length === 0 ? (
        <EmptyState title={dict.residents.noResidents} />
      ) : (
        <div className={tableWrapClasses}>
          <table className={tableClasses}>
            <thead className={theadClasses}>
              <tr>
                <th className={thClasses}>{dict.residents.name}</th>
                <th className={thClasses}>{dict.residents.email}</th>
                <th className={thClasses}>{dict.residents.unit}</th>
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
                        : dict.residents.noUnitLinked}
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
