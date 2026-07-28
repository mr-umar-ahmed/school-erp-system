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

export default async function ParentCommunicationPage({
  searchParams,
}: {
  searchParams: Promise<{ with?: string }>;
}) {
  const user = await requireRole(["parent"]);
  const institutionId = institutionScope(user);
  const { with: withId } = await searchParams;

  // Teachers of the parent's children's sections + admins.
  const children = await prisma.parentStudent.findMany({
    where: { parent: { userId: user.id } },
    select: { student: { select: { sectionId: true } } },
  });
  const sectionIds = children
    .map((c) => c.student.sectionId)
    .filter((v): v is string => !!v);
  const [teachers, admins] = await Promise.all([
    prisma.user.findMany({
      where: {
        institutionId,
        isActive: true,
        role: "teacher",
        timetableSlots: { some: { sectionId: { in: sectionIds } } },
      },
      select: { id: true, firstName: true, lastName: true },
      orderBy: { firstName: "asc" },
    }),
    prisma.user.findMany({
      where: { institutionId, role: { in: ["admin", "super_admin"] }, isActive: true },
      select: { id: true, firstName: true, lastName: true },
    }),
  ]);

  const [conversations, announcements] = await Promise.all([
    getConversations(user.id),
    getAnnouncementsForRole(institutionId, "parent"),
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
              ...teachers.map((t) => ({
                id: t.id,
                label: `${t.firstName} ${t.lastName} (Teacher)`,
              })),
              ...admins.map((a) => ({
                id: a.id,
                label: `${a.firstName} ${a.lastName} (Admin)`,
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
