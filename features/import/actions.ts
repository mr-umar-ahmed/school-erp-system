"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireRole, institutionScope } from "@/lib/auth/dal";
import { parseSheet, type SheetRow } from "@/lib/spreadsheet";
import {
  STUDENT_IMPORT_COLUMNS,
  TEACHER_IMPORT_COLUMNS,
  MARKS_IMPORT_COLUMNS,
  studentImportRowSchema,
  teacherImportRowSchema,
  type ImportColumn,
  type ImportRowError,
  type ImportSummary,
} from "@/lib/validations/import";

export type ImportResult = { error: string } | { summary: ImportSummary };

/** Sheet row 1 is the header, so data row i (0-based) is spreadsheet row i+2. */
const sheetRowNumber = (index: number) => index + 2;

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

async function loadRows(
  formData: FormData,
  columns: ImportColumn[]
): Promise<{ rows: SheetRow[]; unknownHeaders: string[] } | { error: string }> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a .xlsx or .csv file to import" };
  }
  if (!/\.(xlsx|csv)$/i.test(file.name)) {
    return { error: "Only .xlsx and .csv files can be imported" };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { error: "That file is over 5 MB — split it into smaller batches" };
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  return parseSheet(buffer, columns, file.name);
}

// ---------- Students ----------

export async function importStudents(
  formData: FormData
): Promise<ImportResult> {
  const user = await requireRole(["super_admin", "admin", "staff"]);
  const institutionId = institutionScope(user);

  const parsed = await loadRows(formData, STUDENT_IMPORT_COLUMNS);
  if ("error" in parsed) return { error: parsed.error };

  // Sections keyed by "class|section", both lowercased for forgiving matching.
  const sections = await prisma.section.findMany({
    where: { schoolClass: { institutionId } },
    include: { schoolClass: true },
  });
  const sectionByName = new Map(
    sections.map((s) => [
      `${s.schoolClass.name.toLowerCase()}|${s.name.toLowerCase()}`,
      s,
    ])
  );

  const errors: ImportRowError[] = [];
  const valid: {
    index: number;
    data: ReturnType<typeof studentImportRowSchema.parse>;
    sectionId: string;
    academicYearId: string | null;
  }[] = [];
  const seenEmails = new Set<string>();

  for (const [index, raw] of parsed.rows.entries()) {
    const result = studentImportRowSchema.safeParse(raw);
    const identifier =
      `${raw.firstName ?? ""} ${raw.lastName ?? ""}`.trim() ||
      raw.email ||
      "(blank)";
    if (!result.success) {
      errors.push({
        row: sheetRowNumber(index),
        identifier,
        message: result.error.issues[0]?.message ?? "Invalid row",
      });
      continue;
    }
    const data = result.data;
    if (seenEmails.has(data.email)) {
      errors.push({
        row: sheetRowNumber(index),
        identifier,
        message: `Duplicate email within the file: ${data.email}`,
      });
      continue;
    }
    const section = sectionByName.get(
      `${data.className.toLowerCase()}|${data.sectionName.toLowerCase()}`
    );
    if (!section) {
      errors.push({
        row: sheetRowNumber(index),
        identifier,
        message: `No section "${data.sectionName}" in "${data.className}"`,
      });
      continue;
    }
    seenEmails.add(data.email);
    valid.push({
      index,
      data,
      sectionId: section.id,
      academicYearId: section.academicYearId,
    });
  }

  // Reject emails already registered (checked in one query, not per row).
  const existing = await prisma.user.findMany({
    where: { email: { in: [...seenEmails] } },
    select: { email: true },
  });
  const taken = new Set(existing.map((u) => u.email));
  const toCreate = valid.filter((v) => {
    if (!taken.has(v.data.email)) return true;
    errors.push({
      row: sheetRowNumber(v.index),
      identifier: `${v.data.firstName} ${v.data.lastName}`,
      message: `An account already exists for ${v.data.email}`,
    });
    return false;
  });

  if (toCreate.length === 0) {
    return {
      summary: {
        imported: 0,
        skipped: errors.length,
        errors,
        unknownHeaders: parsed.unknownHeaders,
      },
    };
  }

  // Every imported student gets the same default password, so the (slow)
  // bcrypt hash is computed once for the whole batch instead of per row.
  const passwordHash = await bcrypt.hash("Student@123", 10);

  const last = await prisma.student.findFirst({
    orderBy: { admissionNo: "desc" },
    select: { admissionNo: true },
  });
  const prefix = user.institution?.code ?? "STU";
  let counter = last ? Number(last.admissionNo.split("-").pop()) || 0 : 0;

  let imported = 0;
  for (const item of toCreate) {
    counter += 1;
    const admissionNo = `${prefix}-${String(counter).padStart(4, "0")}`;
    try {
      await prisma.user.create({
        data: {
          institutionId,
          role: "student",
          firstName: item.data.firstName,
          lastName: item.data.lastName,
          email: item.data.email,
          passwordHash,
          phone: item.data.phone ?? null,
          gender: item.data.gender ?? null,
          dateOfBirth: item.data.dateOfBirth
            ? new Date(item.data.dateOfBirth)
            : null,
          address: item.data.address ?? null,
          onboardingCompleted: true,
          student: {
            create: {
              admissionNo,
              admissionDate: new Date(),
              sectionId: item.sectionId,
              academicYearId: item.academicYearId,
              rollNumber: item.data.rollNumber
                ? Number(item.data.rollNumber)
                : null,
              bloodGroup: item.data.bloodGroup ?? null,
              emergencyContactName: item.data.guardianName ?? null,
              emergencyContactPhone: item.data.guardianPhone ?? null,
            },
          },
        },
      });
      imported += 1;
    } catch {
      counter -= 1;
      errors.push({
        row: sheetRowNumber(item.index),
        identifier: `${item.data.firstName} ${item.data.lastName}`,
        message: "Could not be saved — check for duplicate values",
      });
    }
  }

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "student.bulk_import",
      tableName: "students",
      newValues: { imported, skipped: errors.length },
    },
  });

  revalidatePath("/admin/students");
  return {
    summary: {
      imported,
      skipped: errors.length,
      errors,
      unknownHeaders: parsed.unknownHeaders,
    },
  };
}

