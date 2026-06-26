import { requireOrgScope } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { getDictionary, formatMessage } from "@/lib/i18n/get-dictionary";
import { formatDateTime } from "@/lib/format";
import { Card, EmptyState, PageHeader } from "@/components/ui";

export default async function DashboardPage() {
  const { user, organizationId, role } = await requireOrgScope();
  const dict = await getDictionary();
  const isAdmin = role !== "RESIDENT";

  let unitIds: string[] = [];
  let buildingIds: string[] = [];
  let floorKeys: string[] = [];
  if (!isAdmin) {
    const myUnits = await prisma.unitResident.findMany({
      where: { userId: user.id, unit: { organizationId } },
      include: { unit: true },
    });
    unitIds = myUnits.map((link) => link.unitId);
    buildingIds = [...new Set(myUnits.map((link) => link.unit.buildingId))];
    floorKeys = [
      ...new Set(myUnits.filter((link) => link.unit.floor).map((link) => `${link.unit.buildingId}::${link.unit.floor}`)),
    ];
  }

  const announcements = await prisma.announcement.findMany({
    where: {
      organizationId,
      ...(isAdmin
        ? {}
        : {
            status: "SENT",
            AND: [
              {
                OR: [
                  { audience: "ALL_ORG" },
                  { audience: "BUILDINGS", targetBuildingIds: { hasSome: buildingIds } },
                  { audience: "UNITS", targetUnitIds: { hasSome: unitIds } },
                  { audience: "FLOORS", targetFloors: { hasSome: floorKeys } },
                  { recipientOverrides: { some: { userId: user.id, mode: "INCLUDE" } } },
                ],
              },
              { OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
            ],
          }),
    },
    orderBy: { publishedAt: "desc" },
    take: 5,
  });

  const ticketWhere: Prisma.MaintenanceTicketWhereInput = {
    organizationId,
    status: { in: ["OPEN", "IN_PROGRESS"] },
    ...(isAdmin ? {} : { unitId: { in: unitIds } }),
  };

  const invoiceWhere: Prisma.InvoiceWhereInput = {
    organizationId,
    status: { in: ["ISSUED", "PARTIALLY_PAID", "OVERDUE"] },
    ...(isAdmin ? {} : { unitId: { in: unitIds } }),
  };

  const [openTicketCount, openInvoiceCount] = await Promise.all([
    prisma.maintenanceTicket.count({ where: ticketWhere }),
    prisma.invoice.count({ where: invoiceWhere }),
  ]);

  const stats = [
    { label: isAdmin ? dict.dashboard.openTickets : dict.dashboard.myOpenTickets, value: openTicketCount },
    { label: isAdmin ? dict.dashboard.outstandingInvoices : dict.dashboard.myOutstandingInvoices, value: openInvoiceCount },
  ];

  return (
    <div>
      <PageHeader
        title={formatMessage(dict.dashboard.welcome, { name: user.name })}
        description={formatMessage(dict.dashboard.role, { role: role.replace("_", " ") })}
      />

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <p className="text-3xl font-semibold text-slate-900">{stat.value}</p>
            <p className="mt-1 text-sm text-slate-500">{stat.label}</p>
          </Card>
        ))}
      </div>

      <h2 className="mb-3 text-lg font-semibold text-slate-900">{dict.dashboard.announcements}</h2>
      {announcements.length === 0 ? (
        <EmptyState title={dict.dashboard.noAnnouncements} />
      ) : (
        <div className="flex flex-col gap-4">
          {announcements.map((announcement) => (
            <Card key={announcement.id}>
              <div className="flex items-baseline justify-between gap-4">
                <p className="font-medium text-slate-900">{announcement.title}</p>
                <p className="text-xs text-slate-500">
                  {announcement.audience === "ALL_ORG" ? "All buildings" : announcement.audience.replace("_", " ")}
                </p>
              </div>
              <div
                className="rich-text-content mt-2 text-sm text-slate-600"
                dangerouslySetInnerHTML={{ __html: announcement.body }}
              />
              <p className="mt-3 text-xs text-slate-400">
                Posted {formatDateTime(announcement.publishedAt)}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
