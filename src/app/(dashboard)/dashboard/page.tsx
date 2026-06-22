import { requireOrgScope } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { Card, EmptyState, PageHeader } from "@/components/ui";

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

  const stats = [
    { label: isAdmin ? "Open tickets" : "My open tickets", value: openTicketCount },
    { label: isAdmin ? "Pending bookings" : "My pending bookings", value: pendingBookingCount },
    { label: isAdmin ? "Outstanding invoices" : "My outstanding invoices", value: openInvoiceCount },
  ];

  return (
    <div>
      <PageHeader title={`Welcome, ${user.name}`} description={`Role: ${role.replace("_", " ")}`} />

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <p className="text-3xl font-semibold text-slate-900">{stat.value}</p>
            <p className="mt-1 text-sm text-slate-500">{stat.label}</p>
          </Card>
        ))}
      </div>

      <h2 className="mb-3 text-lg font-semibold text-slate-900">Announcements</h2>
      {announcements.length === 0 ? (
        <EmptyState title="No announcements yet" />
      ) : (
        <div className="flex flex-col gap-4">
          {announcements.map((announcement) => (
            <Card key={announcement.id}>
              <div className="flex items-baseline justify-between gap-4">
                <p className="font-medium text-slate-900">{announcement.title}</p>
                <p className="text-xs text-slate-500">
                  {announcement.scope === "BUILDING" ? announcement.building?.name : "All buildings"}
                </p>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{announcement.body}</p>
              <p className="mt-3 text-xs text-slate-400">
                Posted {announcement.publishedAt.toLocaleDateString()}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
