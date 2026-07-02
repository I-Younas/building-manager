import Link from "next/link";
import { requireOrgScope } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { getDictionary, formatMessage } from "@/lib/i18n/get-dictionary";
import { formatDateTime } from "@/lib/format";
import { Card, EmptyState, LinkButton, PageHeader } from "@/components/ui";

export default async function DashboardPage() {
  const { user, organizationId, role } = await requireOrgScope();
  const dict = await getDictionary();
  const isAdmin = role !== "RESIDENT";
  const isOrgAdmin = role === "ORG_ADMIN";

  let unitIds: string[] = [];
  let buildingIds: string[] = [];
  let floorKeys: string[] = [];
  if (!isOrgAdmin) {
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
      ...(isOrgAdmin
        ? {}
        : {
            status: "SENT",
            AND: [
              {
                OR: [
                  { audience: "ALL_ORG" },
                  ...(role === "STAFF" ? [{ audience: "ALL_STAFF" as const }] : []),
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
    ...(role === "ORG_ADMIN" ? {} : role === "STAFF" ? { billedToUserId: user.id } : { unitId: { in: unitIds } }),
  };

  const pendingLeaseUnits = isOrgAdmin
    ? await prisma.unit.findMany({
        where: {
          organizationId,
          residentLinks: { some: {} },
          leases: { none: { status: "ACTIVE" } },
        },
        include: {
          building: true,
          residentLinks: { include: { user: true }, orderBy: { createdAt: "asc" }, take: 1 },
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

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

      {pendingLeaseUnits.length > 0 ? (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <h2 className="mb-1 text-sm font-semibold text-amber-900">
            Lease setup required ({pendingLeaseUnits.length} unit{pendingLeaseUnits.length === 1 ? "" : "s"})
          </h2>
          <p className="mb-3 text-sm text-amber-800">
            The residents below have completed sign-up, but their unit lease period has not been set. Please finalise their lease to complete the onboarding process.
          </p>
          <div className="flex flex-col gap-2">
            {pendingLeaseUnits.map((unit) => {
              const resident = unit.residentLinks[0]?.user;
              return (
                <div key={unit.id} className="flex items-center justify-between rounded-md bg-white px-3 py-2 shadow-sm">
                  <div className="text-sm">
                    <span className="font-medium text-slate-900">{unit.building.name} — Unit {unit.unitNumber}</span>
                    {resident ? <span className="ml-2 text-slate-500">· {resident.name}</span> : null}
                  </div>
                  <Link
                    href={`/dashboard/units/${unit.id}`}
                    className="ml-4 shrink-0 text-sm font-medium text-blue-600 hover:underline"
                  >
                    Set up lease →
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

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
