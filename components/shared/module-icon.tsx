import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: { box: "size-9 rounded-xl", icon: "size-4" },
  md: { box: "size-12 rounded-2xl", icon: "size-5" },
  lg: { box: "size-16 rounded-2xl", icon: "size-8" },
} as const;

/**
 * Glassmorphism icon wrapper (Image 5 style): frosted green gradient
 * container with a dual-tone glyph.
 */
export function ModuleIcon({
  icon: Icon,
  size = "md",
  className,
}: {
  icon: LucideIcon;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const s = SIZES[size];
  return (
    <span
      className={cn(
        "glass-icon flex shrink-0 items-center justify-center text-foreground",
        s.box,
        className
      )}
    >
      <Icon className={s.icon} strokeWidth={2.2} />
    </span>
  );
}
