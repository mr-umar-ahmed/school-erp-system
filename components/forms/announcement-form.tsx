"use client";

import { useState, useTransition } from "react";
import { Megaphone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { createAnnouncement } from "@/features/communication/actions";
import {
  FileUpload,
  type UploadedAttachment,
} from "@/components/forms/file-upload";

const ROLES = [
  { value: "teacher", label: "Teachers" },
  { value: "student", label: "Students" },
  { value: "parent", label: "Parents" },
  { value: "staff", label: "Staff" },
] as const;

export function AnnouncementForm() {
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [targetRoles, setTargetRoles] = useState<string[]>([]);
  const [isPinned, setIsPinned] = useState(false);
  const [attachments, setAttachments] = useState<UploadedAttachment[]>([]);

  const submit = () => {
    startTransition(async () => {
      const result = await createAnnouncement({
        title,
        content,
        priority,
        targetRoles: targetRoles as ("teacher" | "student" | "parent" | "staff")[],
        isPinned,
        attachmentUrls: attachments.map((a) => a.url),
      });
      if (result.error) toast.error(result.error);
      if (result.success) {
        toast.success(result.success);
        setTitle("");
        setContent("");
        setTargetRoles([]);
        setIsPinned(false);
        setAttachments([]);
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Title</Label>
          <Input
            placeholder="Sports day announcement"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Priority</Label>
          <Select
            value={priority}
            onValueChange={(v) => setPriority(v as typeof priority)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Content</Label>
        <Textarea
          rows={3}
          placeholder="Write the announcement..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Attachments</Label>
        <FileUpload
          attachments={attachments}
          onChange={setAttachments}
          disabled={isPending}
        />
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <span className="text-sm font-medium">Audience:</span>
        {ROLES.map((role) => (
          <label key={role.value} className="flex items-center gap-1.5 text-sm">
            <Checkbox
              checked={targetRoles.includes(role.value)}
              onCheckedChange={(v) =>
                setTargetRoles((prev) =>
                  v === true
                    ? [...prev, role.value]
                    : prev.filter((r) => r !== role.value)
                )
              }
            />
            {role.label}
          </label>
        ))}
        <span className="text-xs text-muted-foreground">
          (none selected = everyone)
        </span>
        <label className="ml-auto flex items-center gap-1.5 text-sm">
          <Checkbox
            checked={isPinned}
            onCheckedChange={(v) => setIsPinned(v === true)}
          />
          Pin to top
        </label>
      </div>
      <Button onClick={submit} disabled={isPending} className="rounded-full">
        <Megaphone className="size-4" />
        {isPending ? "Publishing..." : "Publish Announcement"}
      </Button>
    </div>
  );
}
