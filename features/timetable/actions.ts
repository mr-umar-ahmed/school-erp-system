"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole, institutionScope } from "@/lib/auth/dal";

const slotSchema = z
  .object({
    sectionId: z.string().uuid(),
    subjectId: z.string().uuid(),
    teacherId: z.string().uuid(),
    dayOfWeek: z.coerce.number().int().min(0).max(6),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
    roomNumber: z.string().optional(),
  })
  .refine((d) => d.startTime < d.endTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  });
export type SlotInput = z.infer<typeof slotSchema>;

const overlaps = (aStart: string, aEnd: string, bStart: string, bEnd: string) =>
  aStart < bEnd && bStart < aEnd;

export async function createTimetableSlot(
  input: SlotInput
): Promise<{ error?: string; success?: string }> {
  const user = await requireRole(["super_admin", "admin"]);
  const institutionId = institutionScope(user);
  const parsed = slotSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid slot" };
  }
  const data = parsed.data;

  const section = await prisma.section.findFirst({
    where: { id: data.sectionId, schoolClass: { institutionId } },
  });
  if (!section) return { error: "Section not found" };

  // Conflict detection: same section, same teacher, or same room at an
  // overlapping time on the same day.
  const sameDay = await prisma.timetableSlot.findMany({
    where: { institutionId, dayOfWeek: data.dayOfWeek },
    include: {
      section: { include: { schoolClass: true } },
      teacher: { select: { firstName: true, lastName: true } },
    },
  });
  const conflicts: string[] = [];
  for (const slot of sameDay) {
    if (!overlaps(data.startTime, data.endTime, slot.startTime, slot.endTime))
      continue;
    if (slot.sectionId === data.sectionId) {
      conflicts.push(
        `Section already has a class ${slot.startTime}–${slot.endTime}`
      );
    }
    if (slot.teacherId === data.teacherId) {
      conflicts.push(
        `${slot.teacher.firstName} ${slot.teacher.lastName} is teaching ${slot.section.schoolClass.name}-${slot.section.name} at ${slot.startTime}`
      );
    }
    if (
      data.roomNumber &&
      slot.roomNumber &&
      slot.roomNumber === data.roomNumber
    ) {
      conflicts.push(`Room ${slot.roomNumber} is occupied at ${slot.startTime}`);
    }
  }
  if (conflicts.length) {
    return { error: `Conflict: ${[...new Set(conflicts)][0]}` };
  }

  await prisma.timetableSlot.create({
    data: {
      institutionId,
      sectionId: data.sectionId,
      subjectId: data.subjectId,
      teacherId: data.teacherId,
      dayOfWeek: data.dayOfWeek,
      startTime: data.startTime,
      endTime: data.endTime,
      roomNumber: data.roomNumber || null,
      academicYearId: section.academicYearId,
    },
  });

  revalidatePath("/admin/timetable");
  return { success: "Period added to the timetable" };
}

export async function deleteTimetableSlot(
  slotId: string
): Promise<{ error?: string; success?: string }> {
  const user = await requireRole(["super_admin", "admin"]);
  const institutionId = institutionScope(user);
  const slot = await prisma.timetableSlot.findFirst({
    where: { id: slotId, institutionId },
  });
  if (!slot) return { error: "Slot not found" };
  await prisma.timetableSlot.delete({ where: { id: slotId } });
  revalidatePath("/admin/timetable");
  return { success: "Period removed" };
}
