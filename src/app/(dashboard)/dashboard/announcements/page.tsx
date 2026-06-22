import Link from "next/link";
import { requireOrgScope } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { deleteAnnouncement } from "@/lib/actions/announcements";

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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h1>Announcements</h1>
        {isAdmin ? <Link href="/dashboard/announcements/new">Post announcement</Link> : null}
      </div>

      {announcements.length === 0 ? (
        <p>No announcements yet.</p>
      ) : (
        <ul>
          {announcements.map((announcement) => (
            <li key={announcement.id} style={{ marginBottom: 16 }}>
              <strong>{announcement.title}</strong> —{" "}
              {announcement.scope === "BUILDING" ? announcement.building?.name : "All buildings"}
              <br />
              <span style={{ whiteSpace: "pre-wrap" }}>{announcement.body}</span>
              <br />
              Posted {announcement.publishedAt.toLocaleDateString()} by {announcement.postedBy.name}
              {announcement.expiresAt ? ` · expires ${announcement.expiresAt.toLocaleDateString()}` : ""}
              {isAdmin ? (
                <>
                  <br />
                  <Link href={`/dashboard/announcements/${announcement.id}/edit`}>Edit</Link>{" "}
                  <form action={deleteAnnouncement.bind(null, announcement.id)} style={{ display: "inline" }}>
                    <button type="submit">Delete</button>
                  </form>
                </>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
