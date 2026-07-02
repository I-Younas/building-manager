import { requireOrgScope } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { NewTicketForm } from "./new-ticket-form";
import { PageHeader } from "@/components/ui";

export default async function NewTicketPage() {
  const { user, organizationId, role } = await requireOrgScope();

  const isAdmin = role === "ORG_ADMIN" || role === "STAFF";

  const staffMemberships =
    role === "ORG_ADMIN"
      ? await prisma.orgMembership.findMany({
          where: { organizationId, role: "STAFF" },
          include: { user: { select: { id: true, name: true } } },
        })
      : [];
  const staffMembers = staffMemberships
    .map((m) => ({ userId: m.user.id, name: m.user.name ?? m.user.id }))
    .sort((a, b) => a.name.localeCompare(b.name));

  let units: { id: string; unitNumber: string; buildingName: string }[];

  if (isAdmin) {
    const allUnits = await prisma.unit.findMany({
      where: { organizationId },
      include: { building: true },
      orderBy: [{ building: { name: "asc" } }, { unitNumber: "asc" }],
    });
    units = allUnits.map((u) => ({
      id: u.id,
      unitNumber: u.unitNumber,
      buildingName: u.building.name,
    }));
  } else {
    const myUnits = await prisma.unitResident.findMany({
      where: { userId: user.id, unit: { organizationId } },
      include: { unit: { include: { building: true } } },
    });

    if (myUnits.length === 0) {
      return (
        <div>
          <PageHeader title="Report an issue" />
          <p className="text-sm text-slate-500">
            You need to be linked to a unit before you can report an issue. Contact your building admin.
          </p>
        </div>
      );
    }

    units = myUnits.map((link) => ({
      id: link.unit.id,
      unitNumber: link.unit.unitNumber,
      buildingName: link.unit.building.name,
    }));
  }

  return (
    <div>
      <PageHeader title="Report an issue" />
      <NewTicketForm units={units} staffMembers={staffMembers} />
    </div>
  );
}
