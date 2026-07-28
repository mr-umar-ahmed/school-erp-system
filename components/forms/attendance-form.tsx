"use client";

import { useState, useTransition } from "react";
import { CheckCheck, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/user-avatar";
import { markSectionAttendance } from "@/features/attendance/actions";
import type { AttendanceStatus } from "@/lib/generated/prisma/enums";
import { cn } from "@/lib/utils";

export interface RosterEntry {
  userId: string;
  firstName: string;
  lastName: string;
  rollNumber: number | null;
  status: AttendanceStatus | null;
}

const STATUS_OPTIONS: { value: AttendanceStatus; label: string; className: string }[] = [
  { value: "present", label: "P", className: "aria-pressed:bg-success aria-pressed:text-success-foreground aria-pressed:border-success" },
  { value: "absent", label: "A", className: "aria-pressed:bg-destructive aria-pressed:text-destructive-foreground aria-pressed:border-destructive" },
  { value: "late", label: "L", className: "aria-pressed:bg-warning aria-pressed:text-warning-foreground aria-pressed:border-warning" },
  { value: "half_day", label: "H", className: "aria-pressed:bg-info aria-pressed:text-info-foreground aria-pressed:border-info" },
  { value: "excused", label: "E", className: "aria-pressed:bg-teal aria-pressed:text-teal-foreground aria-pressed:border-teal" },
];

export function AttendanceForm({
  sectionId,
  date,
  roster,
}: {
  sectionId: string;
  date: string; // yyyy-MM-dd
  roster: RosterEntry[];
}) {
  const [isPending, startTransition] = useTransition();
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>(
    () =>
      Object.fromEntries(
        roster.map((r) => [r.userId, r.status ?? "present"])
      )
  );

  const summary = Object.values(statuses).reduce(
    (acc, s) => ({ ...acc, [s]: (acc[s] ?? 0) + 1 }),
    {} as Record<string, number>
  );

  const save = () => {
    startTransition(async () => {
      const result = await markSectionAttendance({
        sectionId,
        date,
        entries: Object.entries(statuses).map(([userId, status]) => ({
          userId,
          status,
        })),
      });
      if (result.error) toast.error(result.error);
      if (result.success) toast.success(result.success);
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="rounded-full"
          onClick={() =>
            setStatuses(
              Object.fromEntries(roster.map((r) => [r.userId, "present"]))
            )
          }
        >
          <CheckCheck className="size-4" />
          Mark all present
        </Button>
        <p className="ml-auto text-xs font-medium text-muted-foreground">
          {summary.present ?? 0} present • {summary.absent ?? 0} absent •{" "}
          {summary.late ?? 0} late
        </p>
      </div>

      <ul className="glass-strong divide-y divide-border/60 rounded-2xl">
        {roster.map((entry) => (
          <li
            key={entry.userId}
            className="flex flex-wrap items-center gap-3 px-4 py-2.5"
          >
            <span className="w-8 text-xs font-bold text-muted-foreground tabular-nums">
              {entry.rollNumber ?? "—"}
            </span>
            <UserAvatar
              firstName={entry.firstName}
              lastName={entry.lastName}
              className="size-8"
            />
            <span className="min-w-0 flex-1 truncate text-sm font-medium">
              {entry.firstName} {entry.lastName}
            </span>
            <div className="flex gap-1">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  aria-pressed={statuses[entry.userId] === opt.value}
                  onClick={() =>
                    setStatuses((s) => ({ ...s, [entry.userId]: opt.value }))
                  }
                  className={cn(
                    "size-8 rounded-full border border-border text-xs font-bold transition-colors hover:bg-accent",
                    opt.className
                  )}
                  title={opt.value.replace("_", " ")}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>

      <Button onClick={save} disabled={isPending} className="rounded-full">
        <Save className="size-4" />
        {isPending ? "Saving..." : "Save Attendance"}
      </Button>
    </div>
  );
}
