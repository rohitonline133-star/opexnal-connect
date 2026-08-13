import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { resolveAvatarUrl } from "@/lib/profile";

type Props = {
  path?: string | null;
  fallback: string;
  className?: string;
  ring?: boolean;
  alt?: string;
};

export function ProfileAvatar({ path, fallback, className, ring, alt }: Props) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    resolveAvatarUrl(path)
      .then((next) => active && setUrl(next))
      .catch(() => active && setUrl(null));
    return () => {
      active = false;
    };
  }, [path]);

  const inner = (
    <div
      className={cn(
        "flex items-center justify-center overflow-hidden rounded-full bg-secondary text-sm font-semibold text-muted-foreground",
        className,
      )}
    >
      {url ? (
        <img src={url} alt={alt ?? "Profile photo"} className="h-full w-full object-cover" />
      ) : (
        <span aria-hidden="true">{fallback}</span>
      )}
    </div>
  );

  if (!ring) return inner;

  return (
    <div className="story-ring rounded-full p-[2px]">
      <div className="rounded-full bg-background p-[2px]">{inner}</div>
    </div>
  );
}
