"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole, institutionScope } from "@/lib/auth/dal";
import { hashPassword } from "@/lib/auth/password";
import {
  studentFormSchema,
  type StudentFormInput,
} from "@/lib/validations/student";

export interface ActionResult {
  error?: string;
  success?: string;
}

async function nextAdmissionNo(institutionCode: string): Promise<string> {
  const last = await prisma.student.findFirst({
    orderBy: { admissionNo: "desc" },
    select: { admissionNo: true },
  });
  const lastNum = last ? Number(last.admissionNo.split("-").pop()) : 0;
  return `${institutionCode}-${String(lastNum + 1).padStart(4, "0")}`;
}

export async function createStudent(
  input: StudentFormInput
): Promise<ActionResult> {
  const user = await requireRole(["super_admin", "admin", "staff"]);
  const institutionId = institutionScope(user);
  const parsed = studentFormSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  const existing = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() },
  });
  if (existing) return { error: "A user with this email already exists" };

  // Verify the target section belongs to this institution.
  const section = await prisma.section.findFirst({
    where: { id: data.sectionId, schoolClass: { institutionId } },
  });
  if (!section) return { error: "Invalid class/section" };

  const admissionNo = await nextAdmissionNo(user.institution?.code ?? "STU");
  // New students sign in with a default password (they can reset it later).
  const passwordHash = await hashPassword("Student@123");

  const created = await prisma.user.create({
    data: {
      institutionId,
      role: "student",
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email.toLowerCase(),
      passwordHash,
      phone: data.phone || null,
      gender: data.gender,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      address: data.address || null,
      onboardingCompleted: true,
      student: {
        create: {
          admissionNo,
          admissionDate: new Date(),
          sectionId: data.sectionId,
          academicYearId: section.academicYearId,
          rollNumber: data.rollNumber ?? null,
          bloodGroup: data.bloodGroup || null,
          emergencyContactName: data.emergencyContactName || null,
          emergencyContactPhone: data.emergencyContactPhone || null,
          medicalNotes: data.medicalNotes || null,
        },
      },
    },
    include: { student: true },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "student.create",
      tableName: "students",
      recordId: created.student!.id,
      newValues: { admissionNo, email: created.email },
    },
  });

  revalidatePath("/admin/students");
  redirect(`/admin/students/${created.student!.id}`);
}

export async function updateStudent(
  studentId: string,
  input: StudentFormInput
): Promise<ActionResult> {
  const user = await requireRole(["super_admin", "admin", "staff"]);
  const institutionId = institutionScope(user);
  const parsed = studentFormSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  const student = await prisma.student.findFirst({
    where: { id: studentId, user: { institutionId } },
  });
  if (!student) return { error: "Student not found" };

  await prisma.$transaction([
    prisma.user.update({
      where: { id: student.userId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || null,
        gender: data.gender,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        address: data.address || null,
      },
    }),
    prisma.student.update({
      where: { id: studentId },
      data: {
        sectionId: data.sectionId,
        rollNumber: data.rollNumber ?? null,
        bloodGroup: data.bloodGroup || null,
        emergencyContactName: data.emergencyContactName || null,
        emergencyContactPhone: data.emergencyContactPhone || null,
        medicalNotes: data.medicalNotes || null,
      },
    }),
    prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "student.update",
        tableName: "students",
        recordId: studentId,
      },
    }),
  ]);

  revalidatePath("/admin/students");
  revalidatePath(`/admin/students/${studentId}`);
  return { success: "Student updated" };
}

export async function deactivateStudent(
  studentId: string
): Promise<ActionResult> {
  const user = await requireRole(["super_admin", "admin"]);
  const institutionId = institutionScope(user);
  const student = await prisma.student.findFirst({
    where: { id: studentId, user: { institutionId } },
  });
  if (!student) return { error: "Student not found" };

  await prisma.$transaction([
    prisma.user.update({
      where: { id: student.userId },
      data: { isActive: false },
    }),
    prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "student.deactivate",
        tableName: "students",
        recordId: studentId,
      },
    }),
  ]);
  revalidatePath("/admin/students");
  return { success: "Student deactivated" };
}
