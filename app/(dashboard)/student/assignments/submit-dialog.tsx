"use client";

import { useState, useTransition } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { submitAssignment } from "@/features/assignments/actions";

export function SubmitDialog({
  assignmentId,
  title,
  existingContent,
}: {
  assignmentId: string;
  title: string;
  existingContent?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [content, setContent] = useState(existingContent ?? "");

  const submit = () => {
    startTransition(async () => {
      const result = await submitAssignment({ assignmentId, content });
      if (result.error) toast.error(result.error);
      if (result.success) {
        toast.success(result.success);
        setOpen(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="rounded-full" variant={existingContent ? "outline" : "default"}>
          <Send className="size-4" />
          {existingContent ? "Edit Submission" : "Submit"}
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-strong rounded-3xl">
        <DialogHeader>
          <DialogTitle>Submit — {title}</DialogTitle>
          <DialogDescription>
            Type your answer or notes for the teacher.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          rows={6}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your submission..."
        />
        <Button
          onClick={submit}
          disabled={isPending || !content.trim()}
          className="rounded-full"
        >
          {isPending ? "Submitting..." : "Submit Assignment"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
