import { requireOrgScope } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { NewTicketForm } from "./new-ticket-form";

export default async function NewTicketPage() {
  const { user, organizationId } = await requireOrgScope();

  const myUnits = await prisma.unitResident.findMany({
    where: { userId: user.id, unit: { organizationId } },
    include: { unit: { include: { building: true } } },
  });

  if (myUnits.length === 0) {
    return (
      <div>
        <h1>Report an issue</h1>
        <p>You need to be linked to a unit before you can report an issue. Contact your building admin.</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Report an issue</h1>
      <NewTicketForm
        units={myUnits.map((link) => ({
          id: link.unit.id,
          unitNumber: link.unit.unitNumber,
          buildingName: link.unit.building.name,
        }))}
      />
    </div>
  );
}
