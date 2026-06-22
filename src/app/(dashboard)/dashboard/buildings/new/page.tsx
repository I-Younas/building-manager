import { requireAdminOrStaff } from "@/lib/auth/dal";
import { createBuilding } from "@/lib/actions/buildings";
import { BuildingForm } from "../building-form";

export default async function NewBuildingPage() {
  await requireAdminOrStaff();

  return (
    <div>
      <h1>Add building</h1>
      <BuildingForm action={createBuilding} submitLabel="Create building" />
    </div>
  );
}
