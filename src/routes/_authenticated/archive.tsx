import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, Clock, Radio, Trash2, RotateCcw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";
import { getArchivedPosts, updatePost } from "@/lib/posts";

export const Route = createFileRoute("/_authenticated/archive")({
  head: () => ({
    meta: [
      { title: "Archive — Opexnal" },
      {
        name: "description",
        content: "Manage your archived Opexnal posts.",
      },
    ],
  }),
  component: ArchivePage,
});

function ArchivePage() {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const archivedQuery = useQuery({
    queryKey: ["archived-posts", user?.id],
    queryFn: getArchivedPosts,
    enabled: Boolean(user?.id),
    retry: 1,
  });

  const restoreMutation = useMutation({
    mutationFn: (postId: string) => updatePost(postId, { isArchived: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["archived-posts", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["home-feed", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["current-user-profile", user?.id] });
      toast.success("Post restored to your profile.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Could not restore this post.");
    },
  });

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-5 p-4 pb-24">
        <ScreenHeader title="Archive & Deleted" />
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Archive className="h-5 w-5" aria-hidden="true" />
            <h2 className="text-base font-semibold">Archived posts</h2>
          </div>
          {archivedQuery.isLoading ? (
            <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Loading your archived posts…
            </div>
          ) : archivedQuery.isError ? (
            <div className="rounded-xl border border-destructive/30 p-4">
              <p className="text-sm text-muted-foreground">
                Archived posts could not be loaded from the Opexnal server.
              </p>
              <Button className="mt-3" variant="outline" onClick={() => archivedQuery.refetch()}>
                Try again
              </Button>
            </div>
          ) : archivedQuery.data?.length ? (
            <div className="space-y-3">
              {archivedQuery.data.map((post) => (
                <article
                  key={post.id}
                  className="space-y-3 rounded-xl border border-border bg-card p-4"
                >
                  <p className="whitespace-pre-wrap break-words text-sm">
                    {post.caption ||
                      (post.media_type === "video"
                        ? "Archived video post"
                        : post.media_type === "image"
                          ? "Archived photo post"
                          : "Archived post")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Archived {new Date(post.archived_at).toLocaleString()} · {post.likes_count} likes
                    · {post.comments_count} comments
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={restoreMutation.isPending}
                    onClick={() => restoreMutation.mutate(post.id)}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
                    Restore post
                  </Button>
                </article>
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-border p-4 text-sm text-muted-foreground">
              You have no archived posts.
            </p>
          )}
        </section>
        <div className="space-y-3 border-t border-border pt-4">
          <div className="flex gap-3 rounded-xl border border-border p-4">
            <Clock className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <div>
              <h3 className="text-sm font-semibold">Story archive</h3>
              <p className="text-sm text-muted-foreground">
                Automatic story archiving and story restoration are not connected yet.
              </p>
            </div>
          </div>
          <div className="flex gap-3 rounded-xl border border-border p-4">
            <Radio className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <div>
              <h3 className="text-sm font-semibold">Live archive</h3>
              <p className="text-sm text-muted-foreground">
                Live broadcast recording and archive storage are not connected yet.
              </p>
            </div>
          </div>
          <div className="flex gap-3 rounded-xl border border-border p-4">
            <Trash2 className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <div>
              <h3 className="text-sm font-semibold">Recently deleted</h3>
              <p className="text-sm text-muted-foreground">
                A recoverable deleted-items area and timed restore workflow are not available.
                Deleted posts cannot currently be restored.
              </p>
            </div>
          </div>
        </div>
        <Button asChild variant="outline" className="w-full">
          <Link to="/home">Back to Home</Link>
        </Button>
      </div>
    </AppShell>
  );
}
