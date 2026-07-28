"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole, institutionScope } from "@/lib/auth/dal";
import { verifyOwnAttachments } from "@/lib/attachments";
import { MAX_ATTACHMENTS } from "@/lib/uploads";

const assignmentSchema = z.object({
  title: z.string().min(3, "Title is required"),
  description: z.string().optional(),
  classSubjectId: z.string().uuid("Choose a class & subject"),
  sectionId: z.string().uuid().optional(),
  dueDate: z.string().min(1, "Due date is required"),
  maxMarks: z.number().positive().optional(),
  attachmentUrls: z.array(z.string()).max(MAX_ATTACHMENTS).default([]),
});
export type AssignmentInput = z.infer<typeof assignmentSchema>;

export async function createAssignment(
  input: AssignmentInput
): Promise<{ error?: string; success?: string }> {
  const user = await requireRole(["teacher", "admin", "super_admin"]);
  const institutionId = institutionScope(user);
  const parsed = assignmentSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const cs = await prisma.classSubject.findFirst({
    where: {
      id: parsed.data.classSubjectId,
      schoolClass: { institutionId },
      ...(user.role === "teacher" ? { teacherId: user.id } : {}),
    },
  });
  if (!cs) return { error: "You don't teach that class & subject" };

  const attachments = await verifyOwnAttachments(
    user,
    parsed.data.attachmentUrls
  );
  if ("error" in attachments) return { error: attachments.error };

  await prisma.assignment.create({
    data: {
      institutionId,
      title: parsed.data.title,
      description: parsed.data.description || null,
      subjectId: cs.subjectId,
      classId: cs.classId,
      sectionId: parsed.data.sectionId ?? null,
      teacherId: user.id,
      dueDate: new Date(parsed.data.dueDate),
      maxMarks: parsed.data.maxMarks ?? null,
      attachmentUrls: attachments.urls,
    },
  });
  revalidatePath("/teacher/assignments");
  return { success: "Assignment created" };
}

const submitSchema = z.object({
  assignmentId: z.string().uuid(),
  content: z.string().optional(),
  attachmentUrls: z.array(z.string()).max(MAX_ATTACHMENTS).default([]),
});
export type SubmitInput = z.infer<typeof submitSchema>;

export async function submitAssignment(
  input: SubmitInput
): Promise<{ error?: string; success?: string }> {
  const user = await requireRole(["student"]);
  if (!user.student) return { error: "Student profile missing" };
  const parsed = submitSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const content = parsed.data.content?.trim() ?? "";
  if (!content && parsed.data.attachmentUrls.length === 0) {
    return { error: "Write something or attach a file before submitting" };
  }
  const attachments = await verifyOwnAttachments(
    user,
    parsed.data.attachmentUrls
  );
  if ("error" in attachments) return { error: attachments.error };

  const student = await prisma.student.findUnique({
    where: { id: user.student.id },
    select: { sectionId: true, section: { select: { classId: true } } },
  });
  const assignment = await prisma.assignment.findFirst({
    where: {
      id: parsed.data.assignmentId,
      classId: student?.section?.classId,
      OR: [{ sectionId: null }, { sectionId: student?.sectionId }],
    },
  });
  if (!assignment) return { error: "Assignment not found for your class" };

  await prisma.assignmentSubmission.upsert({
    where: {
      assignmentId_studentId: {
        assignmentId: assignment.id,
        studentId: user.student.id,
      },
    },
    create: {
      assignmentId: assignment.id,
      studentId: user.student.id,
      content: content || null,
      attachmentUrls: attachments.urls,
    },
    update: {
      content: content || null,
      attachmentUrls: attachments.urls,
      submittedAt: new Date(),
    },
  });
  revalidatePath("/student/assignments");
  return { success: "Assignment submitted" };
}

const gradeSchema = z.object({
  submissionId: z.string().uuid(),
  marks: z.number().min(0),
  feedback: z.string().optional(),
});
export type GradeInput = z.infer<typeof gradeSchema>;

export async function gradeSubmission(
  input: GradeInput
): Promise<{ error?: string; success?: string }> {
  const user = await requireRole(["teacher", "admin", "super_admin"]);
  const parsed = gradeSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const submission = await prisma.assignmentSubmission.findFirst({
    where: {
      id: parsed.data.submissionId,
      ...(user.role === "teacher"
        ? { assignment: { teacherId: user.id } }
        : {}),
    },
    include: { assignment: true },
  });
  if (!submission) return { error: "Submission not found" };
  if (
    submission.assignment.maxMarks &&
    parsed.data.marks > Number(submission.assignment.maxMarks)
  ) {
    return {
      error: `Marks can't exceed ${Number(submission.assignment.maxMarks)}`,
    };
  }

  await prisma.assignmentSubmission.update({
    where: { id: submission.id },
    data: {
      marksObtained: parsed.data.marks,
      feedback: parsed.data.feedback || null,
      gradedAt: new Date(),
    },
  });
  revalidatePath("/teacher/assignments");
  return { success: "Submission graded" };
}
