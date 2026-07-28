import { formatDistanceToNow } from "date-fns";
import { Pin } from "lucide-react";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { AttachmentList } from "@/components/shared/attachment-list";
import type { PriorityLevel } from "@/lib/generated/prisma/enums";

export interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  priority: PriorityLevel;
  isPinned: boolean;
  publishedAt: string;
  author: string;
  attachmentUrls?: string[];
}

export function AnnouncementFeed({ items }: { items: AnnouncementItem[] }) {
  if (items.length === 0) {
    return <EmptyState title="No announcements yet" />;
  }
  return (
    <ul className="space-y-3">
      {items.map((a) => (
        <li key={a.id} className="glass-strong rounded-3xl p-5">
          <div className="flex items-start justify-between gap-3">
            <h3 className="flex items-center gap-2 font-heading text-base font-bold">
              {a.isPinned && <Pin className="size-4 shrink-0 text-warning" />}
              {a.title}
            </h3>
            <PriorityBadge priority={a.priority} />
          </div>
          <p className="mt-2 text-sm text-secondary-foreground">{a.content}</p>
          <AttachmentList urls={a.attachmentUrls ?? []} className="mt-3" />
          <p className="mt-3 text-xs text-muted-foreground">
            {a.author} •{" "}
            {formatDistanceToNow(new Date(a.publishedAt), { addSuffix: true })}
          </p>
        </li>
      ))}
    </ul>
  );
}
