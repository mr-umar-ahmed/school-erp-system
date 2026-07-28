import type { Metadata } from "next";
import { requireRole, institutionScope } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { getAdminDashboardData } from "@/features/dashboard/queries";
import { GlassmorphicCard } from "@/components/shared/glassmorphic-card";
import { SimpleBarChart } from "@/components/dashboard/simple-bar-chart";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { AttendanceChart } from "@/components/dashboard/attendance-chart";
import { StatCard } from "@/components/shared/stat-card";

export const metadata: Metadata = { title: "Reports & Analytics" };

export default async function ReportsPage() {
  const user = await requireRole(["super_admin", "admin"]);
  const institutionId = institutionScope(user);

  const [dashboard, classes, publishedResults] = await Promise.all([
    getAdminDashboardData(institutionId),
    prisma.schoolClass.findMany({
      where: { institutionId },
      orderBy: { numericOrder: "asc" },
      include: {
        sections: { include: { _count: { select: { students: true } } } },
      },
    }),
    prisma.examResult.findMany({
      where: {
        examSchedule: { examination: { institutionId, isPublished: true } },
        isAbsent: false,
        marksObtained: { not: null },
      },
      include: {
        examSchedule: {
          select: {
            totalMarks: true,
            schoolClass: { select: { id: true, name: true } },
          },
        },
      },
    }),
  ]);

  // Class-wise average score (% of total) across published exams.
  const perf = new Map<string, { name: string; sum: number; count: number }>();
  for (const r of publishedResults) {
    const cls = r.examSchedule.schoolClass;
    const entry = perf.get(cls.id) ?? { name: cls.name, sum: 0, count: 0 };
    entry.sum +=
      (Number(r.marksObtained) / Number(r.examSchedule.totalMarks)) * 100;
    entry.count += 1;
    perf.set(cls.id, entry);
  }
  const classPerformance = classes.map((c) => ({
    label: c.name.replace("Class ", "C"),
    value: perf.has(c.id)
      ? Math.round(perf.get(c.id)!.sum / perf.get(c.id)!.count)
      : 0,
  }));

  const enrollment = classes.map((c) => ({
    label: c.name.replace("Class ", "C"),
    value: c.sections.reduce((sum, s) => sum + s._count.students, 0),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Reports &amp; Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Academic, attendance and financial insight at a glance. Use your
          browser&apos;s print dialog for a PDF export of this page.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon="GraduationCap"
          label="Enrolled Students"
          value={dashboard.totalStudents}
        />
        <StatCard
          icon="Users"
          label="Teachers"
          value={dashboard.totalTeachers}
        />
        <StatCard
          icon="IndianRupee"
          label="Collected This Month"
          value={dashboard.collectedThisMonth}
          prefix="₹"
        />
        <StatCard
          icon="Wallet"
          label="Outstanding Fees"
          value={dashboard.pendingFees}
          prefix="₹"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <GlassmorphicCard>
          <h2 className="mb-2 text-lg">Average Score by Class (%)</h2>
          <SimpleBarChart
            data={classPerformance}
            seriesName="Average score"
            formatter={(v) => `${v}%`}
            domainMax={100}
          />
        </GlassmorphicCard>
        <GlassmorphicCard>
          <h2 className="mb-2 text-lg">Enrollment by Class</h2>
          <SimpleBarChart
            data={enrollment}
            seriesName="Students"
          />
        </GlassmorphicCard>
        <GlassmorphicCard>
          <h2 className="mb-2 text-lg">Attendance Trend (30 days)</h2>
          <AttendanceChart data={dashboard.attendanceTrend} />
        </GlassmorphicCard>
        <GlassmorphicCard>
          <h2 className="mb-2 text-lg">Fee Collection by Month</h2>
          <RevenueChart data={dashboard.revenueByMonth} />
        </GlassmorphicCard>
      </div>
    </div>
  );
}
