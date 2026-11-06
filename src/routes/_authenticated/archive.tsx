import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Archive, Trash2, Clock, Radio, Image as ImageIcon, ChevronLeft } from "lucide-react";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/archive")({
  head: () => ({
    meta: [
      { title: "Archive & Recently Deleted — Opexnal" },
      {
        name: "description",
        content: "Review archive availability and deletion status for your Opexnal content.",
      },
    ],
  }),
  component: ArchivePage,
});

type ArchiveTab = "posts" | "stories" | "live" | "recently_deleted";

export function ArchivePage() {
  const [activeTab, setActiveTab] = useState<ArchiveTab>("posts");
  const tabs = [
    { id: "posts", label: "Posts", icon: ImageIcon },
    { id: "stories", label: "Stories", icon: Clock },
    { id: "live", label: "Live", icon: Radio },
    { id: "recently_deleted", label: "Deleted", icon: Trash2 },
  ] as const;

  const emptyStates = {
    posts: {
      title: "Post Archive is not connected",
      description: "Opexnal does not currently save archived posts. No posts are hidden or stored here.",
      icon: Archive,
    },
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
  const state = emptyStates[activeTab];
  const Icon = state.icon;

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

        <div className="text-center py-12 bg-card border border-border rounded-3xl p-6">
          <Icon className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-xs font-semibold text-foreground">{state.title}</p>
          <p className="text-[11px] text-muted-foreground mt-1">{state.description}</p>
        </div>
      </div>
    </AppShell>
  );
}
