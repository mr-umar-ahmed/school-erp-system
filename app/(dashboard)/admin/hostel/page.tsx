import type { Metadata } from "next";
import { Building2 } from "lucide-react";
import { requireRole, institutionScope } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { GlassmorphicCard } from "@/components/shared/glassmorphic-card";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Hostel" };

export default async function HostelPage() {
  const user = await requireRole(["super_admin", "admin", "staff"]);
  const institutionId = institutionScope(user);

  const rooms = await prisma.hostelRoom.findMany({
    where: { institutionId },
    include: {
      allocations: {
        where: { checkOutDate: null },
        include: {
          student: {
            include: {
              user: { select: { firstName: true, lastName: true } },
            },
          },
        },
      },
    },
    orderBy: [{ blockName: "asc" }, { roomNumber: "asc" }],
  });

  const capacity = rooms.reduce((sum, r) => sum + r.capacity, 0);
  const occupied = rooms.reduce((sum, r) => sum + r.allocations.length, 0);
  const blocks = [...new Set(rooms.map((r) => r.blockName))];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Hostel</h1>
        <p className="text-sm text-muted-foreground">
          {blocks.length} blocks • {rooms.length} rooms
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon="Building2" label="Total Beds" value={capacity} />
        <StatCard icon="Users" label="Occupied" value={occupied} />
        <StatCard
          icon="DoorOpen"
          label="Vacant Beds"
          value={capacity - occupied}
        />
      </div>

      {rooms.length === 0 ? (
        <EmptyState icon={Building2} title="No hostel rooms configured" />
      ) : (
        blocks.map((block) => (
          <GlassmorphicCard key={block}>
            <h2 className="mb-3 text-lg">{block} Block</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {rooms
                .filter((r) => r.blockName === block)
                .map((room) => {
                  const free = room.capacity - room.allocations.length;
                  return (
                    <div
                      key={room.id}
                      className="rounded-2xl bg-secondary/60 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-bold">{room.roomNumber}</p>
                        <Badge
                          className={cn(
                            "rounded-full",
                            free === 0
                              ? "bg-destructive/15 text-destructive"
                              : "bg-success/15 text-success"
                          )}
                        >
                          {free === 0 ? "Full" : `${free} free`}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Floor {room.floor ?? "—"} • {room.roomType ?? "room"} •
                        ₹{Number(room.monthlyFee ?? 0).toLocaleString("en-IN")}
                        /mo
                      </p>
                      {room.allocations.length > 0 && (
                        <ul className="mt-2 space-y-0.5 text-xs">
                          {room.allocations.map((a) => (
                            <li key={a.id} className="truncate">
                              • {a.student.user.firstName}{" "}
                              {a.student.user.lastName}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
            </div>
          </GlassmorphicCard>
        ))
      )}
    </div>
  );
}
