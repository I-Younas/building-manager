import { notFound } from "next/navigation";
import { requireAdminOrStaff } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { updateBuilding } from "@/lib/actions/buildings";
import { BuildingForm } from "../../building-form";

export default async function EditBuildingPage({
  params,
}: {
  params: Promise<{ buildingId: string }>;
}) {
  const { organizationId } = await requireAdminOrStaff();
  const { buildingId } = await params;

  const building = await prisma.building.findFirst({ where: { id: buildingId, organizationId } });
  if (!building) notFound();

  return (
    <div>
      <h1>Edit building</h1>
      <BuildingForm
        action={updateBuilding.bind(null, buildingId)}
        defaultValues={building}
        submitLabel="Save changes"
      />
    </div>
  );
}
