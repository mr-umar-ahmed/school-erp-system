"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole, requireUser, institutionScope } from "@/lib/auth/dal";

const announcementSchema = z.object({
  title: z.string().min(3, "Title is required"),
  content: z.string().min(3, "Content is required"),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  targetRoles: z
    .array(z.enum(["teacher", "student", "parent", "staff"]))
    .default([]),
  isPinned: z.boolean().default(false),
});
export type AnnouncementInput = z.input<typeof announcementSchema>;

export async function createAnnouncement(
  input: AnnouncementInput
): Promise<{ error?: string; success?: string }> {
  const user = await requireRole(["super_admin", "admin", "teacher"]);
  const institutionId = institutionScope(user);
  const parsed = announcementSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  await prisma.announcement.create({
    data: {
      institutionId,
      title: parsed.data.title,
      content: parsed.data.content,
      priority: parsed.data.priority,
      targetRoles: parsed.data.targetRoles,
      isPinned: parsed.data.isPinned,
      authorId: user.id,
    },
  });
  revalidatePath("/admin/communication");
  return { success: "Announcement published" };
}

const messageSchema = z.object({
  recipientId: z.string().uuid(),
  subject: z.string().optional(),
  content: z.string().min(1, "Message can't be empty"),
  parentMessageId: z.string().uuid().optional(),
});
export type MessageInput = z.infer<typeof messageSchema>;

export async function sendMessage(
  input: MessageInput
): Promise<{ error?: string; success?: string }> {
  const user = await requireUser();
  const institutionId = institutionScope(user);
  const parsed = messageSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const recipient = await prisma.user.findFirst({
    where: { id: parsed.data.recipientId, institutionId, isActive: true },
  });
  if (!recipient) return { error: "Recipient not found" };

  await prisma.$transaction([
    prisma.message.create({
      data: {
        institutionId,
        senderId: user.id,
        recipientId: recipient.id,
        subject: parsed.data.subject || null,
        content: parsed.data.content,
        parentMessageId: parsed.data.parentMessageId ?? null,
      },
    }),
    prisma.notification.create({
      data: {
        userId: recipient.id,
        title: `New message from ${user.firstName} ${user.lastName}`,
        message: parsed.data.content.slice(0, 120),
        type: "general",
      },
    }),
  ]);

  revalidatePath("/teacher/communication");
  revalidatePath("/parent/communication");
  return { success: "Message sent" };
}

export async function markThreadRead(otherUserId: string): Promise<void> {
  const user = await requireUser();
  await prisma.message.updateMany({
    where: { senderId: otherUserId, recipientId: user.id, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
}