// ---------- Teachers ----------

export async function importTeachers(
  formData: FormData
): Promise<ImportResult> {
  const user = await requireRole(["super_admin", "admin"]);
  const institutionId = institutionScope(user);

  const parsed = await loadRows(formData, TEACHER_IMPORT_COLUMNS);
  if ("error" in parsed) return { error: parsed.error };

  const errors: ImportRowError[] = [];
  const valid: {
    index: number;
    data: ReturnType<typeof teacherImportRowSchema.parse>;
  }[] = [];
  const seenEmails = new Set<string>();
  const seenEmployeeIds = new Set<string>();

  for (const [index, raw] of parsed.rows.entries()) {
    const result = teacherImportRowSchema.safeParse(raw);
    const identifier =
      `${raw.firstName ?? ""} ${raw.lastName ?? ""}`.trim() ||
      raw.email ||
      "(blank)";
    if (!result.success) {
      errors.push({
        row: sheetRowNumber(index),
        identifier,
        message: result.error.issues[0]?.message ?? "Invalid row",
      });
      continue;
    }
    const data = result.data;
    if (seenEmails.has(data.email)) {
      errors.push({
        row: sheetRowNumber(index),
        identifier,
        message: `Duplicate email within the file: ${data.email}`,
      });
      continue;
    }
    if (data.employeeId && seenEmployeeIds.has(data.employeeId)) {
      errors.push({
        row: sheetRowNumber(index),
        identifier,
        message: `Duplicate employee ID within the file: ${data.employeeId}`,
      });
      continue;
    }
    seenEmails.add(data.email);
    if (data.employeeId) seenEmployeeIds.add(data.employeeId);
    valid.push({ index, data });
  }

  const [existingUsers, existingTeachers] = await Promise.all([
    prisma.user.findMany({
      where: { email: { in: [...seenEmails] } },
      select: { email: true },
    }),
    prisma.teacher.findMany({
      where: { employeeId: { in: [...seenEmployeeIds] } },
      select: { employeeId: true },
    }),
  ]);
  const takenEmails = new Set(existingUsers.map((u) => u.email));
  const takenIds = new Set(existingTeachers.map((t) => t.employeeId));

  const toCreate = valid.filter((v) => {
    const name = `${v.data.firstName} ${v.data.lastName}`;
    if (takenEmails.has(v.data.email)) {
      errors.push({
        row: sheetRowNumber(v.index),
        identifier: name,
        message: `An account already exists for ${v.data.email}`,
      });
      return false;
    }
    if (v.data.employeeId && takenIds.has(v.data.employeeId)) {
      errors.push({
        row: sheetRowNumber(v.index),
        identifier: name,
        message: `Employee ID ${v.data.employeeId} is already in use`,
      });
      return false;
    }
    return true;
  });

  if (toCreate.length === 0) {
    return {
      summary: {
        imported: 0,
        skipped: errors.length,
        errors,
        unknownHeaders: parsed.unknownHeaders,
      },
    };
  }

  const passwordHash = await bcrypt.hash("Teacher@123", 10);

  // Auto-generated ids continue the institution's existing sequence.
  const prefix = `${user.institution?.code ?? "EMP"}T`;
  const lastGenerated = await prisma.teacher.findFirst({
    where: { employeeId: { startsWith: `${prefix}-` } },
    orderBy: { employeeId: "desc" },
    select: { employeeId: true },
  });
  let counter = lastGenerated
    ? Number(lastGenerated.employeeId.split("-").pop()) || 0
    : 0;

  let imported = 0;
  for (const item of toCreate) {
    let employeeId = item.data.employeeId;
    if (!employeeId) {
      counter += 1;
      employeeId = `${prefix}-${String(counter).padStart(3, "0")}`;
    }
    try {
      await prisma.user.create({
        data: {
          institutionId,
          role: "teacher",
          firstName: item.data.firstName,
          lastName: item.data.lastName,
          email: item.data.email,
          passwordHash,
          phone: item.data.phone ?? null,
          gender: item.data.gender ?? null,
          onboardingCompleted: true,
          teacher: {
            create: {
              employeeId,
              department: item.data.department ?? null,
              designation: item.data.designation ?? null,
              qualification: item.data.qualification ?? null,
              experienceYears: item.data.experienceYears
                ? Number(item.data.experienceYears)
                : null,
              joiningDate: item.data.joiningDate
                ? new Date(item.data.joiningDate)
                : null,
              salary: item.data.salary ? Number(item.data.salary) : null,
            },
          },
        },
      });
      imported += 1;
    } catch {
      errors.push({
        row: sheetRowNumber(item.index),
        identifier: `${item.data.firstName} ${item.data.lastName}`,
        message: "Could not be saved — check for duplicate values",
      });
    }
  }

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "teacher.bulk_import",
      tableName: "teachers",
      newValues: { imported, skipped: errors.length },
    },
  });

  revalidatePath("/admin/teachers");
  return {
    summary: {
      imported,
      skipped: errors.length,
      errors,
      unknownHeaders: parsed.unknownHeaders,
    },
  };
}

