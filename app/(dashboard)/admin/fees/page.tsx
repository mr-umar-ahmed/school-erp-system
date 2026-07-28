import type { Metadata } from "next";
import { requireRole, institutionScope } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/shared/stat-card";
import { GlassmorphicCard } from "@/components/shared/glassmorphic-card";
import { DuesTable } from "./dues-table";

export const metadata: Metadata = { title: "Fee Management" };

export default async function AdminFeesPage() {
  const user = await requireRole(["super_admin", "admin", "staff"]);
  const institutionId = institutionScope(user);

  const [collectedAgg, dueAgg, dues, structures] = await Promise.all([
    prisma.feePayment.aggregate({
      where: { student: { user: { institutionId } } },
      _sum: { amountPaid: true },
    }),
    prisma.feePayment.aggregate({
      where: {
        student: { user: { institutionId } },
        status: { in: ["unpaid", "partial", "overdue"] },
      },
      _sum: { amountDue: true, amountPaid: true },
    }),
    prisma.feePayment.findMany({
      where: {
        student: { user: { institutionId } },
        status: { in: ["unpaid", "partial", "overdue"] },
      },
      include: {
        feeStructure: true,
        student: {
          include: {
            user: { select: { firstName: true, lastName: true } },
            section: { include: { schoolClass: true } },
          },
        },
      },
      orderBy: { dueDate: "asc" },
    }),
    prisma.feeStructure.findMany({
      where: { institutionId },
      include: { schoolClass: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const collected = Math.round(Number(collectedAgg._sum.amountPaid ?? 0));
  const outstanding = Math.round(
    Number(dueAgg._sum.amountDue ?? 0) - Number(dueAgg._sum.amountPaid ?? 0)
  );
  const defaulters = new Set(dues.map((d) => d.studentId)).size;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Fee Management</h1>
        <p className="text-sm text-muted-foreground">
          Collections, outstanding dues and fee structures.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon="IndianRupee"
          label="Total Collected"
          value={collected}
          prefix="₹"
        />
        <StatCard
          icon="Wallet"
          label="Outstanding"
          value={outstanding}
          prefix="₹"
        />
        <StatCard icon="Users" label="Students With Dues" value={defaulters} />
      </div>

      <GlassmorphicCard>
        <h2 className="mb-3 text-lg">Outstanding Dues</h2>
        <DuesTable
          rows={dues.map((d) => ({
            id: d.id,
            studentName: `${d.student.user.firstName} ${d.student.user.lastName}`,
            className: d.student.section
              ? `${d.student.section.schoolClass.name}-${d.student.section.name}`
              : "—",
            feeName: d.feeStructure.name,
            dueDate: d.dueDate.toISOString(),
            amountDue: Number(d.amountDue),
            amountPaid: Number(d.amountPaid),
            status: d.status,
          }))}
        />
      </GlassmorphicCard>

      <GlassmorphicCard>
        <h2 className="mb-3 text-lg">Fee Structures</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {structures.map((s) => (
            <div key={s.id} className="rounded-2xl bg-secondary/60 p-4">
              <p className="font-semibold">{s.name}</p>
              <p className="text-xs text-muted-foreground">
                {s.schoolClass?.name ?? "All classes"} • {s.frequency}
                {s.dueDay ? ` • due day ${s.dueDay}` : ""}
              </p>
              <p className="mt-1 text-lg font-extrabold tabular-nums">
                ₹{Number(s.amount).toLocaleString("en-IN")}
              </p>
            </div>
          ))}
        </div>
      </GlassmorphicCard>
    </div>
  );
}
