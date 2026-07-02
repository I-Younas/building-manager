import { requireOrgScope } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { removeStaff } from "@/lib/actions/staff";
import {
  Button,
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

export default async function StaffPage() {
  const { organizationId, role } = await requireOrgScope();
  const dict = await getDictionary();
  const isAdmin = role === "ORG_ADMIN";

  const memberships = await prisma.orgMembership.findMany({
    where: { organizationId, role: "STAFF" },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <PageHeader
        title={dict.staff.heading}
        actions={isAdmin ? <LinkButton href="/dashboard/staff/invite">{dict.staff.inviteStaff}</LinkButton> : null}
      />

      {memberships.length === 0 ? (
        <EmptyState title={dict.staff.noStaff} />
      ) : (
        <div className={tableWrapClasses}>
          <table className={tableClasses}>
            <thead className={theadClasses}>
              <tr>
                <th className={thClasses}>{dict.staff.name}</th>
                <th className={thClasses}>{dict.staff.email}</th>
                {isAdmin ? <th className={thClasses} /> : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {memberships.map((membership) => (
                <tr key={membership.id} className={trClasses}>
                  <td className={`${tdClasses} font-medium text-slate-900`}>{membership.user.name}</td>
                  <td className={tdClasses}>{membership.user.email}</td>
                  {isAdmin ? (
                    <td className={`${tdClasses} text-right`}>
                      <form action={removeStaff.bind(null, membership.user.id)}>
                        <Button type="submit" variant="danger" size="sm">
                          Delete
                        </Button>
                      </form>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
