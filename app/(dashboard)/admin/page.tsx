import type { Metadata } from "next";
import { Users } from "lucide-react";
import { requireRole, institutionScope } from "@/lib/auth/dal";
import { getAdminDashboardData } from "@/features/dashboard/queries";
import { Greeting } from "@/components/dashboard/greeting";
import { StatCard } from "@/components/shared/stat-card";
import { AttendanceChart } from "@/components/dashboard/attendance-chart";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { CalendarWidget } from "@/components/dashboard/calendar-widget";
import { UpcomingTasks } from "@/components/dashboard/upcoming-tasks";
import { CategoryGrid } from "@/components/shared/category-grid";
import { GlassmorphicCard } from "@/components/shared/glassmorphic-card";

export const metadata: Metadata = { title: "Admin Dashboard" };

export default async function AdminDashboardPage() {
  const user = await requireRole(["super_admin", "admin", "staff"]);
  const data = await getAdminDashboardData(institutionScope(user));

  const presentRate = data.studentCountForToday
    ? Math.round((data.presentToday / data.studentCountForToday) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <Greeting
        name={user.firstName}
        subtitle={`Here's what's happening at ${user.institution?.name ?? "your school"} today.`}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon="GraduationCap"
          label="Total Students"
          value={data.totalStudents}
        />
        <StatCard
          icon="ClipboardCheck"
          label="Present Today"
          value={data.presentToday}
          progress={presentRate}
          suffix={data.studentCountForToday ? ` / ${data.studentCountForToday}` : ""}
        />
        <StatCard
          icon="IndianRupee"
          label="Collected This Month"
          value={data.collectedThisMonth}
          prefix="₹"
        />
        <StatCard
          icon="Wallet"
          label="Fees Outstanding"
          value={data.pendingFees}
          prefix="₹"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <GlassmorphicCard className="xl:col-span-2">
          <h2 className="mb-2 text-lg">Attendance Trend (30 days)</h2>
          <AttendanceChart data={data.attendanceTrend} />
        </GlassmorphicCard>
        <GlassmorphicCard>
          <CalendarWidget
            events={data.upcomingExams
              .filter((e) => e.startDate)
              .map((e) => ({ date: e.startDate!, label: e.name }))}
          />
        </GlassmorphicCard>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <GlassmorphicCard className="xl:col-span-2">
          <h2 className="mb-2 text-lg">Fee Collection</h2>
          <RevenueChart data={data.revenueByMonth} />
        </GlassmorphicCard>
        <GlassmorphicCard>
          <h2 className="mb-3 text-lg">Quick Actions</h2>
          <CategoryGrid
            items={[
              {
                label: "Add Student",
                href: "/admin/students/new",
                icon: "UserPlus",
              },
              {
                label: "Attendance",
                href: "/admin/attendance",
                icon: "ClipboardCheck",
              },
              { label: "Collect Fee", href: "/admin/fees", icon: "Wallet" },
              {
                label: "Announce",
                href: "/admin/communication",
                icon: "Megaphone",
              },
            ]}
          />
        </GlassmorphicCard>
      </div>

      <GlassmorphicCard>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg">Latest Announcements</h2>
          <Users className="size-5 text-muted-foreground" />
        </div>
        <UpcomingTasks
          items={data.announcements.map((a) => ({
            id: a.id,
            title: a.title,
            meta: `by ${a.author}`,
            priority: a.priority,
            pinned: a.isPinned,
            timestamp: a.publishedAt,
          }))}
        />
      </GlassmorphicCard>
    </div>
  );
}
