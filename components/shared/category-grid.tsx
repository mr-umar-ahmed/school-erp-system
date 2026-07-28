"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ModuleIcon } from "@/components/shared/module-icon";
import { ICONS, type IconName } from "@/components/shared/icon-map";
import { cn } from "@/lib/utils";

export interface CategoryItem {
  label: string;
  href: string;
  icon: IconName;
  hint?: string;
}

/** 2-column category module grid (Image 4 style). */
export function CategoryGrid({
  items,
  columns = 2,
  className,
}: {
  items: CategoryItem[];
  columns?: 2 | 3 | 4;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-3",
        columns === 2 && "grid-cols-2",
        columns === 3 && "grid-cols-2 sm:grid-cols-3",
        columns === 4 && "grid-cols-2 sm:grid-cols-4",
        className
      )}
    >
      {items.map((item, index) => (
        <motion.div
          key={item.href}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05, duration: 0.25 }}
        >
          <Link
            href={item.href}
            className="glass-strong flex flex-col items-center gap-2 rounded-2xl p-5 text-center transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10 active:scale-[0.97]"
          >
            <ModuleIcon icon={ICONS[item.icon]} size="lg" />
            <span className="text-sm font-semibold">{item.label}</span>
            {item.hint && (
              <span className="text-xs text-muted-foreground">{item.hint}</span>
            )}
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
