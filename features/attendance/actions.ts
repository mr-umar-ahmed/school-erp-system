"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole, institutionScope } from "@/lib/auth/dal";

const markSchema = z.object({
  sectionId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  entries: z
    .array(
      z.object({
        userId: z.string().uuid(),
        status: z.enum(["present", "absent", "late", "half_day", "excused"]),
      })
    )
    .min(1),
});
export type MarkAttendanceInput = z.infer<typeof markSchema>;

export async function markSectionAttendance(
  input: MarkAttendanceInput
): Promise<{ error?: string; success?: string }> {
  const user = await requireRole(["super_admin", "admin", "staff", "teacher"]);
  const institutionId = institutionScope(user);
  const parsed = markSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid attendance data" };
  const { sectionId, date, entries } = parsed.data;

  const section = await prisma.section.findFirst({
    where: { id: sectionId, schoolClass: { institutionId } },
    include: { students: { select: { userId: true } } },
  });
  if (!section) return { error: "Section not found" };

  // Teachers may only mark sections they teach or class-teacher.
  if (user.role === "teacher") {
    const teaches = await prisma.timetableSlot.findFirst({
      where: { sectionId, teacherId: user.id },
    });
    if (!teaches && section.classTeacherId !== user.id) {
      return { error: "You don't teach this section" };
    }
  }

  const validUserIds = new Set(section.students.map((s) => s.userId));
  const day = new Date(`${date}T00:00:00.000Z`);

  const ops = entries
    .filter((e) => validUserIds.has(e.userId))
    .map((e) =>
      prisma.attendance.upsert({
        where: { userId_date: { userId: e.userId, date: day } },
        create: {
          institutionId,
          userId: e.userId,
          date: day,
          status: e.status,
          markedById: user.id,
          academicYearId: section.academicYearId,
        },
        update: { status: e.status, markedById: user.id },
      })
    );
  await prisma.$transaction(ops);

  revalidatePath("/admin/attendance");
  revalidatePath("/teacher/attendance");
  return { success: `Attendance saved for ${ops.length} students` };
}
