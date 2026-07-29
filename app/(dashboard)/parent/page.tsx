import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Wallet } from "lucide-react";
import { requireRole } from "@/lib/auth/dal";
import {
  getChildrenForParent,
  getStudentSnapshot,
  nowHHmm,
} from "@/features/dashboard/queries";
import { Greeting } from "@/components/dashboard/greeting";
import { ProgressRing } from "@/components/shared/progress-ring";
import { ScheduleCard } from "@/components/shared/schedule-card";
import { Timeline } from "@/components/shared/timeline";
import { UpcomingTasks } from "@/components/dashboard/upcoming-tasks";
import { GlassmorphicCard } from "@/components/shared/glassmorphic-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Parent Dashboard" };

export default async function ParentDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ child?: string }>;
}) {
  const user = await requireRole(["parent"]);
  const { child } = await searchParams;
  const children = await getChildrenForParent(user);

  if (children.length === 0) {
    return (
      <div className="space-y-6">
        <Greeting name={user.firstName} />
        <EmptyState
          title="No children linked yet"
          description="Ask the school office to link your child's profile to this account."
        />
      </div>
    );
  }

  const selected =
    children.find((c) => c.studentId === child) ?? children[0];
  const data = await getStudentSnapshot(selected.studentId);
  if (!data) redirect("/parent");
  const now = nowHHmm();

  return (
    <div className="space-y-6">
      <Greeting
        name={user.firstName}
        subtitle="Here's how your child is doing."
      />

      {/* Child selector */}
      {children.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {children.map((c) => (
            <Link
              key={c.studentId}
              href={`/parent?child=${c.studentId}`}
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <GlassmorphicCard className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg">{data.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {data.className ?? "Not enrolled"}
            </p>
            <Link
              href={`/parent/attendance?child=${selected.studentId}`}
              className="mt-2 inline-block text-xs font-semibold text-primary hover:underline"
            >
              Attendance details
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
            {data.feeDue > 0 && (
              <Button asChild size="sm" className="mt-2 rounded-full">
                <Link href={`/parent/fees?child=${selected.studentId}`}>
                  <Wallet className="size-4" />
                  Pay Now
                </Link>
              </Button>
            )}
          </div>
          <p className="text-3xl font-extrabold tabular-nums">
            ₹{data.feeDue.toLocaleString("en-IN")}
          </p>
        </GlassmorphicCard>

        <GlassmorphicCard>
          <h2 className="mb-3 text-lg">Recent Results</h2>
          {data.recentResults.length === 0 ? (
            <EmptyState title="No results yet" />
          ) : (
            <ul className="space-y-2">
              {data.recentResults.slice(0, 3).map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between rounded-2xl bg-secondary/60 px-4 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{r.subject}</p>
                    <p className="text-xs text-muted-foreground">{r.exam}</p>
                  </div>
                  <p className="font-bold tabular-nums">
                    {r.marksObtained ?? "—"}/{r.totalMarks}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </GlassmorphicCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <GlassmorphicCard className="lg:col-span-2">
          <h2 className="mb-4 text-lg">Today&apos;s Timetable</h2>
          {data.todaySlots.length === 0 ? (
            <EmptyState title="No classes today" />
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

        <GlassmorphicCard>
          <h2 className="mb-3 text-lg">School Announcements</h2>
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
  );
}
