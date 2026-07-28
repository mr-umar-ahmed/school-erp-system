import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth/dal";
import {
  getTeacherDashboardData,
  nowHHmm,
} from "@/features/dashboard/queries";
import { Greeting } from "@/components/dashboard/greeting";
import { StatCard } from "@/components/shared/stat-card";
import { ScheduleCard } from "@/components/shared/schedule-card";
import { Timeline } from "@/components/shared/timeline";
import { UpcomingTasks } from "@/components/dashboard/upcoming-tasks";
import { CategoryGrid } from "@/components/shared/category-grid";
import { GlassmorphicCard } from "@/components/shared/glassmorphic-card";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = { title: "Teacher Dashboard" };

export default async function TeacherDashboardPage() {
  const user = await requireRole(["teacher"]);
  const data = await getTeacherDashboardData(user);
  const now = nowHHmm();

  return (
    <div className="space-y-6">
      <Greeting
        name={user.firstName}
        subtitle={
          data.todaySlots.length
            ? `You have ${data.todaySlots.length} ${data.todaySlots.length === 1 ? "class" : "classes"} today.`
            : "No classes scheduled today — enjoy the calm!"
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon="School"
          label="Classes Today"
          value={data.todaySlots.length}
        />
        <StatCard
          icon="ClipboardList"
          label="Submissions To Grade"
          value={data.ungraded}
        />
        <StatCard
          icon="NotebookPen"
          label="Subjects Taught"
          value={data.myClasses.length}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <GlassmorphicCard className="xl:col-span-2">
          <h2 className="mb-4 text-lg">Today&apos;s Schedule</h2>
          {data.todaySlots.length === 0 ? (
            <EmptyState
              title="No classes today"
              description="Your timetable is clear for the day."
            />
          ) : (
            <Timeline
              entries={data.todaySlots.map((slot) => ({
                time: slot.startTime,
                active: slot.startTime <= now && now < slot.endTime,
                content: (
                  <ScheduleCard
                    subject={`${slot.subject} • ${slot.className}`}
                    startTime={slot.startTime}
                    endTime={slot.endTime}
                    room={slot.room}
                    active={slot.startTime <= now && now < slot.endTime}
                  />
                ),
              }))}
            />
          )}
        </GlassmorphicCard>

        <div className="space-y-4">
          <GlassmorphicCard>
            <h2 className="mb-3 text-lg">Quick Actions</h2>
            <CategoryGrid
              items={[
                {
                  label: "Take Attendance",
                  href: "/teacher/attendance",
                  icon: "ClipboardCheck",
                },
                {
                  label: "New Assignment",
                  href: "/teacher/assignments/new",
                  icon: "NotebookPen",
                },
                {
                  label: "Gradebook",
                  href: "/teacher/gradebook",
                  icon: "ClipboardList",
                },
                {
                  label: "My Classes",
                  href: "/teacher/my-classes",
                  icon: "School",
                },
              ]}
            />
          </GlassmorphicCard>

          <GlassmorphicCard>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg">Announcements</h2>
              <Link
                href="/teacher/communication"
                className="text-xs font-semibold text-primary hover:underline"
              >
                View all
              </Link>
            </div>
            <UpcomingTasks
              items={data.announcements.map((a) => ({
                id: a.id,
                title: a.title,
                priority: a.priority,
                timestamp: a.publishedAt,
              }))}
            />
          </GlassmorphicCard>
        </div>
      </div>
    </div>
  );
}
