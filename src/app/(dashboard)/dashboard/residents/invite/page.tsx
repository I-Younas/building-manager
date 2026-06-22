import { requireAdminOrStaff } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { InviteForm } from "./invite-form";
import { Card, PageHeader } from "@/components/ui";

export default async function InviteResidentPage({
  searchParams,
}: {
  searchParams: Promise<{ buildingId?: string; unitNumber?: string }>;
}) {
  const { organizationId } = await requireAdminOrStaff();
  const { buildingId, unitNumber } = await searchParams;

  const buildings = await prisma.building.findMany({
    where: { organizationId },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader title="Invite a member" />
      <Card className="max-w-lg">
        <InviteForm buildings={buildings} defaultBuildingId={buildingId} defaultUnitNumber={unitNumber} />
      </Card>
    </div>
  );
}
