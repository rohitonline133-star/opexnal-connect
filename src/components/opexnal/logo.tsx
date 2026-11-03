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
        "inline-flex items-center justify-center overflow-hidden rounded-2xl bg-black shadow-[var(--shadow-brand)]",
        className,
      )}
    >
      <img
        src="/branding/opexnal-logo.webp"
        alt=""
        className="h-full w-full object-contain"
        loading="eager"
      />
    </span>
  );
}

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
        src="/branding/opex-ai-eagle.webp"
        alt={alt}
        width={size}
        height={size}
        className="h-full w-full object-contain pointer-events-none"
        loading="eager"
      />
    </div>
  );
}
