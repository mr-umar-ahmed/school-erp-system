import type { Metadata } from "next";
import { requireRole, institutionScope } from "@/lib/auth/dal";
import { getAnnouncementsForRole } from "@/features/communication/queries";
import { AnnouncementForm } from "@/components/forms/announcement-form";
import { AnnouncementFeed } from "@/components/shared/announcement-feed";
import { GlassmorphicCard } from "@/components/shared/glassmorphic-card";

export const metadata: Metadata = { title: "Communication" };

export default async function AdminCommunicationPage() {
  const user = await requireRole(["super_admin", "admin"]);
  const institutionId = institutionScope(user);
  const announcements = await getAnnouncementsForRole(institutionId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Communication</h1>
        <p className="text-sm text-muted-foreground">
          Publish announcements to the whole school or specific roles.
        </p>
      </div>
      <GlassmorphicCard>
        <h2 className="mb-3 text-lg">New Announcement</h2>
        <AnnouncementForm />
      </GlassmorphicCard>
      <div>
        <h2 className="mb-3 text-lg font-heading font-bold">Published</h2>
        <AnnouncementFeed items={announcements} />
      </div>
    </div>
  );
}
