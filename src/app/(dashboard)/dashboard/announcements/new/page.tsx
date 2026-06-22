import { requireAdminOrStaff } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { createAnnouncement } from "@/lib/actions/announcements";
import { AnnouncementForm } from "../announcement-form";

export default async function NewAnnouncementPage() {
  const { organizationId } = await requireAdminOrStaff();
  const buildings = await prisma.building.findMany({ where: { organizationId }, orderBy: { name: "asc" } });

  return (
    <div>
      <h1>Post announcement</h1>
      <AnnouncementForm action={createAnnouncement} buildings={buildings} submitLabel="Post announcement" />
    </div>
  );
}
