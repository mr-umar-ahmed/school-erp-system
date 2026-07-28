"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { TrendingDown, TrendingUp } from "lucide-react";
import { ModuleIcon } from "@/components/shared/module-icon";
import { ICONS, type IconName } from "@/components/shared/icon-map";
import { cn } from "@/lib/utils";

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const raf = useRef<number>(0);

  useEffect(() => {
    const duration = 900;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(value * eased));
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [value]);

  return <>{display.toLocaleString("en-IN")}</>;
}

/** Glassmorphism stat card with animated counter, trend and progress bar. */
export function StatCard({
  icon,
  label,
  value,
  prefix,
  suffix,
  trend,
  trendLabel,
  progress,
  className,
}: {
  icon: IconName;
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  trend?: number; // percent, negative = down
  trendLabel?: string;
  progress?: number; // 0-100
  className?: string;
}) {
  const trendUp = (trend ?? 0) >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      whileHover={{ scale: 1.02 }}
      className={cn(
        "glass-strong rounded-3xl p-5 transition-shadow hover:shadow-lg hover:shadow-primary/10",
        className
      )}
    >
      <ModuleIcon icon={ICONS[icon]} />
      <p className="mt-4 text-3xl font-extrabold tabular-nums">
        {prefix}
        <AnimatedNumber value={value} />
        {suffix}
      </p>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      {trend !== undefined && (
        <p
          className={cn(
            "mt-1 flex items-center gap-1 text-xs font-semibold",
            trendUp ? "text-success" : "text-destructive"
          )}
        >
          {trendUp ? (
            <TrendingUp className="size-3.5" />
          ) : (
            <TrendingDown className="size-3.5" />
          )}
          {trendUp ? "+" : ""}
          {trend}% {trendLabel ?? "from last month"}
        </p>
      )}
      {progress !== undefined && (
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary to-success"
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          />
        </div>
      )}
    </motion.div>
  );
}
