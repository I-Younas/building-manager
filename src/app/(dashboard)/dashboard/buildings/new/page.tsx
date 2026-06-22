import { requireAdminOrStaff } from "@/lib/auth/dal";
import { createBuilding } from "@/lib/actions/buildings";
import { BuildingForm } from "../building-form";
import { PageHeader } from "@/components/ui";

export default async function NewBuildingPage() {
  await requireAdminOrStaff();

  return (
    <div>
      <PageHeader title="Add building" />
      <BuildingForm action={createBuilding} submitLabel="Create building" />
    </div>
  );
}
