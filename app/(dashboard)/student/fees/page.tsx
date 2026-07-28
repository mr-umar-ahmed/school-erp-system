import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { GlassmorphicCard } from "@/components/shared/glassmorphic-card";
import { FeeHistory } from "@/components/shared/fee-history";
import { StatCard } from "@/components/shared/stat-card";

export const metadata: Metadata = { title: "My Fees" };

export default async function StudentFeesPage() {
  const user = await requireRole(["student"]);
  if (!user.student) redirect("/student");

  const payments = await prisma.feePayment.findMany({
    where: { studentId: user.student.id },
    include: { feeStructure: true },
    orderBy: { dueDate: "desc" },
  });

  const outstanding = payments
    .filter((p) => ["unpaid", "partial", "overdue"].includes(p.status))
    .reduce((sum, p) => sum + Number(p.amountDue) - Number(p.amountPaid), 0);
  const paidTotal = payments.reduce((sum, p) => sum + Number(p.amountPaid), 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">My Fees</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard
          icon="Wallet"
          label="Outstanding Balance"
          value={Math.round(outstanding)}
          prefix="₹"
        />
        <StatCard
          icon="IndianRupee"
          label="Paid This Year"
          value={Math.round(paidTotal)}
          prefix="₹"
        />
      </div>
      <GlassmorphicCard>
        <h2 className="mb-3 text-lg">Payment History</h2>
        <FeeHistory
          rows={payments.map((p) => ({
            id: p.id,
            feeName: p.feeStructure.name,
            dueDate: p.dueDate.toISOString(),
            amountDue: Number(p.amountDue),
            amountPaid: Number(p.amountPaid),
            status: p.status,
            receiptNumber: p.receiptNumber,
            paidDate: p.paidDate?.toISOString() ?? null,
          }))}
        />
      </GlassmorphicCard>
    </div>
  );
}
