"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole, institutionScope } from "@/lib/auth/dal";

const examSchema = z.object({
  name: z.string().min(2, "Name is required"),
  type: z.enum(["unit_test", "midterm", "final", "practical", "assignment"]),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
export type ExamInput = z.infer<typeof examSchema>;

export async function createExamination(
  input: ExamInput
): Promise<{ error?: string; success?: string }> {
  const user = await requireRole(["super_admin", "admin"]);
  const institutionId = institutionScope(user);
  const parsed = examSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const year = await prisma.academicYear.findFirst({
    where: { institutionId, isCurrent: true },
  });
  await prisma.examination.create({
    data: {
      institutionId,
      name: parsed.data.name,
      type: parsed.data.type,
      academicYearId: year?.id,
      startDate: new Date(parsed.data.startDate),
      endDate: new Date(parsed.data.endDate),
    },
  });
  revalidatePath("/admin/examinations");
  return { success: "Examination created" };
}

const scheduleSchema = z.object({
  examinationId: z.string().uuid(),
  classId: z.string().uuid(),
  subjectId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  totalMarks: z.coerce.number().positive(),
  passingMarks: z.coerce.number().positive(),
  roomNumber: z.string().optional(),
});
export type ScheduleInput = z.infer<typeof scheduleSchema>;

export async function createExamSchedule(
  input: ScheduleInput
): Promise<{ error?: string; success?: string }> {
  const user = await requireRole(["super_admin", "admin"]);
  const institutionId = institutionScope(user);
  const parsed = scheduleSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const exam = await prisma.examination.findFirst({
    where: { id: parsed.data.examinationId, institutionId },
  });
  if (!exam) return { error: "Examination not found" };
  if (parsed.data.passingMarks > parsed.data.totalMarks) {
    return { error: "Passing marks can't exceed total marks" };
  }
  try {
    await prisma.examSchedule.create({
      data: {
        examinationId: parsed.data.examinationId,
        classId: parsed.data.classId,
        subjectId: parsed.data.subjectId,
        date: new Date(parsed.data.date),
        startTime: parsed.data.startTime || null,
        endTime: parsed.data.endTime || null,
        totalMarks: parsed.data.totalMarks,
        passingMarks: parsed.data.passingMarks,
        roomNumber: parsed.data.roomNumber || null,
      },
    });
  } catch {
    return { error: "This class already has a schedule for this subject" };
  }
  revalidatePath(`/admin/examinations/${parsed.data.examinationId}`);
  return { success: "Exam scheduled" };
}

const marksSchema = z.object({
  examScheduleId: z.string().uuid(),
  entries: z
    .array(
      z.object({
        studentId: z.string().uuid(),
        marks: z.number().min(0).nullable(),
        isAbsent: z.boolean(),
      })
    )
    .min(1),
});
export type MarksInput = z.infer<typeof marksSchema>;

export async function saveMarks(
  input: MarksInput
): Promise<{ error?: string; success?: string }> {
  const user = await requireRole([
    "super_admin",
    "admin",
    "teacher",
  ]);
  const institutionId = institutionScope(user);
  const parsed = marksSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid marks data" };

  const schedule = await prisma.examSchedule.findFirst({
    where: {
      id: parsed.data.examScheduleId,
      examination: { institutionId },
    },
    include: { examination: true },
  });
  if (!schedule) return { error: "Exam schedule not found" };

  // Teachers may only enter marks for subjects they teach in that class.
  if (user.role === "teacher") {
    const teaches = await prisma.classSubject.findFirst({
      where: {
        classId: schedule.classId,
        subjectId: schedule.subjectId,
        teacherId: user.id,
      },
    });
    if (!teaches) return { error: "You don't teach this subject here" };
  }

  const total = Number(schedule.totalMarks);
  const scales = await prisma.gradeScale.findMany({
    where: { institutionId },
    orderBy: { sortOrder: "asc" },
  });
  const gradeFor = (marks: number): string | null => {
    const pct = (marks / total) * 100;
    const hit = scales.find(
      (s) => pct >= Number(s.minPercent) && pct <= Number(s.maxPercent)
    );
    return hit?.grade ?? null;
  };

  const invalid = parsed.data.entries.find(
    (e) => !e.isAbsent && e.marks !== null && e.marks > total
  );
  if (invalid) return { error: `Marks can't exceed ${total}` };

  await prisma.$transaction(
    parsed.data.entries.map((e) =>
      prisma.examResult.upsert({
        where: {
          examScheduleId_studentId: {
            examScheduleId: schedule.id,
            studentId: e.studentId,
          },
        },
        create: {
          examScheduleId: schedule.id,
          studentId: e.studentId,
          marksObtained: e.isAbsent ? null : e.marks,
          grade: e.isAbsent || e.marks === null ? null : gradeFor(e.marks),
          isAbsent: e.isAbsent,
        },
        update: {
          marksObtained: e.isAbsent ? null : e.marks,
          grade: e.isAbsent || e.marks === null ? null : gradeFor(e.marks),
          isAbsent: e.isAbsent,
        },
      })
    )
  );

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "exam.marks_saved",
      tableName: "exam_results",
      recordId: schedule.id,
      newValues: { count: parsed.data.entries.length },
    },
  });

  revalidatePath(`/admin/examinations/${schedule.examinationId}`);
  revalidatePath("/teacher/gradebook");
  return { success: "Marks saved" };
}

export async function togglePublishExam(
  examinationId: string
): Promise<{ error?: string; success?: string }> {
  const user = await requireRole(["super_admin", "admin"]);
  const institutionId = institutionScope(user);
  const exam = await prisma.examination.findFirst({
    where: { id: examinationId, institutionId },
  });
  if (!exam) return { error: "Examination not found" };
  await prisma.examination.update({
    where: { id: examinationId },
    data: { isPublished: !exam.isPublished },
  });
  revalidatePath("/admin/examinations");
  revalidatePath(`/admin/examinations/${examinationId}`);
  return {
    success: exam.isPublished
      ? "Results unpublished"
      : "Results published — students and parents can now view them",
  };
}
