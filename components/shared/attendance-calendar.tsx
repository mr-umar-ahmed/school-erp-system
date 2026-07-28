"use client";

import { useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { AttendanceStatus } from "@/lib/generated/prisma/enums";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<AttendanceStatus, string> = {
  present: "bg-success/20 text-success",
  absent: "bg-destructive/20 text-destructive",
  late: "bg-warning/20 text-warning",
  half_day: "bg-info/20 text-info",
  excused: "bg-teal/20 text-teal",
};

const LEGEND: { status: AttendanceStatus; label: string }[] = [
  { status: "present", label: "Present" },
  { status: "absent", label: "Absent" },
  { status: "late", label: "Late" },
  { status: "half_day", label: "Half day" },
  { status: "excused", label: "Excused" },
];

/** Month-at-a-glance personal attendance calendar. */
export function AttendanceCalendar({
  records,
}: {
  records: { date: string; status: AttendanceStatus }[]; // date: yyyy-MM-dd
}) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const byDate = new Map(records.map((r) => [r.date, r.status]));

  const days = eachDayOfInterval({
    start: startOfWeek(month),
    end: endOfWeek(endOfMonth(month)),
  });

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="font-heading font-bold">{format(month, "MMMM yyyy")}</p>
        <div className="flex gap-1">
          <button
            onClick={() => setMonth((m) => addMonths(m, -1))}
            className="rounded-full p-1.5 transition-colors hover:bg-accent"
            aria-label="Previous month"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            onClick={() => setMonth((m) => addMonths(m, 1))}
            className="rounded-full p-1.5 transition-colors hover:bg-accent"
            aria-label="Next month"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1.5 text-center">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <span key={i} className="py-1 text-[10px] font-bold text-muted-foreground">
            {d}
          </span>
        ))}
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const status = byDate.get(key);
          return (
            <span
              key={key}
              title={status?.replace("_", " ")}
              className={cn(
                "mx-auto flex size-9 items-center justify-center rounded-full text-xs font-semibold",
                !isSameMonth(day, month) && "opacity-30",
                status ? STATUS_STYLES[status] : "text-muted-foreground",
                isToday(day) && "ring-2 ring-primary"
              )}
            >
              {format(day, "d")}
            </span>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-3 border-t border-border pt-3">
        {LEGEND.map((l) => (
          <span key={l.status} className="flex items-center gap-1.5 text-xs">
            <span className={cn("size-3 rounded-full", STATUS_STYLES[l.status])} />
            {l.label}
          </span>
        ))}
      </div>
    </div>
  );
}
