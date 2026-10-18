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

/**
 * Official Opex AI Eagle Logo
 * Displays the complete majestic eagle with both wings symmetrically spread,
 * preserving natural aspect ratio without distortion or cropping.
 */
export function OpexAiLogo({
  className,
  size = 32,
  alt = "Opex AI official eagle logo",
}: {
  className?: string;
  size?: number;
  alt?: string;
}) {
  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center overflow-hidden shrink-0 select-none",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <img
        src="/assets/opex-ai-eagle.svg"
        alt={alt}
        width={size}
        height={size}
        className="h-full w-full object-contain pointer-events-none"
        loading="eager"
      />
    </div>
  );
}
