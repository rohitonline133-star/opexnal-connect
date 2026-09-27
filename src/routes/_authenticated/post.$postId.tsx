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

export const Route = createFileRoute("/_authenticated/post/$postId")({
  head: () => ({
    meta: [
      { title: "Post — Opexnal" },
      {
        name: "description",
        content: "View an Opexnal post, its media and conversation.",
      },
    ],
  }),
  component: PostDetailPage,
});

function PostDetailPage() {
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
      toast.success("Comment posted");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to post comment");
    },
  });

  return (
    <AppShell activeTab="home">
      <div className="mx-auto max-w-lg pb-24">
        <ScreenHeader title="Post" showBack />
        {postQuery.isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !postQuery.data ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Post not found.</div>
        ) : (
          <div className="space-y-4">
            <PostCard post={postQuery.data} />
            <div className="px-4">
              <h3 className="mb-3 text-sm font-semibold">
                Comments ({formatCount(commentsQuery.data?.length ?? 0)})
              </h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (body.trim()) mutation.mutate();
                }}
                className="mb-4 flex gap-2"
              >
                <Input
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Add a comment..."
                  className="bg-card text-sm"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={mutation.isPending || !body.trim()}
                  className="shrink-0"
                >
                  Post
                </Button>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
