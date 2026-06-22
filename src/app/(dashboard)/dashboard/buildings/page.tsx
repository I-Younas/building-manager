import Link from "next/link";
import { requireAdminOrStaff } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";

export default async function BuildingsPage() {
  const { organizationId } = await requireAdminOrStaff();

  const buildings = await prisma.building.findMany({
    where: { organizationId },
    include: { _count: { select: { units: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h1>Buildings</h1>
        <Link href="/dashboard/buildings/new">Add building</Link>
      </div>

      {buildings.length === 0 ? (
        <p>No buildings yet. Add your first building to get started.</p>
      ) : (
        <ul>
          {buildings.map((building) => (
            <li key={building.id}>
              <Link href={`/dashboard/buildings/${building.id}`}>{building.name}</Link> —{" "}
              {building._count.units} unit(s)
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
