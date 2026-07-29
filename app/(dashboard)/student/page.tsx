import type { Metadata } from "next";
import Link from "next/link";
import { differenceInDays } from "date-fns";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/dal";
import { getStudentSnapshot, nowHHmm } from "@/features/dashboard/queries";
import { Greeting } from "@/components/dashboard/greeting";
import { ProgressRing } from "@/components/shared/progress-ring";
import { ScheduleCard } from "@/components/shared/schedule-card";
import { Timeline } from "@/components/shared/timeline";
import { UpcomingTasks } from "@/components/dashboard/upcoming-tasks";
import { CategoryGrid } from "@/components/shared/category-grid";
import { GlassmorphicCard } from "@/components/shared/glassmorphic-card";
import { EmptyState } from "@/components/shared/empty-state";
import type { PriorityLevel } from "@/lib/generated/prisma/enums";

export const metadata: Metadata = { title: "Student Dashboard" };

function duePriority(dueDate: string): PriorityLevel {
  const days = differenceInDays(new Date(dueDate), new Date());
  if (days <= 1) return "high";
  if (days <= 3) return "medium";
  return "low";
}

export default async function StudentDashboardPage() {
  const user = await requireRole(["student"]);
  if (!user.student) redirect("/login");
  const data = await getStudentSnapshot(user.student.id);
  if (!data) redirect("/login");
  const now = nowHHmm();

  return (
    <div className="space-y-6">
      <Greeting
        name={user.firstName}
        subtitle={
          data.className
            ? `${data.className} • Let's make today count.`
            : "Let's make today count."
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <GlassmorphicCard className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg">Attendance</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Overall presence this year
            </p>
            <Link
              href="/student/attendance"
              className="mt-2 inline-block text-xs font-semibold text-primary hover:underline"
            >
              View calendar
            </Link>
          </div>
          <ProgressRing value={data.attendancePercent} label="present" />
        </GlassmorphicCard>

        <GlassmorphicCard className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg">Fees</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {data.feeDue > 0 ? "Amount due" : "All cleared 🎉"}
            </p>
            <Link
              href="/student/fees"
              className="mt-2 inline-block text-xs font-semibold text-primary hover:underline"
            >
              View details
            </Link>
          </div>
          <p className="text-3xl font-extrabold tabular-nums">
            ₹{data.feeDue.toLocaleString("en-IN")}
          </p>
        </GlassmorphicCard>

        <GlassmorphicCard>
          <h2 className="mb-3 text-lg">Quick Actions</h2>
          <CategoryGrid
            columns={4}
            items={[
              {
                label: "Timetable",
                href: "/student/timetable",
                icon: "CalendarDays",
              },
              {
                label: "Results",
                href: "/student/results",
                icon: "FileSpreadsheet",
              },
              {
                label: "Homework",
                href: "/student/assignments",
                icon: "NotebookPen",
              },
              { label: "Fees", href: "/student/fees", icon: "Wallet" },
            ]}
          />
        </GlassmorphicCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <GlassmorphicCard className="lg:col-span-2">
          <h2 className="mb-4 text-lg">Today&apos;s Timetable</h2>
          {data.todaySlots.length === 0 ? (
            <EmptyState
              title="No classes today"
              description="Enjoy your day off!"
            />
          ) : (
            <Timeline
              entries={data.todaySlots.map((slot) => ({
                time: slot.startTime,
                active: slot.startTime <= now && now < slot.endTime,
                content: (
                  <ScheduleCard
                    subject={slot.subject}
                    startTime={slot.startTime}
                    endTime={slot.endTime}
                    room={slot.room}
                    person={slot.teacher}
                    active={slot.startTime <= now && now < slot.endTime}
                  />
                ),
              }))}
            />
          )}
        </GlassmorphicCard>

        <div className="space-y-4">
          <GlassmorphicCard>
            <h2 className="mb-3 text-lg">Assignments Due</h2>
            <UpcomingTasks
              items={data.pendingAssignments.map((a) => ({
                id: a.id,
                title: a.title,
                meta: a.submitted ? `${a.subject} • Submitted ✓` : a.subject,
                priority: a.submitted ? "low" : duePriority(a.dueDate),
                timestamp: a.dueDate,
              }))}
            />
          </GlassmorphicCard>

          <GlassmorphicCard>
            <h2 className="mb-3 text-lg">Recent Results</h2>
            {data.recentResults.length === 0 ? (
              <EmptyState title="No results yet" />
            ) : (
              <ul className="space-y-2">
                {data.recentResults.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between rounded-2xl bg-secondary/60 px-4 py-2.5 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{r.subject}</p>
                      <p className="text-xs text-muted-foreground">{r.exam}</p>
                    </div>
                    <p className="font-bold tabular-nums">
                      {r.marksObtained ?? "—"}/{r.totalMarks}
                      {r.grade && (
                        <span className="ml-2 rounded-full bg-primary/12 px-2 py-0.5 text-xs font-bold text-primary">
                          {r.grade}
                        </span>
                      )}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </GlassmorphicCard>
        </div>
      </div>
    </div>
  );
}
