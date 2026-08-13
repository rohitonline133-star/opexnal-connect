import { cn } from "@/lib/utils";

export function OpexnalWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-bold tracking-tight", className)}>
      <span className="brand-gradient-text">Opex</span>
      <span className="text-foreground">nal</span>
    </span>
  );
}

export function OpexnalMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex items-center justify-center rounded-2xl brand-gradient-bg text-primary-foreground shadow-[var(--shadow-brand)]",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className="h-1/2 w-1/2" fill="none" stroke="currentColor">
        <circle cx="12" cy="12" r="8" strokeWidth="2.4" />
        <circle cx="12" cy="12" r="2.6" fill="currentColor" stroke="none" />
      </svg>
    </span>
  );
}
