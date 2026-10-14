import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";
import { PostCard } from "@/components/opexnal/post-card";
import { ProfileAvatar } from "@/components/opexnal/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession } from "@/hooks/use-session";
import { initialsFor } from "@/lib/profile";
import {
  addComment,
  deleteComment,
  formatCount,
  getComments,
  getPost,
  timeAgo,
  toggleCommentLike,
} from "@/lib/posts";

export const Route = createFileRoute("/_authenticated/p/$postId")({
  head: () => ({
    meta: [
      { title: "Post — Opexnal" },
      {
        name: "description",
        content: "View an Opexnal post, its media and the conversation around it.",
      },
      { property: "og:title", content: "Post — Opexnal" },
      {
        property: "og:description",
        content: "View an Opexnal post, its media and the conversation around it.",
      },
      { property: "og:type", content: "article" },
      { name: "robots", content: "noindex" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PostPage,
});

function PostPage() {
  const { postId } = Route.useParams();
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [body, setBody] = useState("");

  const postQuery = useQuery({
    queryKey: ["post", postId, user?.id],
    queryFn: () => getPost(postId, user?.id),
  });
  const commentsQuery = useQuery({
    queryKey: ["comments", postId, user?.id],
    queryFn: () => getComments(postId, user?.id),
  });

  const mutation = useMutation({
    mutationFn: () => addComment({ postId, userId: user!.id, body }),
    onSuccess: () => {
      setBody("");
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
    },
    onError: () => toast.error("Could not post your comment"),
  });

  const likeComment = useMutation({
    mutationFn: ({ id, liked }: { id: string; liked: boolean }) =>
      toggleCommentLike(id, user!.id, liked),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["comments", postId] }),
    onError: () => toast.error("Could not update the like"),
  });

  const removeComment = useMutation({
    mutationFn: (id: string) => deleteComment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
    },
    onError: () => toast.error("Could not delete the comment"),
  });

  const post = postQuery.data;

  return (
    <AppShell header={<ScreenHeader title="Post" />}>
      {postQuery.isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden="true" />
        </div>
      ) : !post ? (
        <p className="px-4 py-16 text-center text-sm text-muted-foreground">
          This post is unavailable.
        </p>
      ) : (
        <>
          <PostCard post={post} viewerId={user?.id ?? null} />

          <section className="space-y-4 px-4 py-4">
            {(commentsQuery.data ?? []).map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <ProfileAvatar
                  path={comment.author?.avatar_url ?? null}
                  fallback={comment.author ? initialsFor(comment.author) : "?"}
                  className="h-8 w-8"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    {comment.author?.username ? (
                      <Link
                        to="/u/$username"
                        params={{ username: comment.author.username }}
                        className="mr-1 font-semibold hover:underline"
                      >
                        {comment.author.username}
                      </Link>
                    ) : (
                      <span className="mr-1 font-semibold">user</span>
                    )}
                    {comment.body}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span suppressHydrationWarning>{timeAgo(comment.created_at)}</span>
                    {comment.likes_count > 0 && (
                      <span>{formatCount(comment.likes_count)} likes</span>
                    )}
                    {user && comment.user_id === user.id && (
                      <button
                        type="button"
                        className="hover:text-destructive"
                        onClick={() => removeComment.mutate(comment.id)}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
                {user && (
                  <button
                    type="button"
                    aria-label={comment.liked ? "Unlike comment" : "Like comment"}
                    className="pt-1 text-muted-foreground transition-colors hover:text-foreground"
                    onClick={() => likeComment.mutate({ id: comment.id, liked: comment.liked })}
                  >
                    <Heart
                      className={`h-4 w-4 ${comment.liked ? "fill-primary text-primary" : ""}`}
                      aria-hidden="true"
                    />
                  </button>
                )}
              </div>
            ))}
            {(commentsQuery.data ?? []).length === 0 && !commentsQuery.isLoading && (
              <p className="text-sm text-muted-foreground">No comments yet.</p>
            )}
          </section>

          {post.comments_enabled && user && (
            <form
              className="sticky bottom-20 flex items-center gap-2 border-t border-border bg-background px-4 py-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (body.trim()) mutation.mutate();
              }}
            >
              <Input
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={1000}
                placeholder="Add a comment…"
                aria-label="Add a comment"
              />
              <Button
                type="submit"
                variant="brand"
                size="sm"
                disabled={!body.trim() || mutation.isPending}
              >
                Post
              </Button>
            </form>
          )}
        </>
      )}
    </AppShell>
  );
}
