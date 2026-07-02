import { requireAdminOrStaff } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { NewUnitForm } from "./new-unit-form";

export default async function NewUnitPage() {
  const { organizationId } = await requireAdminOrStaff();

  const buildings = await prisma.building.findMany({
    where: { organizationId },
    select: { id: true, name: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <PageHeader title="Add unit" />
      <NewUnitForm buildings={buildings} />
    </div>
  );
}
