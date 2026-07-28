import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { buildTemplate, spreadsheetHeaders } from "@/lib/spreadsheet";
import {
  MARKS_IMPORT_COLUMNS,
  STUDENT_IMPORT_COLUMNS,
  TEACHER_IMPORT_COLUMNS,
} from "@/lib/validations/import";
import type { UserRole } from "@/lib/generated/prisma/enums";

const ADMIN_ROLES: UserRole[] = ["super_admin", "admin", "staff"];

/**
 * Downloadable import templates. The marks template is pre-filled with the
 * class roster so teachers only type in the Marks column.
 */
export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ kind: string }> }
) {
  const user = await getCurrentUser();
  if (!user || !user.institutionId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const { kind } = await ctx.params;

  if (kind === "students") {
    if (!ADMIN_ROLES.includes(user.role)) {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }
    const buffer = await buildTemplate("Students", STUDENT_IMPORT_COLUMNS);
    return new NextResponse(new Uint8Array(buffer), {
      headers: spreadsheetHeaders("edunexus-students-template.xlsx"),
    });
  }

  if (kind === "teachers") {
    if (user.role !== "super_admin" && user.role !== "admin") {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }
    const buffer = await buildTemplate("Teachers", TEACHER_IMPORT_COLUMNS);
    return new NextResponse(new Uint8Array(buffer), {
      headers: spreadsheetHeaders("edunexus-teachers-template.xlsx"),
    });
  }

  if (kind === "marks") {
    if (user.role !== "teacher" && !ADMIN_ROLES.includes(user.role)) {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }
    const scheduleId = request.nextUrl.searchParams.get("schedule");
    if (!scheduleId) {
      return NextResponse.json(
        { error: "Missing exam schedule" },
        { status: 400 }
      );
    }
    const schedule = await prisma.examSchedule.findFirst({
      where: {
        id: scheduleId,
        examination: { institutionId: user.institutionId },
      },
      include: { examination: true, schoolClass: true, subject: true },
    });
    if (!schedule) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (user.role === "teacher") {
      const teaches = await prisma.classSubject.findFirst({
        where: {
          classId: schedule.classId,
          subjectId: schedule.subjectId,
          teacherId: user.id,
        },
      });
      if (!teaches) {
        return NextResponse.json({ error: "Not allowed" }, { status: 403 });
      }
    }

    const roster = await prisma.student.findMany({
      where: {
        section: { classId: schedule.classId },
        user: { isActive: true },
      },
      include: {
        user: { select: { firstName: true, lastName: true } },
        examResults: { where: { examScheduleId: schedule.id }, take: 1 },
      },
      orderBy: [{ section: { name: "asc" } }, { rollNumber: "asc" }],
    });

    const rows = roster.map((s) => {
      const result = s.examResults[0];
      return [
        s.admissionNo,
        `${s.user.firstName} ${s.user.lastName}`,
        result?.marksObtained === null || result?.marksObtained === undefined
          ? ""
          : String(Number(result.marksObtained)),
        result?.isAbsent ? "yes" : "no",
      ];
    });

    const buffer = await buildTemplate(
      `Marks (out of ${Number(schedule.totalMarks)})`.slice(0, 31),
      MARKS_IMPORT_COLUMNS,
      rows
    );
    const safeName =
      `${schedule.schoolClass.name}-${schedule.subject.name}-marks`
        .replace(/[^a-z0-9-]+/gi, "-")
        .toLowerCase();
    return new NextResponse(new Uint8Array(buffer), {
      headers: spreadsheetHeaders(`${safeName}.xlsx`),
    });
  }

  return NextResponse.json({ error: "Unknown template" }, { status: 404 });
}
