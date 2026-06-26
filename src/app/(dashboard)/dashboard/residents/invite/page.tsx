import { requireAdminOrStaff } from "@/lib/auth/dal";
import { InviteForm } from "./invite-form";
import { Card, PageHeader } from "@/components/ui";

export default async function InviteResidentPage({
  searchParams,
}: {
  searchParams: Promise<{ buildingName?: string; unitNumber?: string }>;
}) {
  await requireAdminOrStaff();
  const { buildingName, unitNumber } = await searchParams;

  return (
    <div>
      <PageHeader title="Invite a resident" />
      <Card className="max-w-lg">
        <InviteForm defaultBuildingName={buildingName} defaultUnitNumber={unitNumber} />
      </Card>
    </div>
  );
}
