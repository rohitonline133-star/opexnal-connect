import { useEffect, useState } from "react";
import { resolveMediaUrl } from "@/lib/posts";

export function useSignedMediaUrl(path: string | null | undefined) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    if (!path) {
      setUrl(null);
      return;
    }
    resolveMediaUrl(path)
      .then((next) => active && setUrl(next))
      .catch(() => active && setUrl(null));
    return () => {
      active = false;
    };
  }, [path]);
  return url;
}
