import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";
import { MediaThumb } from "@/components/opexnal/post-media";
import { useSession } from "@/hooks/use-session";
import { getPostsByHashtag } from "@/lib/posts";

export const Route = createFileRoute("/_authenticated/tag/$tag")({
  head: ({ params }) => ({
    meta: [
      { title: `#${params.tag} — Opexnal` },
      { name: "description", content: `Browse Opexnal posts tagged #${params.tag}.` },
      { property: "og:title", content: `#${params.tag} — Opexnal` },
      { property: "og:description", content: `Browse Opexnal posts tagged #${params.tag}.` },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TagPage,
});

function TagPage() {
  const { tag } = Route.useParams();
  const { user } = useSession();
  const { data, isLoading } = useQuery({
    queryKey: ["tag-posts", tag, user?.id],
    queryFn: () => getPostsByHashtag(tag, user?.id),
  });

  return (
    <AppShell header={<ScreenHeader title={`#${tag}`} />}>
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden="true" />
        </div>
      ) : (data ?? []).length === 0 ? (
        <p className="px-4 py-16 text-center text-sm text-muted-foreground">No posts with this hashtag yet.</p>
      ) : (
        <div className="grid grid-cols-3 gap-0.5 p-0.5">
          {(data ?? []).map((post) => (
            <Link key={post.id} to="/p/$postId" params={{ postId: post.id }} className="aspect-square">
              <MediaThumb media={post.media[0]} alt={post.caption || "Post"} className="h-full w-full" />
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
