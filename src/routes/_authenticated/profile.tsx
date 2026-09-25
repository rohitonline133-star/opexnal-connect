import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Grid3x3,
  Loader2,
  Settings,
  BadgeCheck,
  Lock,
  BarChart3,
  Bookmark,
  Plus,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";
import { ProfileAvatar } from "@/components/opexnal/avatar";
import { PostGrid } from "@/components/opexnal/post-grid";
import { ProfessionalDashboardModal } from "@/components/opexnal/professional-dashboard-modal";
import { ShoppingModal } from "@/components/opexnal/shopping-modal";
import { Button } from "@/components/ui/button";
import { getProfileById, initialsFor } from "@/lib/profile";
import { useSession } from "@/hooks/use-session";
import { getWishlistProducts, type ProductItem } from "@/lib/interactive-features";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Your profile — Opexnal" },
      { name: "description", content: "Your Opexnal profile, stats and posts." },
      { property: "og:title", content: "Your profile — Opexnal" },
      { property: "og:description", content: "Your Opexnal profile, stats and posts." },
      { property: "og:type", content: "profile" },
      { name: "robots", content: "noindex" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MyProfile,
});

const DEFAULT_HIGHLIGHTS = [
  { id: "1", title: "Vibes ✨", emoji: "✨" },
  { id: "2", title: "Travel ✈️", emoji: "✈️" },
  { id: "3", title: "Moments 📸", emoji: "📸" },
];

function MyProfile() {
  const { user } = useSession();
  const [showDashboard, setShowDashboard] = useState(false);
  const [profileTab, setProfileTab] = useState<"posts" | "saved">("posts");
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => getProfileById(user!.id),
    enabled: Boolean(user?.id),
  });

  const wishlist = getWishlistProducts();

  return (
    <AppShell
      header={
        <ScreenHeader
          title={profile ? `@${profile.username}` : "Profile"}
          right={
            <Link
              to="/settings"
              aria-label="Settings"
              className="text-muted-foreground hover:text-foreground"
            >
              <Settings className="h-5 w-5" aria-hidden="true" />
            </Link>
          }
        />
      }
    >
      {isLoading || !profile ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden="true" />
        </div>
      ) : (
        <div className="pb-10">
          <div className="flex items-center gap-5 px-4 pt-6">
            <ProfileAvatar
              path={profile.avatar_url}
              fallback={initialsFor(profile)}
              className="h-20 w-20 text-lg"
              ring
            />
            <dl className="flex flex-1 justify-around text-center">
              <div>
                <dt className="text-xs text-muted-foreground">Posts</dt>
                <dd className="text-lg font-semibold">{profile.posts_count}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Followers</dt>
                <dd className="text-lg font-semibold">{profile.followers_count}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Following</dt>
                <dd className="text-lg font-semibold">{profile.following_count}</dd>
              </div>
            </dl>
          </div>

          <div className="px-4 pt-4">
            <p className="flex items-center gap-1.5 text-sm font-semibold">
              {profile.display_name || profile.username}
              {profile.is_verified && (
                <BadgeCheck className="h-4 w-4 text-primary" aria-label="Verified" />
              )}
              {profile.is_private && (
                <Lock className="h-3.5 w-3.5 text-muted-foreground" aria-label="Private account" />
              )}
            </p>
            <p className="text-xs capitalize text-muted-foreground">
              {profile.account_type} account
            </p>
            {profile.bio && <p className="mt-2 whitespace-pre-line text-sm">{profile.bio}</p>}
            {profile.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="mt-1 inline-block text-sm text-primary hover:underline"
              >
                {profile.website.replace(/^https?:\/\//, "")}
              </a>
            )}
          </div>

          {/* Professional Dashboard Card */}
          <div className="px-4 pt-3">
            <button
              type="button"
              onClick={() => setShowDashboard(true)}
              className="w-full text-left rounded-2xl border border-primary/30 bg-primary/5 p-3 transition-colors hover:bg-primary/10"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  <span className="text-xs font-bold text-foreground">Professional Dashboard</span>
                </div>
                <span className="text-[11px] font-semibold text-primary">View Insights →</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                14.8K accounts reached in the last 30 days · Monetization Active
              </p>
            </button>
          </div>

          <div className="flex gap-2 px-4 pt-3">
            <Button asChild variant="surface" className="flex-1 rounded-xl">
              <Link to="/profile/edit">Edit profile</Link>
            </Button>
            <Button asChild variant="surface" className="flex-1 rounded-xl">
              <Link to="/settings/privacy">Privacy</Link>
            </Button>
          </div>

          {/* Story Highlights Bar */}
          <div className="px-4 pt-4">
            <div className="flex items-center gap-3.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => toast.info("Select past stories to create a new highlight")}
                className="flex flex-col items-center gap-1 shrink-0"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-border bg-surface text-muted-foreground hover:border-primary">
                  <Plus className="h-5 w-5" />
                </div>
                <span className="text-[10px] text-muted-foreground">New</span>
              </button>

              {DEFAULT_HIGHLIGHTS.map((hl) => (
                <div key={hl.id} className="flex flex-col items-center gap-1 shrink-0">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-primary/30 bg-secondary text-lg">
                    {hl.emoji}
                  </div>
                  <span className="text-[10px] text-foreground font-medium">{hl.title}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Grid Tabs: Posts vs Saved / Wishlist */}
          <div className="mt-5 border-t border-border">
            <div className="flex">
              <button
                type="button"
                onClick={() => setProfileTab("posts")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors",
                  profileTab === "posts"
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                <Grid3x3 className="h-4 w-4" aria-hidden="true" />
                Posts
              </button>
              <button
                type="button"
                onClick={() => setProfileTab("saved")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors",
                  profileTab === "saved"
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                <Bookmark className="h-4 w-4" aria-hidden="true" />
                Saved & Wishlist
              </button>
            </div>

            {profileTab === "posts" ? (
              <PostGrid
                userId={profile.id}
                viewerId={user?.id ?? null}
                emptyMessage="You haven't posted yet. Tap create to share your first photo or video."
              />
            ) : (
              <div className="p-4 space-y-4">
                {wishlist.length === 0 ? (
                  <div className="py-12 text-center text-xs text-muted-foreground">
                    <Bookmark className="mx-auto mb-2 h-8 w-8 opacity-40" />
                    No saved storefront items yet. Browse the Explore Shop to bookmark items!
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {wishlist.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => setSelectedProduct(item)}
                        className="cursor-pointer rounded-2xl border border-border bg-surface p-2.5 shadow-xs transition hover:border-primary/50"
                      >
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="aspect-square w-full rounded-xl object-cover"
                        />
                        <h5 className="truncate text-xs font-bold text-foreground mt-2">
                          {item.title}
                        </h5>
                        <p className="text-[11px] font-semibold text-primary">${item.price}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Professional Dashboard Modal */}
      {showDashboard && profile && (
        <ProfessionalDashboardModal
          username={profile.username}
          accountType={profile.account_type}
          onClose={() => setShowDashboard(false)}
        />
      )}

      {/* Shopping Details Modal */}
      {selectedProduct && (
        <ShoppingModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}
    </AppShell>
  );
}
