import type { Metadata } from "next";
import { format } from "date-fns";
import { requireRole, institutionScope } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { getSectionOptions } from "@/features/academics/queries";
import { SectionDatePicker } from "@/components/forms/section-date-picker";
import { AttendanceForm } from "@/components/forms/attendance-form";
import { StatCard } from "@/components/shared/stat-card";
import { GlassmorphicCard } from "@/components/shared/glassmorphic-card";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = { title: "Attendance" };

export default async function AdminAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string; date?: string }>;
}) {
  const user = await requireRole(["super_admin", "admin", "staff"]);
  const institutionId = institutionScope(user);
  const params = await searchParams;
  const date = params.date ?? format(new Date(), "yyyy-MM-dd");
  const day = new Date(`${date}T00:00:00.000Z`);

  const sections = await getSectionOptions(institutionId);
  const sectionId =
    params.section && sections.some((s) => s.id === params.section)
      ? params.section
      : undefined;

  const [present, absent, late, roster] = await Promise.all([
    prisma.attendance.count({
      where: { institutionId, date: day, status: "present", user: { role: "student" } },
    }),
    prisma.attendance.count({
      where: { institutionId, date: day, status: "absent", user: { role: "student" } },
    }),
    prisma.attendance.count({
      where: { institutionId, date: day, status: "late", user: { role: "student" } },
    }),
    sectionId
      ? prisma.student.findMany({
          where: { sectionId, user: { isActive: true } },
          include: {
            user: {
              include: {
                attendanceRecords: { where: { date: day }, take: 1 },
              },
            },
          },
          orderBy: { rollNumber: "asc" },
        })
      : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Attendance</h1>
        <p className="text-sm text-muted-foreground">
          {format(day, "EEEE, d MMMM yyyy")}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon="ClipboardCheck" label="Present" value={present} />
        <StatCard icon="UserRound" label="Absent" value={absent} />
        <StatCard icon="CalendarClock" label="Late" value={late} />
      </div>

      <GlassmorphicCard>
        <h2 className="mb-3 text-lg">Mark Attendance</h2>
        <div className="mb-4">
          <SectionDatePicker
            sections={sections.map((s) => ({ id: s.id, label: s.label }))}
            selectedSection={sectionId}
            date={date}
          />
        </div>
        {!sectionId ? (
          <EmptyState
            title="Pick a class & section"
            description="Choose a section above to mark or review attendance."
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
