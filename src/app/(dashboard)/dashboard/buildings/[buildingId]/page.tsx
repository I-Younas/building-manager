import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminOrStaff } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { AddUnitForm } from "./add-unit-form";

export default async function BuildingDetailPage({
  params,
}: {
  params: Promise<{ buildingId: string }>;
}) {
  const { organizationId } = await requireAdminOrStaff();
  const { buildingId } = await params;

  const building = await prisma.building.findFirst({
    where: { id: buildingId, organizationId },
    include: { units: { orderBy: { unitNumber: "asc" } } },
  });

  if (!building) notFound();

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h1>{building.name}</h1>
        <Link href={`/dashboard/buildings/${building.id}/edit`}>Edit</Link>
      </div>

      <p>
        {building.addressLine1}
        {building.addressLine2 ? `, ${building.addressLine2}` : ""}, {building.city}
        {building.region ? `, ${building.region}` : ""} {building.postalCode ?? ""}, {building.country}
      </p>

      <h2>Units</h2>
      {building.units.length === 0 ? (
        <p>No units yet.</p>
      ) : (
        <ul>
          {building.units.map((unit) => (
            <li key={unit.id}>
              <Link href={`/dashboard/units/${unit.id}`}>
                Unit {unit.unitNumber}
                {unit.floor ? ` (Floor ${unit.floor})` : ""}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <h3>Add unit</h3>
      <AddUnitForm buildingId={building.id} />
    </div>
  );
}
