"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { NotebookPen } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createAssignment } from "@/features/assignments/actions";
import {
  FileUpload,
  type UploadedAttachment,
} from "@/components/forms/file-upload";

export function AssignmentForm({
  classSubjects,
}: {
  classSubjects: { id: string; label: string }[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [classSubjectId, setClassSubjectId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [maxMarks, setMaxMarks] = useState("20");
  const [attachments, setAttachments] = useState<UploadedAttachment[]>([]);

  const submit = () => {
    startTransition(async () => {
      const result = await createAssignment({
        title,
        description: description || undefined,
        classSubjectId,
        dueDate,
        maxMarks: maxMarks ? Number(maxMarks) : undefined,
        attachmentUrls: attachments.map((a) => a.url),
      });
      if (result.error) toast.error(result.error);
      if (result.success) {
        toast.success(result.success);
        router.push("/teacher/assignments");
      }
    });
  };

  return (
    <div className="glass-strong space-y-4 rounded-3xl p-6">
      <div className="space-y-1.5">
        <Label>Title</Label>
        <Input
          placeholder="Chapter 5 problem set"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Instructions</Label>
        <Textarea
          rows={3}
          placeholder="What should students do?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label>Class &amp; Subject</Label>
          <Select value={classSubjectId} onValueChange={setClassSubjectId}>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {classSubjects.map((cs) => (
                <SelectItem key={cs.id} value={cs.id}>
                  {cs.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Due date</Label>
          <Input
            type="datetime-local"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Max marks</Label>
          <Input
            type="number"
            value={maxMarks}
            onChange={(e) => setMaxMarks(e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Attachments</Label>
        <FileUpload
          attachments={attachments}
          onChange={setAttachments}
          disabled={isPending}
        />
        <p className="text-xs text-muted-foreground">
          Share the homework sheet as a PDF or snap a photo of it.
        </p>
      </div>
      <Button onClick={submit} disabled={isPending} className="rounded-full">
        <NotebookPen className="size-4" />
        {isPending ? "Creating..." : "Create Assignment"}
      </Button>
    </div>
  );
}
