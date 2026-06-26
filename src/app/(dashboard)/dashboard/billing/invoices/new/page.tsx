import { requireAdminOrStaff } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { InvoiceForm } from "./invoice-form";
import { PageHeader } from "@/components/ui";

export default async function NewInvoicePage() {
  const { organizationId } = await requireAdminOrStaff();

  const [units, staffMemberships] = await Promise.all([
    prisma.unit.findMany({
      where: { organizationId },
      include: { building: true },
      orderBy: [{ building: { name: "asc" } }, { unitNumber: "asc" }],
    }),
    prisma.orgMembership.findMany({
      where: { organizationId, role: "STAFF" },
      include: { user: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return (
    <div>
      <PageHeader title="Create invoice" />
      <InvoiceForm
        units={units.map((unit) => ({
          id: unit.id,
          unitNumber: unit.unitNumber,
          buildingName: unit.building.name,
        }))}
        staff={staffMemberships.map((m) => ({ id: m.user.id, name: m.user.name }))}
      />
    </div>
  );
}
