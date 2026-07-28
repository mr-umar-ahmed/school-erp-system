"use client";

import { useRef, useState } from "react";
import { Camera, FileText, Loader2, Paperclip, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  MAX_ATTACHMENTS,
  MAX_FILE_SIZE,
  UPLOAD_ACCEPT,
  formatFileSize,
  isAllowedMimeType,
} from "@/lib/uploads";

export interface UploadedAttachment {
  url: string;
  name: string;
  mimeType: string;
}

/**
 * Attach PDFs / images to a form. Files upload immediately to /api/files;
 * the parent receives the stored URLs via onChange and saves them with the
 * record. "Take photo" opens the camera directly on mobile devices.
 */
export function FileUpload({
  attachments,
  onChange,
  maxFiles = MAX_ATTACHMENTS,
  disabled,
}: {
  attachments: UploadedAttachment[];
  onChange: (next: UploadedAttachment[]) => void;
  maxFiles?: number;
  disabled?: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);

  const upload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const room = maxFiles - attachments.length;
    const selected = Array.from(files).slice(0, room);
    if (selected.length < files.length) {
      toast.error(`You can attach up to ${maxFiles} files`);
    }
    let current = attachments;
    for (const file of selected) {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} is over 4 MB`);
        continue;
      }
      if (!isAllowedMimeType(file.type)) {
        toast.error(`${file.name}: only PDF, JPG, PNG or WebP`);
        continue;
      }
      setUploading((n) => n + 1);
      try {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch("/api/files", { method: "POST", body: form });
        const body = (await res.json()) as {
          url?: string;
          name?: string;
          mimeType?: string;
          error?: string;
        };
        if (!res.ok || !body.url) {
          toast.error(body.error ?? `Couldn't upload ${file.name}`);
        } else {
          current = [
            ...current,
            { url: body.url, name: body.name ?? file.name, mimeType: body.mimeType ?? file.type },
          ];
          onChange(current);
        }
      } catch {
        toast.error(`Couldn't upload ${file.name} — check your connection`);
      } finally {
        setUploading((n) => n - 1);
      }
    }
  };

  const remove = (url: string) =>
    onChange(attachments.filter((a) => a.url !== url));

  const busy = uploading > 0;
  const full = attachments.length >= maxFiles;

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept={UPLOAD_ACCEPT}
        multiple
        hidden
        onChange={(e) => {
          void upload(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        hidden
        onChange={(e) => {
          void upload(e.target.files);
          e.target.value = "";
        }}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-full"
          disabled={disabled || busy || full}
          onClick={() => fileInputRef.current?.click()}
        >
          {busy ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Paperclip className="size-4" />
          )}
          Attach PDF / image
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-full"
          disabled={disabled || busy || full}
          onClick={() => cameraInputRef.current?.click()}
        >
          <Camera className="size-4" />
          Take photo
        </Button>
        <span className="text-xs text-muted-foreground">
          up to {maxFiles} files, {formatFileSize(MAX_FILE_SIZE)} each
        </span>
      </div>
      {attachments.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {attachments.map((a) => (
            <li
              key={a.url}
              className="flex items-center gap-2 rounded-full bg-secondary/60 py-1 pl-1.5 pr-2 text-xs font-medium"
            >
              {a.mimeType.startsWith("image/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={a.url}
                  alt={a.name}
                  className="size-6 rounded-full object-cover"
                />
              ) : (
                <FileText className="size-4 text-primary" />
              )}
              <span className="max-w-40 truncate">{a.name}</span>
              <button
                type="button"
                aria-label={`Remove ${a.name}`}
                className="text-muted-foreground transition-colors hover:text-destructive"
                onClick={() => remove(a.url)}
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
