import { useState } from "react";
import { cn } from "@/lib/utils";
import { type PostMediaRow } from "@/lib/posts";
import { useSignedMediaUrl } from "@/hooks/use-signed-media-url";

export function MediaThumb({
  media,
  className,
  alt,
}: {
  media: PostMediaRow | undefined;
  className?: string;
  alt: string;
}) {
  const url = useSignedMediaUrl(media?.storage_path);
  if (!media) return <div className={cn("bg-secondary", className)} />;
  if (!url) return <div className={cn("animate-pulse bg-secondary", className)} />;
  return media.media_type === "video" ? (
    <video
      src={url}
      className={cn("object-cover", className)}
      muted
      playsInline
      preload="metadata"
    />
  ) : (
    <img src={url} alt={alt} loading="lazy" className={cn("object-cover", className)} />
  );
}

export function MediaCarousel({ media, alt }: { media: PostMediaRow[]; alt: string }) {
  const [index, setIndex] = useState(0);
  const current = media[Math.min(index, media.length - 1)];
  const url = useSignedMediaUrl(current?.storage_path);

  if (media.length === 0) return null;

  return (
    <div className="relative aspect-square w-full overflow-hidden bg-secondary">
      {url ? (
        current?.media_type === "video" ? (
          <video
            src={url}
            className="h-full w-full object-cover"
            controls
            playsInline
            preload="metadata"
          />
        ) : (
          <img src={url} alt={alt} className="h-full w-full object-cover" />
        )
      ) : (
        <div className="h-full w-full animate-pulse bg-secondary" />
      )}

      {media.length > 1 && (
        <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-1.5">
          {media.map((m, i) => (
            <button
              key={m.id}
              type="button"
              aria-label={`Show media ${i + 1}`}
              onClick={() => setIndex(i)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === index ? "w-4 bg-primary" : "w-1.5 bg-muted-foreground/60",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
