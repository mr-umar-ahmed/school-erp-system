import type { Metadata } from "next";
import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { requireRole } from "@/lib/auth/dal";
import { getChildrenForParent } from "@/features/dashboard/queries";
import { ModuleIcon } from "@/components/shared/module-icon";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = { title: "My Children" };

export default async function ChildrenPage() {
  const user = await requireRole(["parent"]);
  const children = await getChildrenForParent(user);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">My Children</h1>
      {children.length === 0 ? (
        <EmptyState
          title="No children linked"
          description="Ask the school office to link your child's profile to this account."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {children.map((c) => (
            <Link
              key={c.studentId}
              href={`/parent?child=${c.studentId}`}
              className="glass-strong flex items-center gap-4 rounded-3xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10"
            >
              <ModuleIcon icon={GraduationCap} size="lg" />
              <div>
                <p className="font-heading font-bold">{c.name}</p>
                <p className="text-sm text-muted-foreground">
                  {c.className ?? "Not enrolled"} •{" "}
                  <span className="capitalize">{c.relationship}</span>
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
