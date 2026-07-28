import type { Metadata } from "next";
import { format } from "date-fns";
import { requireRole } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { AttendanceCalendar } from "@/components/shared/attendance-calendar";
import { ProgressRing } from "@/components/shared/progress-ring";
import { GlassmorphicCard } from "@/components/shared/glassmorphic-card";

export const metadata: Metadata = { title: "My Attendance" };

export default async function StudentAttendancePage() {
  const user = await requireRole(["student"]);

  const records = await prisma.attendance.findMany({
    where: { userId: user.id },
    orderBy: { date: "asc" },
    select: { date: true, status: true },
  });

  const total = records.length;
  const present = records.filter((r) =>
    ["present", "late", "half_day"].includes(r.status)
  ).length;
  const absents = records.filter((r) => r.status === "absent").length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">My Attendance</h1>
      <div className="grid gap-4 xl:grid-cols-3">
        <GlassmorphicCard className="flex flex-col items-center justify-center gap-2">
          <ProgressRing
            value={total ? Math.round((present / total) * 100) : 0}
            label="present"
            size={120}
          />
          <p className="text-sm text-muted-foreground">
            {present} of {total} school days attended • {absents} absences
          </p>
        </GlassmorphicCard>
        <GlassmorphicCard className="xl:col-span-2">
          <AttendanceCalendar
            records={records.map((r) => ({
              date: format(r.date, "yyyy-MM-dd"),
              status: r.status,
            }))}
          />
        </GlassmorphicCard>
      </div>
    </div>
  );
}
