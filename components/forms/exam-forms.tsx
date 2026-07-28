"use client";

import { useState, useTransition } from "react";
import { CalendarPlus, Megaphone, Plus } from "lucide-react";
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
  createExamination,
  createExamSchedule,
  togglePublishExam,
} from "@/features/examinations/actions";

const EXAM_TYPES = [
  { value: "unit_test", label: "Unit Test" },
  { value: "midterm", label: "Midterm" },
  { value: "final", label: "Final" },
  { value: "practical", label: "Practical" },
  { value: "assignment", label: "Assignment" },
] as const;

export function ExamForm() {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [type, setType] = useState<(typeof EXAM_TYPES)[number]["value"]>("unit_test");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const submit = () => {
    if (!name || !startDate || !endDate) {
      toast.error("Fill in name and dates");
      return;
    }
    startTransition(async () => {
      const result = await createExamination({ name, type, startDate, endDate });
      if (result.error) toast.error(result.error);
      if (result.success) {
        toast.success(result.success);
        setName("");
      }
    });
  };

  return (
    <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <div className="space-y-1.5 lg:col-span-2">
        <Label>Examination name</Label>
        <Input
          placeholder="Unit Test 3"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Type</Label>
        <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EXAM_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Start date</Label>
        <Input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label>End date</Label>
        <Input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </div>
      <Button
        onClick={submit}
        disabled={isPending}
        className="rounded-full lg:col-start-5"
      >
        <Plus className="size-4" />
        {isPending ? "Creating..." : "Create Exam"}
      </Button>
    </div>
  );
}

export function ScheduleForm({
  examinationId,
  classes,
  subjects,
}: {
  examinationId: string;
  classes: { id: string; name: string }[];
  subjects: { id: string; name: string }[];
}) {
  const [isPending, startTransition] = useTransition();
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [date, setDate] = useState("");
  const [totalMarks, setTotalMarks] = useState("100");
  const [passingMarks, setPassingMarks] = useState("33");

  const submit = () => {
    if (!classId || !subjectId || !date) {
      toast.error("Choose class, subject and date");
      return;
    }
    startTransition(async () => {
      const result = await createExamSchedule({
        examinationId,
        classId,
        subjectId,
        date,
        totalMarks: Number(totalMarks),
        passingMarks: Number(passingMarks),
      });
      if (result.error) toast.error(result.error);
      if (result.success) toast.success(result.success);
    });
  };

  return (
    <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-6">
      <div className="space-y-1.5">
        <Label>Class</Label>
        <Select value={classId} onValueChange={setClassId}>
          <SelectTrigger>
            <SelectValue placeholder="Class" />
          </SelectTrigger>
          <SelectContent>
            {classes.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
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
        <Label>Date</Label>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>Total marks</Label>
        <Input
          type="number"
          value={totalMarks}
          onChange={(e) => setTotalMarks(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Passing</Label>
        <Input
          type="number"
          value={passingMarks}
          onChange={(e) => setPassingMarks(e.target.value)}
        />
      </div>
      <Button onClick={submit} disabled={isPending} className="rounded-full">
        <CalendarPlus className="size-4" />
        {isPending ? "Adding..." : "Add Schedule"}
      </Button>
    </div>
  );
}

export function PublishToggle({
  examinationId,
  isPublished,
}: {
  examinationId: string;
  isPublished: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  return (
    <Button
      variant={isPublished ? "outline" : "default"}
      className="rounded-full"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const result = await togglePublishExam(examinationId);
          if (result.error) toast.error(result.error);
          if (result.success) toast.success(result.success);
        })
      }
    >
      <Megaphone className="size-4" />
      {isPending
        ? "Working..."
        : isPublished
          ? "Unpublish Results"
          : "Publish Results"}
    </Button>
  );
}
