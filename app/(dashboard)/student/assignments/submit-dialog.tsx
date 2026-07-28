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
import {
  FileUpload,
  type UploadedAttachment,
} from "@/components/forms/file-upload";

export function SubmitDialog({
  assignmentId,
  title,
  existingContent,
  existingAttachments = [],
}: {
  assignmentId: string;
  title: string;
  existingContent?: string | null;
  existingAttachments?: UploadedAttachment[];
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [content, setContent] = useState(existingContent ?? "");
  const [attachments, setAttachments] =
    useState<UploadedAttachment[]>(existingAttachments);
  const hasSubmission =
    Boolean(existingContent) || existingAttachments.length > 0;

  const submit = () => {
    startTransition(async () => {
      const result = await submitAssignment({
        assignmentId,
        content,
        attachmentUrls: attachments.map((a) => a.url),
      });
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
        <Button
          size="sm"
          className="rounded-full"
          variant={hasSubmission ? "outline" : "default"}
        >
          <Send className="size-4" />
          {hasSubmission ? "Edit Submission" : "Submit"}
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-strong rounded-3xl">
        <DialogHeader>
          <DialogTitle>Submit — {title}</DialogTitle>
          <DialogDescription>
            Type your answer, or attach a photo of your work / a PDF.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          rows={5}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your submission..."
        />
        <FileUpload
          attachments={attachments}
          onChange={setAttachments}
          disabled={isPending}
        />
        <Button
          onClick={submit}
          disabled={isPending || (!content.trim() && attachments.length === 0)}
          className="rounded-full"
        >
          {isPending ? "Submitting..." : "Submit Assignment"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
