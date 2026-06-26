import Link from "next/link";
import { requireOrgScope } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { deleteAnnouncement, acknowledgeAnnouncement } from "@/lib/actions/announcements";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { formatDateTime } from "@/lib/format";
import { Badge, Button, Card, EmptyState, LinkButton, PageHeader, StatusBadge, inputClasses } from "@/components/ui";

export default async function AnnouncementsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { user, organizationId, role } = await requireOrgScope();
  const dict = await getDictionary();
  const isAdmin = role !== "RESIDENT";
  const { q } = await searchParams;

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

  const where: Prisma.AnnouncementWhereInput = {
    organizationId,
    ...(q ? { OR: [{ title: { contains: q, mode: "insensitive" } }, { body: { contains: q, mode: "insensitive" } }] } : {}),
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
  };

  const announcements = await prisma.announcement.findMany({
    where,
    include: {
      postedBy: true,
      attachments: true,
      acknowledgments: { where: { userId: user.id } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title={dict.announcements.heading}
        actions={isAdmin ? <LinkButton href="/dashboard/announcements/new">{dict.announcements.postAnnouncement}</LinkButton> : null}
      />

      {isAdmin ? (
        <form className="mb-4 max-w-sm">
          <input type="search" name="q" defaultValue={q} placeholder={dict.announcements.search} className={inputClasses} />
        </form>
      ) : null}

      {announcements.length === 0 ? (
        <EmptyState title={dict.announcements.noAnnouncements} />
      ) : (
        <div className="flex flex-col gap-4">
          {announcements.map((announcement) => {
            const acknowledged = announcement.acknowledgments.length > 0;
            return (
              <Card key={announcement.id}>
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Link href={`/dashboard/announcements/${announcement.id}`} className="font-medium text-slate-900 hover:underline">
                      {announcement.title}
                    </Link>
                    {announcement.status !== "SENT" ? <StatusBadge status={announcement.status} /> : null}
                    {announcement.priority !== "NORMAL" ? <StatusBadge status={announcement.priority} /> : null}
                  </div>
                  <p className="text-xs text-slate-500">
                    {announcement.audience === "ALL_ORG" ? "All buildings" : announcement.audience.replace("_", " ")}
                  </p>
                </div>
                <div
                  className="rich-text-content mt-2 text-sm text-slate-600"
                  dangerouslySetInnerHTML={{ __html: announcement.body }}
                />
                <p className="mt-3 text-xs text-slate-400">
                  Posted {formatDateTime(announcement.publishedAt)} by {announcement.postedBy.name}
                  {announcement.expiresAt ? ` · expires ${announcement.expiresAt.toLocaleDateString()}` : ""}
                </p>
                {!isAdmin && announcement.requireAcknowledgment ? (
                  acknowledged ? (
                    <Badge tone="success">{dict.announcements.acknowledged}</Badge>
                  ) : (
                    <form action={acknowledgeAnnouncement.bind(null, announcement.id)}>
                      <Button type="submit" size="sm" className="mt-2">
                        {dict.announcements.iveReadThis}
                      </Button>
                    </form>
                  )
                ) : null}
                {isAdmin ? (
                  <div className="mt-3 flex items-center gap-3">
                    <Link href={`/dashboard/announcements/${announcement.id}`} className="text-sm font-medium text-blue-600 hover:underline">
                      {dict.announcements.view}
                    </Link>
                    {announcement.status !== "SENT" ? (
                      <Link
                        href={`/dashboard/announcements/${announcement.id}/edit`}
                        className="text-sm font-medium text-blue-600 hover:underline"
                      >
                        {dict.common.edit}
                      </Link>
                    ) : null}
                    <Link
                      href={`/dashboard/announcements/new?duplicateFrom=${announcement.id}`}
                      className="text-sm font-medium text-blue-600 hover:underline"
                    >
                      {dict.announcements.duplicate}
                    </Link>
                    <form action={deleteAnnouncement.bind(null, announcement.id)}>
                      <Button type="submit" variant="danger" size="sm">
                        {dict.common.delete}
                      </Button>
                    </form>
                  </div>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
