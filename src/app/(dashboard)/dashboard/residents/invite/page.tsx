import { requireAdminOrStaff } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { InviteForm } from "./invite-form";

export default async function InviteResidentPage({
  searchParams,
}: {
  searchParams: Promise<{ unitId?: string }>;
}) {
  const { organizationId } = await requireAdminOrStaff();
  const { unitId } = await searchParams;

  const units = await prisma.unit.findMany({
    where: { organizationId },
    include: { building: true },
    orderBy: [{ building: { name: "asc" } }, { unitNumber: "asc" }],
  });

  return (
    <div>
      <h1>Invite a member</h1>
      <InviteForm
        units={units.map((unit) => ({
          id: unit.id,
          unitNumber: unit.unitNumber,
          buildingName: unit.building.name,
        }))}
        defaultUnitId={unitId}
      />
    </div>
  );
}
