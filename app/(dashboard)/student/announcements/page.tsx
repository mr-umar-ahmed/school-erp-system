import type { Metadata } from "next";
import { requireRole, institutionScope } from "@/lib/auth/dal";
import { getAnnouncementsForRole } from "@/features/communication/queries";
import { AnnouncementFeed } from "@/components/shared/announcement-feed";

export const metadata: Metadata = { title: "Announcements" };

export default async function StudentAnnouncementsPage() {
  const user = await requireRole(["student"]);
  const announcements = await getAnnouncementsForRole(
    institutionScope(user),
    "student"
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">Announcements</h1>
      <AnnouncementFeed items={announcements} />
    </div>
  );
}
