"use client";

/** Shared Recharts tooltip styled with theme tokens. */
export function ChartTooltip({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number | string; color?: string }[];
  label?: string;
  formatter?: (value: number | string) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-popover px-3 py-2 text-xs shadow-lg">
      {label && <p className="mb-1 font-bold text-popover-foreground">{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} className="flex items-center gap-1.5 text-popover-foreground">
          <span
            className="size-2 rounded-full"
            style={{ background: entry.color }}
          />
          {entry.name}:{" "}
          <span className="font-semibold tabular-nums">
            {formatter ? formatter(entry.value ?? "") : entry.value}
          </span>
        </p>
      ))}
    </div>
  );
}
