import { Clock, MapPin, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Timetable block card (Image 2 style). The active period uses the dark
 * teal variant; upcoming periods use the light glass variant.
 */
export function ScheduleCard({
  subject,
  startTime,
  endTime,
  room,
  person,
  active = false,
  className,
}: {
  subject: string;
  startTime: string;
  endTime: string;
  room?: string | null;
  person?: string | null;
  active?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl p-4 transition-transform hover:-translate-y-0.5",
        active
          ? "bg-teal text-teal-foreground shadow-lg shadow-teal/25"
          : "glass-strong",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-heading font-bold">{subject}</p>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
            active
              ? "bg-amber-accent text-teal"
              : "bg-accent text-accent-foreground"
          )}
        >
          <Clock className="size-3" />
          {startTime} – {endTime}
        </span>
      </div>
      <div
        className={cn(
          "mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs",
          active ? "text-teal-foreground/80" : "text-muted-foreground"
        )}
      >
        {room && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3" />
            {room}
          </span>
        )}
        {person && (
          <span className="inline-flex items-center gap-1">
            <UserRound className="size-3" />
            {person}
          </span>
        )}
      </div>
    </div>
  );
}
