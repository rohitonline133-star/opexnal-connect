import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Archive, Trash2, Clock, Radio, Image as ImageIcon, ChevronLeft, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { apiUrl } from "@/lib/api-client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/archive")({
  head: () => ({
    meta: [
      { title: "Archive & Recently Deleted — Opexnal" },
      {
        name: "description",
        content: "Review archived posts and deletion status for your Opexnal content.",
      },
    ],
  }),
  component: ArchivePage,
});

type ArchiveTab = "posts" | "stories" | "live" | "recently_deleted";
type ArchivedPost = {
  id: string;
  caption: string;
  media_type: "image" | "video" | "text";
  created_at: string;
  archived_at: string;
};

export function ArchivePage() {
  const [activeTab, setActiveTab] = useState<ArchiveTab>("posts");
  const [posts, setPosts] = useState<ArchivedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const tabs = [
    { id: "posts", label: "Posts", icon: ImageIcon },
    { id: "stories", label: "Stories", icon: Clock },
    { id: "live", label: "Live", icon: Radio },
    { id: "recently_deleted", label: "Deleted", icon: Trash2 },
  ] as const;

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await fetch(apiUrl("/api/v1/posts/archive"), {
          headers: authClient.getAuthHeader(),
          cache: "no-store",
        });
        const payload = (await response.json().catch(() => ({}))) as {
          error?: string;
          posts?: ArchivedPost[];
        };
        if (!response.ok) throw new Error(payload.error || "Could not load your archive.");
        if (active) setPosts(payload.posts || []);
      } catch (error) {
        if (active) toast.error(error instanceof Error ? error.message : "Could not load your archive.");
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, []);

  const restorePost = async (postId: string) => {
    setRestoringId(postId);
    try {
      const response = await fetch(apiUrl(`/api/v1/posts/${encodeURIComponent(postId)}/archive`), {
        method: "PATCH",
        headers: { ...authClient.getAuthHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({ restore: true }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Could not restore this post.");
      setPosts((current) => current.filter((post) => post.id !== postId));
      toast.success("Post restored to your feed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not restore this post.");
    } finally {
      setRestoringId(null);
    }
  };

  const emptyStates = {
    stories: {
      title: "Story Archive is not connected",
      description: "Expired stories are not currently being saved to an archive.",
      icon: Clock,
    },
    live: {
      title: "Live Archive is not connected",
      description: "Live broadcasts are not currently being saved here.",
      icon: Radio,
    },
    recently_deleted: {
      title: "Recently Deleted is not connected",
      description: "Post deletion currently removes posts immediately. Deleted posts cannot be restored from this page.",
      icon: Trash2,
    },
  } as const;

  return (
    <AppShell
      header={
        <ScreenHeader
          title="Archive & Deleted"
          left={
            <Link to="/settings" aria-label="Back" className="text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-5 w-5" />
            </Link>
          }
        />
      }
    >
      <div className="max-w-md mx-auto px-4 py-4 space-y-4">
        <div className="flex bg-surface border border-border p-1 rounded-2xl gap-1">
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl transition-all",
                  activeTab === tab.id
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <TabIcon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {activeTab === "posts" ? (
          <div className="space-y-3">
            {loading ? (
              <p className="text-center text-sm text-muted-foreground py-10">Loading archived posts…</p>
            ) : posts.length ? (
              posts.map((post) => (
                <article key={post.id} className="rounded-2xl border border-border bg-card p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <Archive className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium line-clamp-3">{post.caption || "No caption"}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Archived {new Date(post.archived_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="w-full"
                    disabled={restoringId === post.id}
                    onClick={() => void restorePost(post.id)}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    {restoringId === post.id ? "Restoring…" : "Restore post"}
                  </Button>
                </article>
              ))
            ) : (
              <div className="text-center py-12 bg-card border border-border rounded-3xl p-6">
                <Archive className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-xs font-semibold text-foreground">No archived posts</p>
                <p className="text-[11px] text-muted-foreground mt-1">Posts you archive will appear here. You can restore them to your feed at any time.</p>
              </div>
            )}
          </div>
        ) : (
          (() => {
            const state = emptyStates[activeTab];
            const Icon = state.icon;
            return (
              <div className="text-center py-12 bg-card border border-border rounded-3xl p-6">
                <Icon className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-xs font-semibold text-foreground">{state.title}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{state.description}</p>
              </div>
            );
          })()
        )}
      </div>
    </AppShell>
  );
}
