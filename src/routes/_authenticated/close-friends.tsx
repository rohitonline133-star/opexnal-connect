import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Users,
  Star,
  Search,
  Check,
  Plus,
  Trash2,
  ChevronLeft,
  Sparkles,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getStoredSettings, saveSettings } from "@/lib/settings-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/close-friends")({
  head: () => ({
    meta: [
      { title: "Close Friends & Favorites — Opexnal" },
      {
        name: "description",
        content:
          "Manage your close friends list for private stories and favorites feed on Opexnal.",
      },
    ],
  }),
  component: CloseFriendsPage,
});

type ListMode = "close_friends" | "favorites";

interface CreatorUser {
  id: string;
  username: string;
  name: string;
  avatar: string;
}

const SAMPLE_CREATORS: CreatorUser[] = [
  { id: "u1", username: "maya_visuals", name: "Maya Sharma", avatar: "M" },
  { id: "u2", username: "aarav_tech", name: "Aarav Patel", avatar: "A" },
  { id: "u3", username: "sneha_art", name: "Sneha Roy", avatar: "S" },
  { id: "u4", username: "rohan_music", name: "Rohan Kapoor", avatar: "R" },
  { id: "u5", username: "ananya_writes", name: "Ananya Desai", avatar: "A" },
  { id: "u6", username: "vikram_builds", name: "Vikram Mehta", avatar: "V" },
];

export function CloseFriendsPage() {
  const [mode, setMode] = useState<ListMode>("close_friends");
  const [search, setSearch] = useState("");

  const [closeFriends, setCloseFriends] = useState<string[]>(() => {
    return getStoredSettings().closeFriends || ["maya_visuals", "aarav_tech"];
  });

  const [favorites, setFavorites] = useState<string[]>(() => {
    return getStoredSettings().favoriteCreators || ["maya_visuals", "sneha_art"];
  });

  const filteredCreators = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return SAMPLE_CREATORS;
    return SAMPLE_CREATORS.filter(
      (c) => c.username.toLowerCase().includes(q) || c.name.toLowerCase().includes(q),
    );
  }, [search]);

  const toggleCloseFriend = (username: string) => {
    const exists = closeFriends.includes(username);
    const updated = exists
      ? closeFriends.filter((u) => u !== username)
      : [...closeFriends, username];
    setCloseFriends(updated);
    saveSettings({ closeFriends: updated });
    toast.success(
      exists ? `Removed @${username} from Close Friends` : `Added @${username} to Close Friends 💚`,
    );
  };

  const toggleFavorite = (username: string) => {
    const exists = favorites.includes(username);
    const updated = exists ? favorites.filter((u) => u !== username) : [...favorites, username];
    setFavorites(updated);
    saveSettings({ favoriteCreators: updated });
    toast.success(
      exists ? `Removed @${username} from Favorites` : `Added @${username} to Favorites ⭐`,
    );
  };

  const clearCurrentList = () => {
    if (mode === "close_friends") {
      setCloseFriends([]);
      saveSettings({ closeFriends: [] });
      toast.success("Cleared all Close Friends");
    } else {
      setFavorites([]);
      saveSettings({ favoriteCreators: [] });
      toast.success("Cleared all Favorites");
    }
  };

  return (
    <AppShell
      header={
        <ScreenHeader
          title={mode === "close_friends" ? "Close Friends" : "Favorites"}
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
        {/* Top Switcher */}
        <div className="flex bg-surface border border-border p-1 rounded-2xl gap-1">
          <button
            type="button"
            onClick={() => setMode("close_friends")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl transition-all",
              mode === "close_friends"
                ? "bg-card text-emerald-400 shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Close Friends ({closeFriends.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("favorites")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl transition-all",
              mode === "favorites"
                ? "bg-card text-amber-400 shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Star className="h-3.5 w-3.5" />
            <span>Favorites ({favorites.length})</span>
          </button>
        </div>

        {/* Informative Explanation Banner */}
        <div
          className={cn(
            "p-3.5 rounded-2xl border text-xs leading-relaxed space-y-1",
            mode === "close_friends"
              ? "bg-emerald-950/20 border-emerald-800/40 text-emerald-200"
              : "bg-amber-950/20 border-amber-800/40 text-amber-200",
          )}
        >
          <div className="flex items-center gap-2 font-semibold">
            {mode === "close_friends" ? (
              <>
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span>Private Close Friends Sharing</span>
              </>
            ) : (
              <>
                <Star className="h-3.5 w-3.5 text-amber-400" />
                <span>Favorites Prioritization</span>
              </>
            )}
          </div>
          <p className="text-[11px] opacity-90">
            {mode === "close_friends"
              ? "Only people on this list will see your Close Friends stories and posts highlighted with a green badge. We never notify anyone when you add or remove them."
              : "Posts from your Favorites will be prioritized at the top of your Home feed so you never miss an update."}
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search accounts or friends..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 rounded-2xl bg-surface border-border text-xs"
          />
        </div>

        {/* Clear All Action */}
        <div className="flex items-center justify-between px-1">
          <p className="text-xs font-semibold text-muted-foreground">Suggested Accounts</p>
          {(mode === "close_friends" ? closeFriends.length : favorites.length) > 0 && (
            <button
              type="button"
              onClick={clearCurrentList}
              className="text-[11px] text-destructive hover:underline font-medium"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Accounts List */}
        <div className="space-y-2">
          {filteredCreators.map((creator) => {
            const isSelected =
              mode === "close_friends"
                ? closeFriends.includes(creator.username)
                : favorites.includes(creator.username);

            return (
              <div
                key={creator.id}
                className="p-3 bg-card border border-border rounded-2xl flex items-center justify-between shadow-xs transition-colors hover:bg-surface"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full brand-gradient-bg flex items-center justify-center font-bold text-white text-xs">
                    {creator.avatar}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-foreground">@{creator.username}</p>
                      {isSelected && (
                        <span
                          className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded-full font-bold",
                            mode === "close_friends"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-amber-500/20 text-amber-400",
                          )}
                        >
                          {mode === "close_friends" ? "Close Friend" : "Favorite"}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">{creator.name}</p>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant={isSelected ? "surface" : "brand"}
                  onClick={() =>
                    mode === "close_friends"
                      ? toggleCloseFriend(creator.username)
                      : toggleFavorite(creator.username)
                  }
                  className={cn(
                    "h-8 px-3 rounded-xl text-xs font-semibold transition-all",
                    isSelected &&
                      mode === "close_friends" &&
                      "text-emerald-400 border-emerald-800/40",
                    isSelected && mode === "favorites" && "text-amber-400 border-amber-800/40",
                  )}
                >
                  {isSelected ? (
                    <>
                      <Check className="h-3.5 w-3.5 mr-1" />
                      Added
                    </>
                  ) : (
                    <>
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Add
                    </>
                  )}
                </Button>
              </div>
            );
          })}
        </div>

        {/* Done Save Confirmation */}
        <Button
          asChild
          className="w-full brand-gradient-bg text-white font-bold rounded-2xl h-11 text-xs mt-4"
        >
          <Link to="/home">Save & Return to Feed</Link>
        </Button>
      </div>
    </AppShell>
  );
}
