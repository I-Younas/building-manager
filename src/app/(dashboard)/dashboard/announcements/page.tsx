import Link from "next/link";
import { requireOrgScope } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { deleteAnnouncement } from "@/lib/actions/announcements";
import { Button, Card, EmptyState, LinkButton, PageHeader } from "@/components/ui";

export default async function AnnouncementsPage() {
  const { user, organizationId, role } = await requireOrgScope();
  const isAdmin = role !== "RESIDENT";

  let buildingIds: string[] = [];
  if (!isAdmin) {
    const myUnits = await prisma.unitResident.findMany({
      where: { userId: user.id, unit: { organizationId } },
      include: { unit: true },
    });
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
    include: { building: true, postedBy: true },
    orderBy: { publishedAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Announcements"
        actions={isAdmin ? <LinkButton href="/dashboard/announcements/new">Post announcement</LinkButton> : null}
      />

      {announcements.length === 0 ? (
        <EmptyState title="No announcements yet" />
      ) : (
        <div className="flex flex-col gap-4">
          {announcements.map((announcement) => (
            <Card key={announcement.id}>
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <p className="font-medium text-slate-900">{announcement.title}</p>
                <p className="text-xs text-slate-500">
                  {announcement.scope === "BUILDING" ? announcement.building?.name : "All buildings"}
                </p>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{announcement.body}</p>
              <p className="mt-3 text-xs text-slate-400">
                Posted {announcement.publishedAt.toLocaleDateString()} by {announcement.postedBy.name}
                {announcement.expiresAt ? ` · expires ${announcement.expiresAt.toLocaleDateString()}` : ""}
              </p>
              {isAdmin ? (
                <div className="mt-3 flex items-center gap-3">
                  <Link
                    href={`/dashboard/announcements/${announcement.id}/edit`}
                    className="text-sm font-medium text-blue-600 hover:underline"
                  >
                    Edit
                  </Link>
                  <form action={deleteAnnouncement.bind(null, announcement.id)}>
                    <Button type="submit" variant="danger" size="sm">
                      Delete
                    </Button>
                  </form>
                </div>
              ) : null}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