// ---------- Exam marks (teacher gradebook) ----------

export async function importMarks(formData: FormData): Promise<ImportResult> {
  const user = await requireRole(["super_admin", "admin", "teacher"]);
  const institutionId = institutionScope(user);

  const examScheduleId = formData.get("examScheduleId");
  if (typeof examScheduleId !== "string" || !examScheduleId) {
    return { error: "Pick an exam schedule first" };
  }

  const schedule = await prisma.examSchedule.findFirst({
    where: { id: examScheduleId, examination: { institutionId } },
  });
  if (!schedule) return { error: "Exam schedule not found" };

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

  const parsed = await loadRows(formData, MARKS_IMPORT_COLUMNS);
  if ("error" in parsed) return { error: parsed.error };

  const roster = await prisma.student.findMany({
    where: { section: { classId: schedule.classId }, user: { isActive: true } },
    select: { id: true, admissionNo: true },
  });
  const studentByAdmission = new Map(roster.map((s) => [s.admissionNo, s.id]));

  const total = Number(schedule.totalMarks);
  const scales = await prisma.gradeScale.findMany({
    where: { institutionId },
    orderBy: { sortOrder: "asc" },
  });
  const gradeFor = (marks: number): string | null => {
    const pct = (marks / total) * 100;
    return (
      scales.find(
        (s) => pct >= Number(s.minPercent) && pct <= Number(s.maxPercent)
      )?.grade ?? null
    );
  };

  const errors: ImportRowError[] = [];
  const entries: {
    studentId: string;
    marks: number | null;
    isAbsent: boolean;
  }[] = [];
  const seen = new Set<string>();

  for (const [index, raw] of parsed.rows.entries()) {
    const row = sheetRowNumber(index);
    const admissionNo = (raw.admissionNo ?? "").trim();
    const identifier = raw.studentName?.trim() || admissionNo || "(blank)";
    if (!admissionNo) {
      errors.push({ row, identifier, message: "Admission No is required" });
      continue;
    }
    const studentId = studentByAdmission.get(admissionNo);
    if (!studentId) {
      errors.push({
        row,
        identifier,
        message: `${admissionNo} is not a student in this class`,
      });
      continue;
    }
    if (seen.has(studentId)) {
      errors.push({ row, identifier, message: "Duplicate row for this student" });
      continue;
    }

    const absentRaw = (raw.absent ?? "").trim().toLowerCase();
    const isAbsent = ["yes", "y", "true", "1", "absent"].includes(absentRaw);
    const marksRaw = (raw.marks ?? "").trim();

    if (isAbsent) {
      seen.add(studentId);
      entries.push({ studentId, marks: null, isAbsent: true });
      continue;
    }
    if (!marksRaw) continue; // blank + not absent = leave the mark untouched
    if (!/^\d+(\.\d+)?$/.test(marksRaw)) {
      errors.push({ row, identifier, message: `"${marksRaw}" is not a number` });
      continue;
    }
    const marks = Number(marksRaw);
    if (marks > total) {
      errors.push({ row, identifier, message: `Marks can't exceed ${total}` });
      continue;
    }
    seen.add(studentId);
    entries.push({ studentId, marks, isAbsent: false });
  }

  if (entries.length === 0) {
    return {
      summary: {
        imported: 0,
        skipped: errors.length,
        errors,
        unknownHeaders: parsed.unknownHeaders,
      },
    };
  }

  await prisma.$transaction(
    entries.map((e) =>
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
          marksObtained: e.marks,
          grade: e.marks === null ? null : gradeFor(e.marks),
          isAbsent: e.isAbsent,
        },
        update: {
          marksObtained: e.marks,
          grade: e.marks === null ? null : gradeFor(e.marks),
          isAbsent: e.isAbsent,
        },
      })
    )
  );

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "exam.marks_imported",
      tableName: "exam_results",
      recordId: schedule.id,
      newValues: { imported: entries.length, skipped: errors.length },
    },
  });

  revalidatePath("/teacher/gradebook");
  revalidatePath(`/admin/examinations/${schedule.examinationId}`);
  return {
    summary: {
      imported: entries.length,
      skipped: errors.length,
      errors,
      unknownHeaders: parsed.unknownHeaders,
    },
  };
}
