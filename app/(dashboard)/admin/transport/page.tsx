import type { Metadata } from "next";
import { Bus, MapPin, Phone, UserRound } from "lucide-react";
import { requireRole, institutionScope } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { GlassmorphicCard } from "@/components/shared/glassmorphic-card";
import { ModuleIcon } from "@/components/shared/module-icon";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Transport" };

export default async function AdminTransportPage() {
  const user = await requireRole(["super_admin", "admin", "staff"]);
  const institutionId = institutionScope(user);

  const routes = await prisma.transportRoute.findMany({
    where: { institutionId },
    include: {
      stops: {
        orderBy: { orderIndex: "asc" },
        include: { _count: { select: { students: true } } },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Transport</h1>
        <p className="text-sm text-muted-foreground">
          {routes.length} routes in operation
        </p>
      </div>

      {routes.length === 0 ? (
        <EmptyState title="No transport routes configured" />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {routes.map((route) => {
            const riders = route.stops.reduce(
              (sum, s) => sum + s._count.students,
              0
            );
            return (
              <GlassmorphicCard key={route.id}>
                <div className="flex items-start gap-4">
                  <ModuleIcon icon={Bus} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg">{route.name}</h2>
                      <Badge className="rounded-full bg-primary/12 text-primary">
                        {riders}/{route.capacity ?? "—"} riders
                      </Badge>
                    </div>
                    <p className="mt-0.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Bus className="size-3" />
                        {route.vehicleNumber ?? "No vehicle"}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <UserRound className="size-3" />
                        {route.driverName ?? "No driver"}
                      </span>
                      {route.driverPhone && (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="size-3" />
                          {route.driverPhone}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <ol className="mt-4 space-y-1.5 border-t border-border pt-3">
                  {route.stops.map((stop, i) => (
                    <li
                      key={stop.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/12 text-[10px] font-bold text-primary">
                        {i + 1}
                      </span>
                      <MapPin className="size-3.5 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate font-medium">
                        {stop.name}
                      </span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {stop.pickupTime ?? "—"} / {stop.dropTime ?? "—"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {stop._count.students} students
                      </span>
                    </li>
                  ))}
                </ol>
              </GlassmorphicCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
