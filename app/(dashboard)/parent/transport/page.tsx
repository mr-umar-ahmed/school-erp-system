import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth/dal";
import { getChildrenForParent } from "@/features/dashboard/queries";
import { StudentTransportCard } from "@/components/shared/transport-card";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Transport" };

export default async function ParentTransportPage({
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">Transport</h1>
      {children.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {children.map((c) => (
            <Link
              key={c.studentId}
              href={`/parent/transport?child=${c.studentId}`}
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
      <StudentTransportCard studentId={selected.studentId} />
    </div>
  );
}
