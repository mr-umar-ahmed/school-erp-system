import { Bus, MapPin, Phone, UserRound } from "lucide-react";
import { GlassmorphicCard } from "@/components/shared/glassmorphic-card";
import { ModuleIcon } from "@/components/shared/module-icon";
import { EmptyState } from "@/components/shared/empty-state";
import { prisma } from "@/lib/prisma";

/** Server component: renders a student's assigned route + stop details. */
export async function StudentTransportCard({ studentId }: { studentId: string }) {
  const assignment = await prisma.studentTransport.findFirst({
    where: { studentId },
    include: { stop: { include: { route: true } } },
  });

  if (!assignment) {
    return (
      <EmptyState
        icon={Bus}
        title="No transport assigned"
        description="Contact the school office to opt into school transport."
      />
    );
  }

  const { stop } = assignment;
  return (
    <GlassmorphicCard>
      <div className="flex items-start gap-4">
        <ModuleIcon icon={Bus} size="lg" />
        <div className="flex-1">
          <h2 className="text-lg">{stop.route.name}</h2>
          <p className="text-sm text-muted-foreground">
            Vehicle {stop.route.vehicleNumber ?? "—"}
          </p>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-secondary/60 p-3">
              <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="size-3.5" />
                Your stop
              </dt>
              <dd className="mt-0.5 font-semibold">{stop.name}</dd>
            </div>
            <div className="rounded-2xl bg-secondary/60 p-3">
              <dt className="text-xs text-muted-foreground">Pickup / Drop</dt>
              <dd className="mt-0.5 font-semibold tabular-nums">
                {stop.pickupTime ?? "—"} / {stop.dropTime ?? "—"}
              </dd>
            </div>
            <div className="rounded-2xl bg-secondary/60 p-3">
              <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <UserRound className="size-3.5" />
                Driver
              </dt>
              <dd className="mt-0.5 font-semibold">
                {stop.route.driverName ?? "—"}
              </dd>
            </div>
            <div className="rounded-2xl bg-secondary/60 p-3">
              <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Phone className="size-3.5" />
                Driver phone
              </dt>
              <dd className="mt-0.5 font-semibold">
                {stop.route.driverPhone ?? "—"}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </GlassmorphicCard>
  );
}
