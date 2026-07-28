import { cn } from "@/lib/utils";

/** Frosted-glass card (Image 1 style): white 85% + backdrop blur, 20px radius. */
export function GlassmorphicCard({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "glass-strong rounded-3xl p-6 transition-shadow hover:shadow-lg hover:shadow-primary/10",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
