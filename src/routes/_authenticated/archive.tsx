import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Archive,
  Trash2,
  RotateCcw,
  Clock,
  Film,
  Radio,
  Image as ImageIcon,
  ChevronLeft,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { getStoredSettings, saveSettings, type RecentlyDeletedItem } from "@/lib/settings-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/archive")({
  head: () => ({
    meta: [
      { title: "Archive & Recently Deleted — Opexnal" },
      {
        name: "description",
        content:
          "View your archived posts, stories, live broadcasts and restore recently deleted media.",
      },
    ],
  }),
  component: ArchivePage,
});

type ArchiveTab = "posts" | "stories" | "live" | "recently_deleted";

export function ArchivePage() {
  const [activeTab, setActiveTab] = useState<ArchiveTab>("posts");

  // Mock initial archive items
  const [archivedPosts, setArchivedPosts] = useState([
    {
      id: "arc-p1",
      caption: "Early morning mountain summit snapshot 🏔️",
      date: "Aug 14, 2024",
      likes: 142,
      imageUrl:
        "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&auto=format&fit=crop&q=80",
    },
    {
      id: "arc-p2",
      caption: "Coffee roaster setup test run ☕",
      date: "Sep 02, 2024",
      likes: 89,
      imageUrl:
        "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&auto=format&fit=crop&q=80",
    },
  ]);

  const [archivedStories, setArchivedStories] = useState([
    {
      id: "arc-s1",
      date: "Sep 20, 2024",
      caption: "Behind the lens 📷",
      imageUrl:
        "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&auto=format&fit=crop&q=80",
    },
    {
      id: "arc-s2",
      date: "Sep 18, 2024",
      caption: "Studio mood board ✨",
      imageUrl:
        "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=600&auto=format&fit=crop&q=80",
    },
  ]);

  const [archivedLives, setArchivedLives] = useState([
    {
      id: "arc-l1",
      title: "Weekend Community Q&A & Product Drop",
      date: "Sep 15, 2024",
      duration: "24:18",
      viewers: 284,
    },
  ]);

  // Recently deleted items from store
  const [recentlyDeleted, setRecentlyDeleted] = useState<RecentlyDeletedItem[]>(() => {
    return getStoredSettings().recentlyDeletedItems || [];
  });

  const [itemToRestore, setItemToRestore] = useState<RecentlyDeletedItem | null>(null);
  const [itemToDeleteForever, setItemToDeleteForever] = useState<RecentlyDeletedItem | null>(null);

  const handleRestore = (item: RecentlyDeletedItem) => {
    const updated = recentlyDeleted.filter((x) => x.id !== item.id);
    setRecentlyDeleted(updated);
    saveSettings({ recentlyDeletedItems: updated });
    setItemToRestore(null);
    toast.success(`Restored ${item.type} "${item.title}" to active profile!`);
  };

  const handlePermanentDelete = (item: RecentlyDeletedItem) => {
    const updated = recentlyDeleted.filter((x) => x.id !== item.id);
    setRecentlyDeleted(updated);
    saveSettings({ recentlyDeletedItems: updated });
    setItemToDeleteForever(null);
    toast.success(`Permanently deleted ${item.type}. It cannot be recovered.`);
  };

  const handleUnarchivePost = (postId: string) => {
    setArchivedPosts((prev) => prev.filter((p) => p.id !== postId));
    toast.success("Post restored to public profile grid!");
  };

  return (
    <AppShell
      header={
        <ScreenHeader
          title="Archive & Deleted"
          left={
            <Link
              to="/settings"
              aria-label="Back"
              className="text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
          }
        />
      }
    >
      <div className="max-w-md mx-auto px-4 py-4 space-y-4">
        {/* Navigation Tabs */}
        <div className="flex bg-surface border border-border p-1 rounded-2xl gap-1">
          {(
            [
              { id: "posts", label: "Posts", icon: ImageIcon },
              { id: "stories", label: "Stories", icon: Clock },
              { id: "live", label: "Live", icon: Radio },
              { id: "recently_deleted", label: "Deleted", icon: Trash2 },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
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
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ============================================================== */}
        {/* 1. POSTS ARCHIVE */}
        {/* ============================================================== */}
        {activeTab === "posts" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <p className="text-xs font-semibold text-muted-foreground">
                Archived Posts ({archivedPosts.length})
              </p>
              <span className="text-[11px] text-muted-foreground">Only visible to you</span>
            </div>

            {archivedPosts.length === 0 ? (
              <div className="text-center py-12 bg-card border border-border rounded-3xl p-6">
                <Archive className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-xs font-semibold text-foreground">No Archived Posts</p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Posts you archive from your profile will appear here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {archivedPosts.map((post) => (
                  <div
                    key={post.id}
                    className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col justify-between shadow-xs"
                  >
                    <div className="aspect-square bg-zinc-900 relative">
                      <img
                        src={post.imageUrl}
                        alt={post.caption}
                        className="w-full h-full object-cover"
                      />
                      <Badge className="absolute top-2 right-2 bg-black/60 backdrop-blur text-[10px] border-0">
                        {post.date}
                      </Badge>
                    </div>
                    <div className="p-3 space-y-2">
                      <p className="text-xs line-clamp-2 text-foreground font-medium">
                        {post.caption}
                      </p>
                      <Button
                        size="sm"
                        variant="surface"
                        onClick={() => handleUnarchivePost(post.id)}
                        className="w-full text-xs h-8 rounded-xl"
                      >
                        Show on Profile
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* 2. STORIES ARCHIVE */}
        {/* ============================================================== */}
        {activeTab === "stories" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <p className="text-xs font-semibold text-muted-foreground">
                Stories Archive ({archivedStories.length})
              </p>
              <span className="text-[11px] text-muted-foreground">Saved after 24 hours</span>
            </div>

            {archivedStories.length === 0 ? (
              <div className="text-center py-12 bg-card border border-border rounded-3xl p-6">
                <Clock className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-xs font-semibold text-foreground">No Stories in Archive</p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Your expired stories will be automatically preserved here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {archivedStories.map((s) => (
                  <div
                    key={s.id}
                    className="aspect-9/16 rounded-2xl overflow-hidden relative bg-zinc-900 border border-border shadow-xs group"
                  >
                    <img
                      src={s.imageUrl}
                      alt={s.caption}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-2">
                      <p className="text-[10px] text-white font-semibold">{s.date}</p>
                      <p className="text-[9px] text-white/70 truncate">{s.caption}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* 3. LIVE ARCHIVE */}
        {/* ============================================================== */}
        {activeTab === "live" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <p className="text-xs font-semibold text-muted-foreground">
                Live Broadcast Archive ({archivedLives.length})
              </p>
            </div>

            {archivedLives.length === 0 ? (
              <div className="text-center py-12 bg-card border border-border rounded-3xl p-6">
                <Radio className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-xs font-semibold text-foreground">No Live Broadcasts</p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Saved live streams will appear here for 30 days.
                </p>
                <Button
                  asChild
                  size="sm"
                  className="mt-3 brand-gradient-bg text-white rounded-xl text-xs"
                >
                  <Link to="/live">Go Live Now</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {archivedLives.map((l) => (
                  <div
                    key={l.id}
                    className="p-3.5 bg-card border border-border rounded-2xl flex items-center justify-between shadow-xs"
                  >
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-foreground">{l.title}</p>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span>{l.date}</span>
                        <span>•</span>
                        <span>Duration: {l.duration}</span>
                        <span>•</span>
                        <span>{l.viewers} viewers</span>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">
                      Saved
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* 4. RECENTLY DELETED */}
        {/* ============================================================== */}
        {activeTab === "recently_deleted" && (
          <div className="space-y-3">
            <div className="p-3 bg-amber-950/20 border border-amber-800/40 rounded-2xl text-[11px] text-amber-200">
              Items in Recently Deleted are automatically permanently deleted after 30 days. Only
              you can view or restore them.
            </div>

            {recentlyDeleted.length === 0 ? (
              <div className="text-center py-12 bg-card border border-border rounded-3xl p-6">
                <Trash2 className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-xs font-semibold text-foreground">Recently Deleted is Empty</p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Deleted photos, reels, and stories will appear here for 30 days.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentlyDeleted.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 bg-card border border-border rounded-2xl flex items-center justify-between shadow-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[9px] uppercase font-bold">
                          {item.type}
                        </Badge>
                        <p className="text-xs font-semibold text-foreground">{item.title}</p>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Deleted {item.deletedAt} •{" "}
                        <span className="text-amber-500 font-medium">
                          {item.daysRemaining} days left
                        </span>
                      </p>
                    </div>

                    <div className="flex gap-1.5">
                      <Button
                        size="sm"
                        variant="surface"
                        onClick={() => setItemToRestore(item)}
                        className="h-8 px-2.5 rounded-xl text-xs"
                        aria-label="Restore item"
                      >
                        <RotateCcw className="h-3.5 w-3.5 mr-1" />
                        Restore
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setItemToDeleteForever(item)}
                        className="h-8 px-2.5 rounded-xl text-xs"
                        aria-label="Delete item permanently"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Restore Confirmation Dialog */}
      <Dialog open={Boolean(itemToRestore)} onOpenChange={() => setItemToRestore(null)}>
        <DialogContent className="max-w-xs rounded-3xl p-5 bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-primary" />
              Restore {itemToRestore?.type}?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              &ldquo;{itemToRestore?.title}&rdquo; will be restored to your profile feed and visible
              to your followers again.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 pt-3">
            <Button
              variant="surface"
              onClick={() => setItemToRestore(null)}
              className="flex-1 text-xs rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={() => itemToRestore && handleRestore(itemToRestore)}
              className="flex-1 text-xs rounded-xl brand-gradient-bg text-white font-semibold"
            >
              Confirm Restore
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Forever Dialog */}
      <Dialog open={Boolean(itemToDeleteForever)} onOpenChange={() => setItemToDeleteForever(null)}>
        <DialogContent className="max-w-xs rounded-3xl p-5 bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-destructive flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Delete Permanently?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              Are you sure? This cannot be undone. &ldquo;{itemToDeleteForever?.title}&rdquo; will
              be erased forever from your account and cloud storage.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 pt-3">
            <Button
              variant="surface"
              onClick={() => setItemToDeleteForever(null)}
              className="flex-1 text-xs rounded-xl"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => itemToDeleteForever && handlePermanentDelete(itemToDeleteForever)}
              className="flex-1 text-xs rounded-xl font-semibold"
            >
              Delete Forever
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
