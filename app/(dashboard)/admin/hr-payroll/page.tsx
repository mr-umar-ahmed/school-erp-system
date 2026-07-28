import type { Metadata } from "next";
import { format } from "date-fns";
import { requireRole, institutionScope } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { LeaveDecisionButtons } from "@/components/forms/leave-form";
import { GlassmorphicCard } from "@/components/shared/glassmorphic-card";
import { EmptyState } from "@/components/shared/empty-state";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/shared/user-avatar";

export const metadata: Metadata = { title: "HR & Payroll" };

export default async function HrPayrollPage() {
  const user = await requireRole(["super_admin", "admin"]);
  const institutionId = institutionScope(user);
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const [pendingLeaves, payroll, staffCount, teacherCount] = await Promise.all([
    prisma.leaveRequest.findMany({
      where: { status: "pending", user: { institutionId } },
      include: {
        user: { select: { firstName: true, lastName: true, role: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.payroll.findMany({
      where: { user: { institutionId }, month, year },
      include: {
        user: { select: { firstName: true, lastName: true, role: true } },
      },
      orderBy: { netSalary: "desc" },
    }),
    prisma.staff.count({ where: { user: { institutionId, isActive: true } } }),
    prisma.teacher.count({
      where: { user: { institutionId, isActive: true } },
    }),
  ]);

  const payrollTotal = payroll.reduce(
    (sum, p) => sum + Number(p.netSalary),
    0
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">HR &amp; Payroll</h1>
        <p className="text-sm text-muted-foreground">
          Leave approvals and {format(now, "MMMM yyyy")} payroll.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon="Users" label="Teachers" value={teacherCount} />
        <StatCard icon="BriefcaseBusiness" label="Staff" value={staffCount} />
        <StatCard
          icon="HandCoins"
          label="Payroll This Month"
          value={Math.round(payrollTotal)}
          prefix="₹"
        />
      </div>

      <GlassmorphicCard>
        <h2 className="mb-3 text-lg">
          Pending Leave Requests ({pendingLeaves.length})
        </h2>
        {pendingLeaves.length === 0 ? (
          <EmptyState title="No pending requests 🎉" />
        ) : (
          <ul className="space-y-2">
            {pendingLeaves.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center gap-3 rounded-2xl bg-secondary/60 px-4 py-3"
              >
                <UserAvatar
                  firstName={r.user.firstName}
                  lastName={r.user.lastName}
                  className="size-9"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">
                    {r.user.firstName} {r.user.lastName}
                    <span className="ml-2 text-xs font-medium text-muted-foreground capitalize">
                      {r.user.role} • {r.leaveType} leave
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(r.startDate, "d MMM")} –{" "}
                    {format(r.endDate, "d MMM yyyy")}
                    {r.reason && ` • ${r.reason}`}
                  </p>
                </div>
                <LeaveDecisionButtons leaveId={r.id} />
              </li>
            ))}
          </ul>
        )}
      </GlassmorphicCard>

      <GlassmorphicCard>
        <h2 className="mb-3 text-lg">Payroll — {format(now, "MMMM yyyy")}</h2>
        {payroll.length === 0 ? (
          <EmptyState title="No payroll processed for this month" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-4">Employee</th>
                  <th className="py-2 pr-4">Basic</th>
                  <th className="py-2 pr-4">Allowances</th>
                  <th className="py-2 pr-4">Deductions</th>
                  <th className="py-2 pr-4">Net</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {payroll.map((p) => (
                  <tr key={p.id} className="border-b border-border/50">
                    <td className="py-2 pr-4 font-medium">
                      {p.user.firstName} {p.user.lastName}
                      <span className="ml-1.5 text-xs text-muted-foreground capitalize">
                        {p.user.role}
                      </span>
                    </td>
                    <td className="py-2 pr-4 tabular-nums">
                      ₹{Number(p.basicSalary).toLocaleString("en-IN")}
                    </td>
                    <td className="py-2 pr-4 tabular-nums">
                      ₹{Number(p.allowances).toLocaleString("en-IN")}
                    </td>
                    <td className="py-2 pr-4 tabular-nums">
                      ₹{Number(p.deductions).toLocaleString("en-IN")}
                    </td>
                    <td className="py-2 pr-4 font-bold tabular-nums">
                      ₹{Number(p.netSalary).toLocaleString("en-IN")}
                    </td>
                    <td className="py-2">
                      <Badge
                        className={
                          p.paymentStatus === "paid"
                            ? "rounded-full bg-success/15 text-success"
                            : p.paymentStatus === "processed"
                              ? "rounded-full bg-info/15 text-info"
                              : "rounded-full bg-warning/15 text-warning"
                        }
                      >
                        {p.paymentStatus}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassmorphicCard>
    </div>
  );
}
