import { requireOrgScope } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

export default async function DashboardPage() {
  const { user, organizationId, role } = await requireOrgScope();
  const isAdmin = role !== "RESIDENT";

  let unitIds: string[] = [];
  let buildingIds: string[] = [];
  if (!isAdmin) {
    const myUnits = await prisma.unitResident.findMany({
      where: { userId: user.id, unit: { organizationId } },
      include: { unit: true },
    });
    unitIds = myUnits.map((link) => link.unitId);
    buildingIds = [...new Set(myUnits.map((link) => link.unit.buildingId))];
  }

  const announcements = await prisma.announcement.findMany({
    where: {
      organizationId,
      ...(isAdmin
        ? {}
        : {
            AND: [
              { OR: [{ scope: "ORGANIZATION" }, { scope: "BUILDING", buildingId: { in: buildingIds } }] },
              { OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
            ],
          }),
    },
    include: { building: true },
    orderBy: { publishedAt: "desc" },
    take: 5,
  });

  const ticketWhere: Prisma.MaintenanceTicketWhereInput = {
    organizationId,
    status: { in: ["OPEN", "IN_PROGRESS"] },
    ...(isAdmin ? {} : { unitId: { in: unitIds } }),
  };

  const bookingWhere: Prisma.FacilityBookingWhereInput = {
    organizationId,
    status: "PENDING",
    ...(isAdmin ? {} : { unitId: { in: unitIds } }),
  };

  const invoiceWhere: Prisma.InvoiceWhereInput = {
    organizationId,
    status: { in: ["ISSUED", "PARTIALLY_PAID", "OVERDUE"] },
    ...(isAdmin ? {} : { unitId: { in: unitIds } }),
  };

  const [openTicketCount, pendingBookingCount, openInvoiceCount] = await Promise.all([
    prisma.maintenanceTicket.count({ where: ticketWhere }),
    prisma.facilityBooking.count({ where: bookingWhere }),
    prisma.invoice.count({ where: invoiceWhere }),
  ]);

  return (
    <div>
      <h1>Welcome, {user.name}</h1>
      <p>Role: {role}</p>

      <div style={{ display: "flex", gap: 24, margin: "16px 0" }}>
        <div>
          <strong>{openTicketCount}</strong>
          <br />
          {isAdmin ? "Open tickets" : "My open tickets"}
        </div>
        <div>
          <strong>{pendingBookingCount}</strong>
          <br />
          {isAdmin ? "Pending bookings" : "My pending bookings"}
        </div>
        <div>
          <strong>{openInvoiceCount}</strong>
          <br />
          {isAdmin ? "Outstanding invoices" : "My outstanding invoices"}
        </div>
      </div>

      <h2>Announcements</h2>
      {announcements.length === 0 ? (
        <p>No announcements yet.</p>
      ) : (
        <ul>
          {announcements.map((announcement) => (
            <li key={announcement.id} style={{ marginBottom: 12 }}>
              <strong>{announcement.title}</strong> —{" "}
              {announcement.scope === "BUILDING" ? announcement.building?.name : "All buildings"}
              <br />
              <span style={{ whiteSpace: "pre-wrap" }}>{announcement.body}</span>
              <br />
              Posted {announcement.publishedAt.toLocaleDateString()}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
