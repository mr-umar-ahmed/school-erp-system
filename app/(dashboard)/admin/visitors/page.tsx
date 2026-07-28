import type { Metadata } from "next";
import { format } from "date-fns";
import { requireRole, institutionScope } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { GlassmorphicCard } from "@/components/shared/glassmorphic-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { VisitorCheckInForm, CheckOutButton } from "./visitor-client";

export const metadata: Metadata = { title: "Visitors" };

export default async function VisitorsPage() {
  const user = await requireRole(["super_admin", "admin", "staff"]);
  const institutionId = institutionScope(user);

  const logs = await prisma.visitorLog.findMany({
    where: { institutionId },
    orderBy: { checkIn: "desc" },
    take: 50,
  });
  const onCampus = logs.filter((l) => !l.checkOut).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Visitor Management</h1>
        <p className="text-sm text-muted-foreground">
          {onCampus} visitor{onCampus === 1 ? "" : "s"} currently on campus
        </p>
      </div>

      <GlassmorphicCard>
        <h2 className="mb-3 text-lg">Check In a Visitor</h2>
        <VisitorCheckInForm />
      </GlassmorphicCard>

      <GlassmorphicCard>
        <h2 className="mb-3 text-lg">Recent Visits</h2>
        {logs.length === 0 ? (
          <EmptyState title="No visitor records" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-4">Visitor</th>
                  <th className="py-2 pr-4">Purpose</th>
                  <th className="py-2 pr-4">Meeting</th>
                  <th className="py-2 pr-4">In</th>
                  <th className="py-2 pr-4">Out</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id} className="border-b border-border/50">
                    <td className="py-2.5 pr-4">
                      <span className="block font-medium">{l.visitorName}</span>
                      <span className="text-xs text-muted-foreground">
                        {l.phone ?? "—"}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4">{l.purpose}</td>
                    <td className="py-2.5 pr-4">{l.whomToMeet ?? "—"}</td>
                    <td className="py-2.5 pr-4 text-xs tabular-nums">
                      {format(l.checkIn, "d MMM, h:mm a")}
                    </td>
                    <td className="py-2.5 pr-4 text-xs tabular-nums">
                      {l.checkOut ? format(l.checkOut, "h:mm a") : "—"}
                    </td>
                    <td className="py-2.5">
                      {l.checkOut ? (
                        <Badge className="rounded-full bg-muted text-muted-foreground">
                          left
                        </Badge>
                      ) : (
                        <CheckOutButton id={l.id} />
                      )}
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
