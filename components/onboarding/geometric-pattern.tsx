/**
 * Decorative geometric background (Image 3 style): circles, dots and curved
 * lines rendered in the mint-green palette at low opacity.
 */
export function GeometricPattern({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className ?? ""}`}
    >
      <svg
        className="absolute -top-24 -left-24 size-96 text-primary/10"
        viewBox="0 0 400 400"
        fill="none"
      >
        <circle cx="200" cy="200" r="180" stroke="currentColor" strokeWidth="40" />
      </svg>
      <svg
        className="absolute top-1/4 -right-32 size-[28rem] text-primary/10"
        viewBox="0 0 400 400"
        fill="none"
      >
        <circle cx="200" cy="200" r="160" stroke="currentColor" strokeWidth="2" />
        <circle cx="200" cy="200" r="120" stroke="currentColor" strokeWidth="2" />
        <circle cx="200" cy="200" r="80" fill="currentColor" opacity="0.4" />
      </svg>
      <svg
        className="absolute -bottom-20 left-1/4 size-80 text-success/10"
        viewBox="0 0 400 400"
        fill="none"
      >
        <path
          d="M20 380 Q 200 20 380 380"
          stroke="currentColor"
          strokeWidth="3"
        />
        <path
          d="M60 380 Q 200 100 340 380"
          stroke="currentColor"
          strokeWidth="3"
        />
      </svg>
      {/* Dot grid */}
      <svg
        className="absolute bottom-16 right-16 size-40 text-primary/20"
        viewBox="0 0 120 120"
        fill="currentColor"
      >
        {Array.from({ length: 5 }).map((_, row) =>
          Array.from({ length: 5 }).map((_, col) => (
            <circle
              key={`${row}-${col}`}
              cx={12 + col * 24}
              cy={12 + row * 24}
              r="3"
            />
          ))
        )}
      </svg>
      <svg
        className="absolute top-16 left-1/3 size-32 text-warning/20"
        viewBox="0 0 100 100"
        fill="none"
      >
        <circle cx="50" cy="50" r="30" stroke="currentColor" strokeWidth="8" />
      </svg>
    </div>
  );
}
