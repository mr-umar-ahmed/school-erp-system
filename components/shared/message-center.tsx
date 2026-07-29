"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { MessageSquarePlus, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserAvatar } from "@/components/shared/user-avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { AttachmentList } from "@/components/shared/attachment-list";
import {
  FileUpload,
  type UploadedAttachment,
} from "@/components/forms/file-upload";
import { sendMessage } from "@/features/communication/actions";
import type { Conversation } from "@/features/communication/queries";
import { ROLE_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export interface ThreadMessage {
  id: string;
  content: string;
  subject: string | null;
  attachmentUrls?: string[];
  mine: boolean;
  createdAt: string;
}

export function MessageCenter({
  conversations,
  thread,
  activeUserId,
  activeName,
  recipients,
}: {
  conversations: Conversation[];
  thread: ThreadMessage[];
  activeUserId?: string;
  activeName?: string;
  recipients: { id: string; label: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [draft, setDraft] = useState("");
  const [composeTo, setComposeTo] = useState("");
  const [attachments, setAttachments] = useState<UploadedAttachment[]>([]);

  const openThread = (userId: string) =>
    router.push(`${pathname}?with=${userId}`);

  const send = (recipientId: string) => {
    if (!draft.trim() && attachments.length === 0) return;
    startTransition(async () => {
      const result = await sendMessage({
        recipientId,
        content: draft.trim(),
        attachmentUrls: attachments.map((a) => a.url),
      });
      if (result.error) toast.error(result.error);
      if (result.success) {
        setDraft("");
        setAttachments([]);
        router.refresh();
      }
    });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="glass-strong rounded-3xl p-4">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="flex-1 text-lg">Conversations</h2>
        </div>
        <div className="mb-3 flex gap-2">
          <Select value={composeTo} onValueChange={setComposeTo}>
            <SelectTrigger className="flex-1 rounded-full">
              <SelectValue placeholder="New message to..." />
            </SelectTrigger>
            <SelectContent>
              {recipients.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="icon"
            className="rounded-full"
            disabled={!composeTo}
            onClick={() => composeTo && openThread(composeTo)}
            aria-label="Start conversation"
          >
            <MessageSquarePlus className="size-4" />
          </Button>
        </div>
        {conversations.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">
            No conversations yet.
          </p>
        ) : (
          <ul className="space-y-1">
            {conversations.map((c) => {
              const [first, ...rest] = c.name.split(" ");
              return (
                <li key={c.userId}>
                  <button
                    onClick={() => openThread(c.userId)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors",
                      c.userId === activeUserId
                        ? "bg-primary/10"
                        : "hover:bg-accent/60"
                    )}
                  >
                    <UserAvatar
                      firstName={first}
                      lastName={rest.join(" ") || " "}
                      className="size-9"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">
                        {c.name}
                        <span className="ml-1.5 text-[10px] font-medium text-muted-foreground">
                          {ROLE_LABELS[c.role]}
                        </span>
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {c.lastMessage}
                      </span>
                    </span>
                    {c.unread > 0 && (
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                        {c.unread}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="glass-strong flex min-h-[24rem] flex-col rounded-3xl p-4 lg:col-span-2">
        {!activeUserId ? (
          <EmptyState
            title="Pick a conversation"
            description="Select a conversation or start a new one."
            className="flex-1 border-none bg-transparent"
          />
        ) : (
          <>
            <h2 className="border-b border-border pb-3 text-lg">
              {activeName}
            </h2>
            <div className="flex-1 space-y-3 overflow-y-auto py-4">
              {thread.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
                    m.mine
                      ? "ml-auto rounded-br-md bg-primary text-primary-foreground"
                      : "rounded-bl-md bg-secondary"
                  )}
                >
                  {m.subject && (
                    <p className="mb-0.5 text-xs font-bold opacity-80">
                      {m.subject}
                    </p>
                  )}
                  {m.content && <p>{m.content}</p>}
                  {m.attachmentUrls && m.attachmentUrls.length > 0 && (
                    <AttachmentList
                      urls={m.attachmentUrls}
                      tone={m.mine ? "on-primary" : "default"}
                      className={m.content ? "mt-2" : undefined}
                    />
                  )}
                  <p
                    className={cn(
                      "mt-1 text-[10px]",
                      m.mine
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                    )}
                  >
                    {formatDistanceToNow(new Date(m.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              ))}
            </div>
            <div className="space-y-2 border-t border-border pt-3">
              <div className="flex items-end gap-2">
                <Textarea
                  rows={2}
                  placeholder="Write a message..."
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  className="flex-1 resize-none"
                />
                <Button
                  size="icon"
                  className="rounded-full"
                  disabled={
                    isPending || (!draft.trim() && attachments.length === 0)
                  }
                  onClick={() => send(activeUserId)}
                  aria-label="Send message"
                >
                  <Send className="size-4" />
                </Button>
              </div>
              <FileUpload
                attachments={attachments}
                onChange={setAttachments}
                disabled={isPending}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
