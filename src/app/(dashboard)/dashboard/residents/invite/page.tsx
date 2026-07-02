import { requireAdminOrStaff } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { InviteForm } from "./invite-form";
import { Card, PageHeader } from "@/components/ui";

export default async function InviteResidentPage() {
  const { organizationId } = await requireAdminOrStaff();

  const buildings = await prisma.building.findMany({
    where: { organizationId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader title="Invite a resident" />
      <Card className="max-w-lg">
        <InviteForm buildings={buildings} />
      </Card>
    </div>
  );
}
