import type { Metadata } from "next";
import { requireRole, institutionScope } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import {
  getAnnouncementsForRole,
  getConversations,
  getThread,
} from "@/features/communication/queries";
import { markThreadRead } from "@/features/communication/actions";
import { MessageCenter } from "@/components/shared/message-center";
import { AnnouncementFeed } from "@/components/shared/announcement-feed";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export const metadata: Metadata = { title: "Messages" };

export default async function TeacherCommunicationPage({
  searchParams,
}: {
  searchParams: Promise<{ with?: string }>;
}) {
  const user = await requireRole(["teacher"]);
  const institutionId = institutionScope(user);
  const { with: withId } = await searchParams;

  // Parents of students in sections this teacher teaches + admins.
  const [sections, admins] = await Promise.all([
    prisma.timetableSlot.findMany({
      where: { teacherId: user.id },
      select: { sectionId: true },
      distinct: ["sectionId"],
    }),
    prisma.user.findMany({
      where: { institutionId, role: { in: ["admin", "super_admin"] }, isActive: true },
      select: { id: true, firstName: true, lastName: true },
    }),
  ]);
  const parents = await prisma.user.findMany({
    where: {
      institutionId,
      isActive: true,
      role: "parent",
      parent: {
        studentLinks: {
          some: {
            student: {
              sectionId: { in: sections.map((s) => s.sectionId) },
            },
          },
        },
      },
    },
    select: { id: true, firstName: true, lastName: true },
    orderBy: { firstName: "asc" },
    take: 100,
  });

  const [conversations, announcements] = await Promise.all([
    getConversations(user.id),
    getAnnouncementsForRole(institutionId, "teacher"),
  ]);

  let thread: Awaited<ReturnType<typeof getThread>> = [];
  let activeName: string | undefined;
  if (withId) {
    const other = await prisma.user.findFirst({
      where: { id: withId, institutionId },
      select: { firstName: true, lastName: true },
    });
    if (other) {
      activeName = `${other.firstName} ${other.lastName}`;
      thread = await getThread(user.id, withId);
      await markThreadRead(withId);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">Communication</h1>
      <Tabs defaultValue="messages">
        <TabsList className="rounded-full">
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
        </TabsList>
        <TabsContent value="messages" className="mt-4">
          <MessageCenter
            conversations={conversations}
            thread={thread}
            activeUserId={activeName ? withId : undefined}
            activeName={activeName}
            recipients={[
              ...admins.map((a) => ({
                id: a.id,
                label: `${a.firstName} ${a.lastName} (Admin)`,
              })),
              ...parents.map((p) => ({
                id: p.id,
                label: `${p.firstName} ${p.lastName} (Parent)`,
              })),
            ]}
          />
        </TabsContent>
        <TabsContent value="announcements" className="mt-4">
          <AnnouncementFeed items={announcements} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
