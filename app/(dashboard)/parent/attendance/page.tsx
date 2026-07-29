import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { requireRole } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { getChildrenForParent } from "@/features/dashboard/queries";
import { AttendanceCalendar } from "@/components/shared/attendance-calendar";
import { ProgressRing } from "@/components/shared/progress-ring";
import { GlassmorphicCard } from "@/components/shared/glassmorphic-card";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Child Attendance" };

export default async function ParentAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ child?: string }>;
}) {
  const user = await requireRole(["parent"]);
  const { child } = await searchParams;
  const children = await getChildrenForParent(user);

  if (children.length === 0) {
    return <EmptyState title="No children linked to this account" />;
  }
  const selected = children.find((c) => c.studentId === child) ?? children[0];

  const student = await prisma.student.findUnique({
    where: { id: selected.studentId },
    select: { userId: true },
  });
  const records = student
    ? await prisma.attendance.findMany({
        where: { userId: student.userId },
        orderBy: { date: "asc" },
        select: { date: true, status: true },
      })
    : [];

  const total = records.length;
  const present = records.filter((r) =>
    ["present", "late", "half_day"].includes(r.status)
  ).length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">Attendance</h1>
      {children.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {children.map((c) => (
            <Link
              key={c.studentId}
              href={`/parent/attendance?child=${c.studentId}`}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
                c.studentId === selected.studentId
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                  : "glass-strong hover:bg-accent"
              )}
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}
      <div className="grid gap-4 lg:grid-cols-3">
        <GlassmorphicCard className="flex flex-col items-center justify-center gap-2">
          <ProgressRing
            value={total ? Math.round((present / total) * 100) : 0}
            label="present"
            size={120}
          />
          <p className="text-center text-sm text-muted-foreground">
            {selected.name} • {present} of {total} school days
          </p>
        </GlassmorphicCard>
        <GlassmorphicCard className="lg:col-span-2">
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
