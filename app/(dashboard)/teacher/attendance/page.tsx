import type { Metadata } from "next";
import { format } from "date-fns";
import { requireRole } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { SectionDatePicker } from "@/components/forms/section-date-picker";
import { AttendanceForm } from "@/components/forms/attendance-form";
import { GlassmorphicCard } from "@/components/shared/glassmorphic-card";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = { title: "Take Attendance" };

export default async function TeacherAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string; date?: string }>;
}) {
  const user = await requireRole(["teacher"]);
  const params = await searchParams;
  const date = params.date ?? format(new Date(), "yyyy-MM-dd");
  const day = new Date(`${date}T00:00:00.000Z`);

  // Sections this teacher teaches (via timetable) or class-teaches.
  const [taughtSlots, classTeacherOf] = await Promise.all([
    prisma.timetableSlot.findMany({
      where: { teacherId: user.id },
      select: {
        section: { include: { schoolClass: true } },
      },
      distinct: ["sectionId"],
    }),
    prisma.section.findMany({
      where: { classTeacherId: user.id },
      include: { schoolClass: true },
    }),
  ]);
  const sectionMap = new Map<string, { id: string; label: string }>();
  for (const s of [...taughtSlots.map((t) => t.section), ...classTeacherOf]) {
    sectionMap.set(s.id, {
      id: s.id,
      label: `${s.schoolClass.name} — ${s.name}`,
    });
  }
  const sections = [...sectionMap.values()].sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { numeric: true })
  );

  const sectionId =
    params.section && sectionMap.has(params.section)
      ? params.section
      : sections[0]?.id;

  const roster = sectionId
    ? await prisma.student.findMany({
        where: { sectionId, user: { isActive: true } },
        include: {
          user: {
            include: { attendanceRecords: { where: { date: day }, take: 1 } },
          },
        },
        orderBy: { rollNumber: "asc" },
      })
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Take Attendance</h1>
        <p className="text-sm text-muted-foreground">
          {format(day, "EEEE, d MMMM yyyy")}
        </p>
      </div>

      <GlassmorphicCard>
        <div className="mb-4">
          <SectionDatePicker
            sections={sections}
            selectedSection={sectionId}
            date={date}
          />
        </div>
        {!sectionId ? (
          <EmptyState
            title="No sections assigned"
            description="You aren't assigned to any class yet."
          />
        ) : (
          <AttendanceForm
            sectionId={sectionId}
            date={date}
            roster={roster.map((s) => ({
              userId: s.userId,
              firstName: s.user.firstName,
              lastName: s.user.lastName,
              rollNumber: s.rollNumber,
              status: s.user.attendanceRecords[0]?.status ?? null,
            }))}
          />
        )}
      </GlassmorphicCard>
    </div>
  );
}
