"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createTimetableSlot,
  deleteTimetableSlot,
} from "@/features/timetable/actions";

const DAYS = [
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
];

export function TimetableSlotForm({
  sectionId,
  subjects,
  teachers,
}: {
  sectionId: string;
  subjects: { id: string; name: string }[];
  teachers: { id: string; name: string }[];
}) {
  const [isPending, startTransition] = useTransition();
  const [subjectId, setSubjectId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState("1");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("08:50");
  const [roomNumber, setRoomNumber] = useState("");

  const submit = () => {
    if (!subjectId || !teacherId) {
      toast.error("Choose a subject and teacher");
      return;
    }
    startTransition(async () => {
      const result = await createTimetableSlot({
        sectionId,
        subjectId,
        teacherId,
        dayOfWeek: Number(dayOfWeek),
        startTime,
        endTime,
        roomNumber: roomNumber || undefined,
      });
      if (result.error) toast.error(result.error);
      if (result.success) toast.success(result.success);
    });
  };

  return (
    <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-7">
      <div className="space-y-1.5">
        <Label>Subject</Label>
        <Select value={subjectId} onValueChange={setSubjectId}>
          <SelectTrigger>
            <SelectValue placeholder="Subject" />
          </SelectTrigger>
          <SelectContent>
            {subjects.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Teacher</Label>
        <Select value={teacherId} onValueChange={setTeacherId}>
          <SelectTrigger>
            <SelectValue placeholder="Teacher" />
          </SelectTrigger>
          <SelectContent>
            {teachers.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Day</Label>
        <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DAYS.map((d) => (
              <SelectItem key={d.value} value={d.value}>
                {d.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Start</Label>
        <Input
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label>End</Label>
        <Input
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Room</Label>
        <Input
          placeholder="101"
          value={roomNumber}
          onChange={(e) => setRoomNumber(e.target.value)}
        />
      </div>
      <Button onClick={submit} disabled={isPending} className="rounded-full">
        <Plus className="size-4" />
        {isPending ? "Checking..." : "Add Period"}
      </Button>
    </div>
  );
}

export function DeleteSlotButton({ slotId }: { slotId: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <button
      aria-label="Remove period"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const result = await deleteTimetableSlot(slotId);
          if (result.error) toast.error(result.error);
          if (result.success) toast.success(result.success);
        })
      }
      className="absolute top-2 right-2 rounded-full bg-destructive/10 p-1.5 text-destructive opacity-0 transition-opacity hover:bg-destructive/20 [div:hover>&]:opacity-100"
    >
      <Trash2 className="size-3.5" />
    </button>
  );
}
