"use client";

import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { Pin } from "lucide-react";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { EmptyState } from "@/components/shared/empty-state";
import type { PriorityLevel } from "@/lib/generated/prisma/enums";

export interface TaskItem {
  id: string;
  title: string;
  meta?: string;
  priority: PriorityLevel;
  pinned?: boolean;
  timestamp?: string; // ISO
}

/** Task/announcement list with priority pills (Image 1 style). */
export function UpcomingTasks({ items }: { items: TaskItem[] }) {
  if (items.length === 0) {
    return <EmptyState title="Nothing pending" description="You're all caught up." />;
  }
  return (
    <ul className="space-y-2">
      {items.map((item, index) => (
        <motion.li
          key={item.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05, duration: 0.25 }}
          className="flex items-center gap-3 rounded-2xl bg-secondary/60 px-4 py-3"
        >
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 truncate text-sm font-semibold">
              {item.pinned && <Pin className="size-3.5 shrink-0 text-warning" />}
              {item.title}
            </p>
            {(item.meta || item.timestamp) && (
              <p className="truncate text-xs text-muted-foreground">
                {item.meta}
                {item.meta && item.timestamp && " • "}
                {item.timestamp &&
                  formatDistanceToNow(new Date(item.timestamp), {
                    addSuffix: true,
                  })}
              </p>
            )}
          </div>
          <PriorityBadge priority={item.priority} />
        </motion.li>
      ))}
    </ul>
  );
}
