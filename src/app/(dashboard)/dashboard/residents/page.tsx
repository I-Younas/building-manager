import Link from "next/link";
import { requireAdminOrStaff } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";

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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h1>Residents</h1>
        <Link href="/dashboard/residents/invite">Invite resident</Link>
      </div>

      {memberships.length === 0 ? (
        <p>No residents yet.</p>
      ) : (
        <ul>
          {memberships.map((membership) => {
            const units = membership.user.unitMemberships.filter(
              (link) => link.unit.organizationId === organizationId,
            );

            return (
              <li key={membership.id}>
                {membership.user.name} ({membership.user.email}) —{" "}
                {units.length > 0
                  ? units.map((link) => `${link.unit.building.name} / Unit ${link.unit.unitNumber}`).join(", ")
                  : "no unit linked"}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
