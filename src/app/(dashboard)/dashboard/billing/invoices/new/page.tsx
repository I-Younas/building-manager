import { requireAdminOrStaff } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { InvoiceForm } from "./invoice-form";
import { PageHeader } from "@/components/ui";

export default async function NewInvoicePage() {
  const { organizationId } = await requireAdminOrStaff();

  const units = await prisma.unit.findMany({
    where: { organizationId },
    include: { building: true },
    orderBy: [{ building: { name: "asc" } }, { unitNumber: "asc" }],
  });

  return (
    <div>
      <PageHeader title="Create invoice" />
      <InvoiceForm
        units={units.map((unit) => ({
          id: unit.id,
          unitNumber: unit.unitNumber,
          buildingName: unit.building.name,
        }))}
      />
    </div>
  );
}
