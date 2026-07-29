import "server-only";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/lib/generated/prisma/enums";

export async function getAnnouncementsForRole(
  institutionId: string,
  role?: UserRole
) {
  const announcements = await prisma.announcement.findMany({
    where: {
      institutionId,
      ...(role
        ? {
            OR: [
              { targetRoles: { isEmpty: true } },
              { targetRoles: { has: role } },
            ],
          }
        : {}),
    },
    orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
    take: 30,
    include: { author: { select: { firstName: true, lastName: true } } },
  });
  return announcements.map((a) => ({
    id: a.id,
    title: a.title,
    content: a.content,
    priority: a.priority,
    isPinned: a.isPinned,
    publishedAt: a.publishedAt.toISOString(),
    author: `${a.author.firstName} ${a.author.lastName}`,
    attachmentUrls: a.attachmentUrls,
  }));
}

export interface Conversation {
  userId: string;
  name: string;
  role: UserRole;
  lastMessage: string;
  lastAt: string;
  unread: number;
}

export async function getConversations(userId: string): Promise<Conversation[]> {
  const messages = await prisma.message.findMany({
    where: { OR: [{ senderId: userId }, { recipientId: userId }] },
    orderBy: { createdAt: "desc" },
    include: {
      sender: { select: { id: true, firstName: true, lastName: true, role: true } },
      recipient: {
        select: { id: true, firstName: true, lastName: true, role: true },
      },
    },
  });
  const map = new Map<string, Conversation>();
  for (const m of messages) {
    const other = m.senderId === userId ? m.recipient : m.sender;
    const existing = map.get(other.id);
    if (!existing) {
      map.set(other.id, {
        userId: other.id,
        name: `${other.firstName} ${other.lastName}`,
        role: other.role,
        lastMessage: m.content,
        lastAt: m.createdAt.toISOString(),
        unread: 0,
      });
    }
    if (m.recipientId === userId && !m.isRead) {
      map.get(other.id)!.unread += 1;
    }
  }
  return [...map.values()];
}

export async function getThread(userId: string, otherId: string) {
  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: userId, recipientId: otherId },
        { senderId: otherId, recipientId: userId },
      ],
    },
    orderBy: { createdAt: "asc" },
  });
  return messages.map((m) => ({
    id: m.id,
    content: m.content,
    subject: m.subject,
    attachmentUrls: m.attachmentUrls,
    mine: m.senderId === userId,
    createdAt: m.createdAt.toISOString(),
  }));
}
