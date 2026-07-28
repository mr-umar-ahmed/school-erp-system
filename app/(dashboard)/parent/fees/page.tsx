import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { getChildrenForParent } from "@/features/dashboard/queries";
import { GlassmorphicCard } from "@/components/shared/glassmorphic-card";
import { FeeHistory } from "@/components/shared/fee-history";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { PayButton } from "./pay-button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Fees" };

export default async function ParentFeesPage({
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

  const payments = await prisma.feePayment.findMany({
    where: { studentId: selected.studentId },
    include: { feeStructure: true },
    orderBy: { dueDate: "desc" },
  });

  const outstanding = payments
    .filter((p) => ["unpaid", "partial", "overdue"].includes(p.status))
    .reduce((sum, p) => sum + Number(p.amountDue) - Number(p.amountPaid), 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">Fees</h1>
      {children.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {children.map((c) => (
            <Link
              key={c.studentId}
              href={`/parent/fees?child=${c.studentId}`}
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard
          icon="Wallet"
          label={`Outstanding — ${selected.name}`}
          value={Math.round(outstanding)}
          prefix="₹"
        />
        <StatCard
          icon="IndianRupee"
          label="Paid This Year"
          value={Math.round(
            payments.reduce((sum, p) => sum + Number(p.amountPaid), 0)
          )}
          prefix="₹"
        />
      </div>

      <GlassmorphicCard>
        <h2 className="mb-3 text-lg">Payment History</h2>
        <FeeHistory
          rows={payments.map((p) => {
            const due = Number(p.amountDue) - Number(p.amountPaid);
            return {
              id: p.id,
              feeName: p.feeStructure.name,
              dueDate: p.dueDate.toISOString(),
              amountDue: Number(p.amountDue),
              amountPaid: Number(p.amountPaid),
              status: p.status,
              receiptNumber: p.receiptNumber,
              paidDate: p.paidDate?.toISOString() ?? null,
              action:
                due > 0 ? <PayButton feePaymentId={p.id} /> : undefined,
            };
          })}
        />
      </GlassmorphicCard>
    </div>
  );
}
