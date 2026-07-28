"use client";

import { useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CalendarEvent {
  date: string; // ISO
  label: string;
}

/** Compact month calendar with circular date indicators (Image 2 style). */
export function CalendarWidget({ events = [] }: { events?: CalendarEvent[] }) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));

  const days = eachDayOfInterval({
    start: startOfWeek(month),
    end: endOfWeek(endOfMonth(month)),
  });

  const eventDates = events.map((e) => new Date(e.date));
  const hasEvent = (day: Date) => eventDates.some((d) => isSameDay(d, day));

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
      <div className="grid grid-cols-7 gap-1 text-center">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <span
            key={i}
            className="py-1 text-[10px] font-bold text-muted-foreground"
          >
            {d}
          </span>
        ))}
        {days.map((day) => (
          <span
            key={day.toISOString()}
            className={cn(
              "relative mx-auto flex size-8 items-center justify-center rounded-full text-xs font-medium",
              !isSameMonth(day, month) && "text-muted-foreground/40",
              isToday(day) &&
                "bg-primary font-bold text-primary-foreground shadow-md shadow-primary/25"
            )}
          >
            {format(day, "d")}
            {hasEvent(day) && !isToday(day) && (
              <span className="absolute bottom-0.5 size-1 rounded-full bg-warning" />
            )}
          </span>
        ))}
      </div>
      {events.length > 0 && (
        <ul className="mt-3 space-y-1.5 border-t border-border pt-3">
          {events.slice(0, 3).map((event, i) => (
            <li key={i} className="flex items-center gap-2 text-xs">
              <span className="size-1.5 shrink-0 rounded-full bg-warning" />
              <span className="truncate font-medium">{event.label}</span>
              <span className="ml-auto shrink-0 text-muted-foreground">
                {format(new Date(event.date), "d MMM")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
