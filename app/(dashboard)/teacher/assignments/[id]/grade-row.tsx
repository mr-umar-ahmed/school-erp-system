"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { gradeSubmission } from "@/features/assignments/actions";

export function GradeRow({
  submissionId,
  maxMarks,
  initialMarks,
  initialFeedback,
}: {
  submissionId: string;
  maxMarks: number | null;
  initialMarks: number | null;
  initialFeedback: string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [marks, setMarks] = useState(
    initialMarks === null ? "" : String(initialMarks)
  );
  const [feedback, setFeedback] = useState(initialFeedback ?? "");

  const save = () => {
    if (marks === "") {
      toast.error("Enter marks first");
      return;
    }
    startTransition(async () => {
      const result = await gradeSubmission({
        submissionId,
        marks: Number(marks),
        feedback: feedback || undefined,
      });
      if (result.error) toast.error(result.error);
      if (result.success) toast.success(result.success);
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        type="number"
        min={0}
        max={maxMarks ?? undefined}
        value={marks}
        onChange={(e) => setMarks(e.target.value)}
        placeholder={maxMarks ? `/ ${maxMarks}` : "Marks"}
        className="h-8 w-20 tabular-nums"
      />
      <Input
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder="Feedback"
        className="h-8 w-40"
      />
      <Button
        size="sm"
        variant="outline"
        className="rounded-full"
        disabled={isPending}
        onClick={save}
      >
        <Check className="size-4" />
        {isPending ? "..." : "Grade"}
      </Button>
    </div>
  );
}
