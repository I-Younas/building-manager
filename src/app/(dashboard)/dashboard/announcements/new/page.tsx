import { requireAdminOrStaff } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { createAnnouncement } from "@/lib/actions/announcements";
import { AnnouncementForm } from "../announcement-form";
import { PageHeader } from "@/components/ui";

export default async function NewAnnouncementPage() {
  const { organizationId } = await requireAdminOrStaff();
  const buildings = await prisma.building.findMany({ where: { organizationId }, orderBy: { name: "asc" } });

  return (
    <div>
      <PageHeader title="Post announcement" />
      <AnnouncementForm action={createAnnouncement} buildings={buildings} submitLabel="Post announcement" />
    </div>
  );
}
