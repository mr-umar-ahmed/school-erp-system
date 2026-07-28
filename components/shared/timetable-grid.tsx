import { ScheduleCard } from "@/components/shared/schedule-card";
import { EmptyState } from "@/components/shared/empty-state";

export interface GridSlot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  subject: string;
  detail?: string | null; // teacher or class name
  room?: string | null;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Weekly timetable: one column per school day (Mon–Sat with content). */
export function TimetableGrid({
  slots,
  renderSlotExtra,
}: {
  slots: GridSlot[];
  renderSlotExtra?: (slot: GridSlot) => React.ReactNode;
}) {
  const days = [1, 2, 3, 4, 5, 6].filter((d) =>
    slots.some((s) => s.dayOfWeek === d)
  );
  if (slots.length === 0) {
    return (
      <EmptyState
        title="No periods scheduled"
        description="The timetable for this selection is empty."
      />
    );
  }
  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[48rem] grid-cols-5 gap-3" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}>
        {days.map((day) => (
          <div key={day} className="space-y-2">
            <p className="text-center text-xs font-bold tracking-widest text-muted-foreground uppercase">
              {DAY_NAMES[day]}
            </p>
            {slots
              .filter((s) => s.dayOfWeek === day)
              .sort((a, b) => a.startTime.localeCompare(b.startTime))
              .map((slot) => (
                <div key={slot.id} className="relative">
                  <ScheduleCard
                    subject={slot.subject}
                    startTime={slot.startTime}
                    endTime={slot.endTime}
                    room={slot.room}
                    person={slot.detail}
                  />
                  {renderSlotExtra?.(slot)}
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}
