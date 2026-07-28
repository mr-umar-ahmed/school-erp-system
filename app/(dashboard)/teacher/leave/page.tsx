import type { Metadata } from "next";
import { format } from "date-fns";
import { requireRole } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { LeaveRequestForm } from "@/components/forms/leave-form";
import { GlassmorphicCard } from "@/components/shared/glassmorphic-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Leave" };

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-warning/15 text-warning",
  approved: "bg-success/15 text-success",
  rejected: "bg-destructive/15 text-destructive",
};

export default async function TeacherLeavePage() {
  const user = await requireRole(["teacher"]);
  const requests = await prisma.leaveRequest.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">Leave</h1>

      <GlassmorphicCard>
        <h2 className="mb-3 text-lg">New Request</h2>
        <LeaveRequestForm />
      </GlassmorphicCard>

      <GlassmorphicCard>
        <h2 className="mb-3 text-lg">My Requests</h2>
        {requests.length === 0 ? (
          <EmptyState title="No leave requests yet" />
        ) : (
          <ul className="space-y-2">
            {requests.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center gap-3 rounded-2xl bg-secondary/60 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold capitalize">
                    {r.leaveType} leave
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(r.startDate, "d MMM")} –{" "}
                    {format(r.endDate, "d MMM yyyy")}
                    {r.reason && ` • ${r.reason}`}
                  </p>
                </div>
                <Badge className={`rounded-full ${STATUS_STYLE[r.status]}`}>
                  {r.status}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </GlassmorphicCard>
    </div>
  );
}
