import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminOrStaff } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { removeUnitResident } from "@/lib/actions/units";

export default async function UnitDetailPage({
  params,
}: {
  params: Promise<{ unitId: string }>;
}) {
  const { organizationId } = await requireAdminOrStaff();
  const { unitId } = await params;

  const unit = await prisma.unit.findFirst({
    where: { id: unitId, organizationId },
    include: {
      building: true,
      residentLinks: { include: { user: true }, orderBy: { createdAt: "asc" } },
    },
  });

  if (!unit) notFound();

  return (
    <div>
      <p>
        <Link href={`/dashboard/buildings/${unit.buildingId}`}>{unit.building.name}</Link>
      </p>
      <h1>Unit {unit.unitNumber}</h1>
      {unit.floor ? <p>Floor {unit.floor}</p> : null}

      <h2>Residents</h2>
      {unit.residentLinks.length === 0 ? (
        <p>No residents linked to this unit yet.</p>
      ) : (
        <ul>
          {unit.residentLinks.map((link) => (
            <li key={link.id}>
              {link.user.name} ({link.user.email}) — {link.relationship}
              {link.isPrimary ? " · primary" : ""}{" "}
              <form action={removeUnitResident.bind(null, link.id)} style={{ display: "inline" }}>
                <button type="submit">Remove</button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <p>
        <Link href={`/dashboard/residents/invite?unitId=${unit.id}`}>Invite a resident for this unit</Link>
      </p>
    </div>
  );
}
