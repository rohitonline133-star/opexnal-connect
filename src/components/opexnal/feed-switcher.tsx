import { useState } from "react";
import { ChevronDown, Sparkles, Users, Star, Check, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getFavoritesFeedList, toggleFavoriteCreator } from "@/lib/interactive-features";
import { cn } from "@/lib/utils";

export type FeedFilterMode = "for_you" | "following" | "favorites";

interface FeedSwitcherProps {
  currentMode: FeedFilterMode;
  onChangeMode: (mode: FeedFilterMode) => void;
}

export function FeedSwitcher({ currentMode, onChangeMode }: FeedSwitcherProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [favoritesModalOpen, setFavoritesModalOpen] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(() => getFavoritesFeedList());

  function handleSelect(mode: FeedFilterMode) {
    onChangeMode(mode);
    setDropdownOpen(false);
    if (mode === "for_you") toast.info("Showing Algorithmic For You feed");
    if (mode === "following") toast.info("Showing Chronological Following feed");
    if (mode === "favorites") toast.info("Showing Favorites feed (Starred creators)");
  }

  function handleToggleFavorite(username: string) {
    const updated = toggleFavoriteCreator(username);
    setFavorites(updated);
    toast.success(
      updated.includes(username)
        ? `Added @${username} to Favorites`
        : `Removed @${username} from Favorites`,
    );
  }

  const labelMap = {
    for_you: "For You",
    following: "Following",
    favorites: "Favorites",
  };

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-1.5 text-lg font-bold text-foreground transition-opacity hover:opacity-80"
        aria-expanded={dropdownOpen}
      >
        <span>Opexnal</span>
        <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-primary">
          {labelMap[currentMode]}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </button>

      {dropdownOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
          <div className="absolute left-0 top-full z-50 mt-2 w-52 rounded-2xl border border-border bg-card p-1.5 shadow-2xl animate-in fade-in zoom-in-95">
            <button
              type="button"
              onClick={() => handleSelect("for_you")}
              className={cn(
                "flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-colors",
                currentMode === "for_you"
                  ? "bg-primary/10 text-primary"
                  : "text-foreground hover:bg-secondary",
              )}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>For You (Algorithm)</span>
              </div>
              {currentMode === "for_you" && <Check className="h-3.5 w-3.5" />}
            </button>

            <button
              type="button"
              onClick={() => handleSelect("following")}
              className={cn(
                "flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-colors",
                currentMode === "following"
                  ? "bg-primary/10 text-primary"
                  : "text-foreground hover:bg-secondary",
              )}
            >
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span>Following (Chronological)</span>
              </div>
              {currentMode === "following" && <Check className="h-3.5 w-3.5" />}
            </button>

            <button
              type="button"
              onClick={() => handleSelect("favorites")}
              className={cn(
                "flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-colors",
                currentMode === "favorites"
                  ? "bg-primary/10 text-primary"
                  : "text-foreground hover:bg-secondary",
              )}
            >
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                <span>Favorites</span>
              </div>
              {currentMode === "favorites" && <Check className="h-3.5 w-3.5" />}
            </button>

            <div className="my-1 border-t border-border" />

            <button
              type="button"
              onClick={() => {
                setDropdownOpen(false);
                setFavoritesModalOpen(true);
              }}
              className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <span>Manage Favorites ({favorites.length})</span>
              <Star className="h-3.5 w-3.5" />
            </button>
          </div>
        </>
      )}

      {/* Manage Favorites Modal */}
      {favoritesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                <h3 className="text-sm font-bold">Manage Favorites</h3>
              </div>
              <button
                type="button"
                onClick={() => setFavoritesModalOpen(false)}
                className="rounded-full p-1 text-muted-foreground hover:bg-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground pb-4">
              Add creators to your favorites to see their latest posts first without algorithmic
              filtering.
            </p>

            <div className="space-y-2 max-h-56 overflow-y-auto">
              {["aanya_design", "rohan_sharma", "priya_art", "vikram_visuals", "tech_radar"].map(
                (creator) => {
                  const isFav = favorites.includes(creator);
                  return (
                    <div
                      key={creator}
                      className="flex items-center justify-between rounded-xl border border-border bg-surface p-2.5"
                    >
                      <span className="text-xs font-semibold">@{creator}</span>
                      <Button
                        type="button"
                        size="sm"
                        variant={isFav ? "secondary" : "outline"}
                        onClick={() => handleToggleFavorite(creator)}
                        className="h-7 text-xs rounded-lg px-2.5"
                      >
                        {isFav ? "Starred" : "+ Add"}
                      </Button>
                    </div>
                  );
                },
              )}
            </div>

            <div className="mt-4 pt-2">
              <Button
                type="button"
                onClick={() => setFavoritesModalOpen(false)}
                className="w-full rounded-xl brand-gradient-bg text-primary-foreground font-semibold"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
