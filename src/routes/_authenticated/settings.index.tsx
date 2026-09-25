import { useState, useMemo } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  Lock,
  ShieldCheck,
  UserCog,
  Sparkles,
  HelpCircle,
  FileText,
  Bell,
  Info,
  BadgeCheck,
  Bookmark,
  Archive,
  Clock,
  Sliders,
  BarChart3,
  DollarSign,
  Crown,
  Users,
  UserX,
  EyeOff,
  MessageSquare,
  AtSign,
  Share2,
  Heart,
  VolumeX,
  Smartphone,
  Download,
  Languages,
  Wifi,
  CreditCard,
  UserPlus,
  RefreshCw,
  MessageCircle,
  Search,
  X,
  Laptop,
  History,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";

import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { getProfileById } from "@/lib/profile";
import {
  SettingsDialogContainer,
  type SettingsDialogType,
} from "@/components/opexnal/settings-dialogs";
import { searchSettings, type SearchableSettingItem } from "@/lib/settings-store";

type AllowedSettingsRoute =
  "/profile/edit" | "/settings/privacy" | "/settings/security" | "/activity" | "/ai" | "/messages";

export const Route = createFileRoute("/_authenticated/settings/")({
  head: () => ({
    meta: [
      { title: "Settings & Activity — Opexnal" },
      {
        name: "description",
        content:
          "Manage your Opexnal account, AI preferences, privacy, activity and security settings.",
      },
      { property: "og:title", content: "Settings & Activity — Opexnal" },
      {
        property: "og:description",
        content: "Manage your Opexnal account, privacy, activity and security.",
      },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Settings,
});

function Settings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useSession();
  const [activeDialog, setActiveDialog] = useState<SettingsDialogType>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const searchResults = useMemo(() => searchSettings(searchQuery), [searchQuery]);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => (user?.id ? getProfileById(user.id) : null),
    enabled: Boolean(user?.id),
  });

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    try {
      localStorage.removeItem("guest_user");
      localStorage.removeItem("opexnal_guest_user");
      sessionStorage.setItem("opexnal_explicit_signout", "true");
    } catch {
      // ignore
    }
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  async function signOutAll() {
    await queryClient.cancelQueries();
    queryClient.clear();
    try {
      localStorage.removeItem("guest_user");
      localStorage.removeItem("opexnal_guest_user");
      sessionStorage.setItem("opexnal_explicit_signout", "true");
    } catch {
      // ignore
    }
    await supabase.auth.signOut({ scope: "global" });
    navigate({ to: "/auth", replace: true });
  }

  const username = profile?.username || "creator";

  return (
    <AppShell
      header={
        <ScreenHeader
          title="Settings & Activity"
          left={
            <Link
              to="/profile"
              aria-label="Back"
              id="settings-back-btn"
              className="text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </Link>
          }
        />
      }
    >
      <div className="space-y-5 px-3 sm:px-4 py-4 max-w-lg mx-auto pb-16">
        {/* Real-time Settings Search Bar */}
        <div className="relative" id="settings-search-bar">
          <Search
            className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="settings-search-input"
            type="search"
            placeholder="Search all settings (e.g. password, notification, blocked, payment)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-9 rounded-2xl h-11 bg-surface border-border text-xs sm:text-sm shadow-xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3.5 top-3.5 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Real-time Search Results View */}
        {searchQuery.trim() !== "" ? (
          <div className="space-y-3" id="settings-search-results">
            <div className="flex items-center justify-between px-1">
              <p className="text-xs font-semibold text-foreground">
                Search Results ({searchResults.length})
              </p>
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-[11px] text-primary hover:underline"
              >
                Clear
              </button>
            </div>

            {searchResults.length === 0 ? (
              <div className="py-8 text-center space-y-2 rounded-2xl border border-border bg-surface p-4">
                <Search className="h-8 w-8 text-muted-foreground/40 mx-auto" />
                <p className="text-xs font-semibold text-foreground">
                  No matching settings found for &ldquo;{searchQuery}&rdquo;
                </p>
                <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
                  Try searching for keywords like password, notifications, blocked, payment, or
                  subscription.
                </p>
                <div className="flex flex-wrap justify-center gap-1.5 pt-2">
                  {["password", "notifications", "blocked", "payments", "subscription"].map(
                    (term) => (
                      <Badge
                        key={term}
                        variant="outline"
                        className="cursor-pointer text-[10px] hover:bg-secondary"
                        onClick={() => setSearchQuery(term)}
                      >
                        {term}
                      </Badge>
                    ),
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                {searchResults.map((item) => {
                  if (item.route) {
                    return (
                      <Link
                        key={item.id}
                        to={item.route as AllowedSettingsRoute}
                        className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 transition-colors hover:bg-secondary cursor-pointer"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-semibold text-foreground">{item.title}</p>
                            <Badge variant="secondary" className="text-[9px] py-0 px-1.5">
                              {item.categoryTitle}
                            </Badge>
                          </div>
                          <p className="truncate text-[11px] text-muted-foreground mt-0.5">
                            {item.description}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      </Link>
                    );
                  }

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        if (item.dialog) {
                          setActiveDialog(item.dialog as SettingsDialogType);
                        }
                      }}
                      className="w-full flex items-center text-left gap-3 rounded-2xl border border-border bg-surface px-4 py-3 transition-colors hover:bg-secondary cursor-pointer"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold text-foreground">{item.title}</p>
                          <Badge variant="secondary" className="text-[9px] py-0 px-1.5">
                            {item.categoryTitle}
                          </Badge>
                        </div>
                        <p className="truncate text-[11px] text-muted-foreground mt-0.5">
                          {item.description}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* 1. Your account */}
            <section className="space-y-1.5" id="section-your-account">
              <p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                1. Your account
              </p>
              <div className="space-y-1.5">
                <SettingsLink
                  to="/profile/edit"
                  id="link-edit-profile"
                  icon={UserCog}
                  label="Edit profile"
                  hint="Name, username, bio, website & avatar"
                />
                <SettingsAction
                  id="action-personal-details"
                  icon={Info}
                  label="Personal details"
                  hint="Contact email, phone number, birthday & ownership"
                  onClick={() => setActiveDialog("personal_details")}
                />
                <SettingsAction
                  id="action-account-status"
                  icon={BadgeCheck}
                  label="Account status"
                  hint="Guidelines standing, monetization eligibility & badges"
                  onClick={() => setActiveDialog("account_status")}
                />
              </div>
            </section>

            {/* 2. Accounts Center */}
            <section className="space-y-1.5" id="section-accounts-center">
              <p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                2. Accounts Center
              </p>
              <div className="space-y-1.5">
                <SettingsAction
                  id="action-accounts-center-hub"
                  icon={Sparkles}
                  label="Accounts Center"
                  hint="Connected profiles, cross-posting & identity sync"
                  onClick={() => setActiveDialog("accounts_center")}
                />
                <SettingsLink
                  to="/settings/security"
                  id="link-password-security"
                  icon={ShieldCheck}
                  label="Password and security"
                  hint="Password change, TOTP two-factor & audit logs"
                />
                <SettingsAction
                  id="action-ad-preferences"
                  icon={Sliders}
                  label="Personal details & ad preferences"
                  hint="Data usage, creator partner ads & topic preferences"
                  onClick={() => setActiveDialog("ad_preferences")}
                />
              </div>
            </section>

            {/* 3. How you use Opexnal */}
            <section className="space-y-1.5" id="section-how-you-use-opexnal">
              <p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                3. How you use Opexnal
              </p>
              <div className="space-y-1.5">
                <SettingsLink
                  to="/activity"
                  id="link-your-activity"
                  icon={Bell}
                  label="Your activity & history"
                  hint="Follow requests, interactions, tags & mentions"
                />
                <SettingsAction
                  id="action-saved-collections"
                  icon={Bookmark}
                  label="Saved"
                  hint="Private bookmarks, saved posts & audio collections"
                  onClick={() => setActiveDialog("saved")}
                />
                <SettingsAction
                  id="action-archive"
                  icon={Archive}
                  label="Archive"
                  hint="Stories archive, past reels & temporary post storage"
                  onClick={() => setActiveDialog("archive")}
                />
                <SettingsAction
                  id="action-time-spent"
                  icon={Clock}
                  label="Time spent"
                  hint="Daily screen time average, break alerts & usage limits"
                  onClick={() => setActiveDialog("time_spent")}
                />
                <SettingsAction
                  id="action-notifications"
                  icon={Bell}
                  label="Notifications"
                  hint="Push notifications, pause all, DMs & live alerts"
                  onClick={() => setActiveDialog("notifications")}
                />
              </div>
            </section>

            {/* 4. Your insights & tools */}
            <section className="space-y-1.5" id="section-your-insights-and-tools">
              <p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                4. Your insights & tools
              </p>
              <div className="space-y-1.5">
                <SettingsLink
                  to="/ai"
                  id="link-ai-studio"
                  icon={Sparkles}
                  label="Opexnal AI Studio"
                  hint="Captions, viral hooks, hashtags, reels co-pilot"
                />
                <SettingsAction
                  id="action-creator-insights"
                  icon={BarChart3}
                  label="Creator insights & analytics"
                  hint="7-day reach, profile visits, engagement & followers"
                  onClick={() => setActiveDialog("insights")}
                />
                <SettingsAction
                  id="action-branded-content"
                  icon={DollarSign}
                  label="Branded content & partnerships"
                  hint="Commercial tags, paid partnership approvals & disclosures"
                  onClick={() => setActiveDialog("branded_content")}
                />
                <SettingsAction
                  id="action-account-type"
                  icon={UserCog}
                  label="Account type & professional tools"
                  hint="Switch between Creator, Personal, and Business"
                  onClick={() => setActiveDialog("account_type")}
                />
              </div>
            </section>

            {/* 5. Subscriptions */}
            <section className="space-y-1.5" id="section-subscriptions">
              <p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                5. Subscriptions
              </p>
              <div className="space-y-1.5">
                <SettingsAction
                  id="action-creator-subscriptions"
                  icon={Crown}
                  label="Creator subscriptions"
                  hint="Manage fan pricing, subscriber-only reels & benefits"
                  onClick={() => setActiveDialog("creator_subscriptions")}
                />
                <SettingsAction
                  id="action-active-subscriptions"
                  icon={Heart}
                  label="Your active subscriptions"
                  hint="Creators you support, renewal cycles & receipts"
                  onClick={() => setActiveDialog("active_subscriptions")}
                />
                <SettingsAction
                  id="action-subscriber-badges"
                  icon={BadgeCheck}
                  label="Subscriber badges & perks"
                  hint="Custom chat crown, exclusive ring & DM sorting"
                  onClick={() => setActiveDialog("subscriber_badges")}
                />
              </div>
            </section>

            {/* 6. Who can see your content */}
            <section className="space-y-1.5" id="section-who-can-see-your-content">
              <p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                6. Who can see your content
              </p>
              <div className="space-y-1.5">
                <SettingsLink
                  to="/settings/privacy"
                  id="link-account-privacy"
                  icon={Lock}
                  label="Account privacy"
                  hint="Private account toggle, mentions & tag permissions"
                />
                <SettingsAction
                  id="action-close-friends"
                  icon={Users}
                  label="Close Friends"
                  hint="Curate exclusive green-ring story circle"
                  onClick={() => setActiveDialog("close_friends")}
                />
                <SettingsAction
                  id="action-blocked-accounts"
                  icon={UserX}
                  label="Blocked accounts"
                  hint="View blocked profiles and manage unblocking"
                  onClick={() => setActiveDialog("blocked_accounts")}
                />
                <SettingsAction
                  id="action-hide-story"
                  icon={EyeOff}
                  label="Hide story and live"
                  hint="Prevent specific users from viewing your stories"
                  onClick={() => setActiveDialog("hide_story")}
                />
              </div>
            </section>

            {/* 7. How others can interact with you */}
            <section className="space-y-1.5" id="section-how-others-can-interact">
              <p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                7. How others can interact with you
              </p>
              <div className="space-y-1.5">
                <SettingsLink
                  to="/messages"
                  id="link-messages-replies"
                  icon={MessageSquare}
                  label="Messages and story replies"
                  hint="Message requests, read receipts & direct chat permissions"
                />
                <SettingsLink
                  to="/settings/privacy"
                  id="link-tags-mentions"
                  icon={AtSign}
                  label="Tags and mentions"
                  hint="Choose who can tag or mention you in posts"
                />
                <SettingsAction
                  id="action-comments-filter"
                  icon={Sliders}
                  label="Comments & hidden words"
                  hint="Profanity filter, custom offensive keyword blocklist"
                  onClick={() => setActiveDialog("comment_filter")}
                />
                <SettingsAction
                  id="action-sharing-remixes"
                  icon={Share2}
                  label="Sharing and remixes"
                  hint="Allow reels remixing and story resharing"
                  onClick={() => setActiveDialog("sharing_remixes")}
                />
                <SettingsAction
                  id="action-restricted-accounts"
                  icon={ShieldCheck}
                  label="Restricted accounts"
                  hint="Quietly limit interactions without blocking users"
                  onClick={() => setActiveDialog("restricted_accounts")}
                />
              </div>
            </section>

            {/* 8. What you see */}
            <section className="space-y-1.5" id="section-what-you-see">
              <p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                8. What you see
              </p>
              <div className="space-y-1.5">
                <SettingsAction
                  id="action-favorites"
                  icon={Heart}
                  label="Favorites"
                  hint="Prioritize posts from starred creators in feed"
                  onClick={() => setActiveDialog("favorites")}
                />
                <SettingsAction
                  id="action-muted-accounts"
                  icon={VolumeX}
                  label="Muted accounts"
                  hint="Manage muted posts, stories and author notes"
                  onClick={() => setActiveDialog("muted_accounts")}
                />
                <SettingsAction
                  id="action-content-preferences"
                  icon={Sliders}
                  label="Content preferences"
                  hint="Sensitive content control & explore recommendation tuning"
                  onClick={() => setActiveDialog("content_preferences")}
                />
                <SettingsAction
                  id="action-like-counts"
                  icon={Heart}
                  label="Like and view counts"
                  hint="Hide total like and view counts across posts"
                  onClick={() => setActiveDialog("like_counts")}
                />
              </div>
            </section>

            {/* 9. Your app & media */}
            <section className="space-y-1.5" id="section-your-app-and-media">
              <p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                9. Your app & media
              </p>
              <div className="space-y-1.5">
                <SettingsAction
                  id="action-device-permissions"
                  icon={Smartphone}
                  label="Device permissions"
                  hint="Camera, microphone, photo library & push notification access"
                  onClick={() => setActiveDialog("device_permissions")}
                />
                <SettingsAction
                  id="action-archiving-downloading"
                  icon={Download}
                  label="Archiving and downloading"
                  hint="Auto-save to archive and original camera roll download"
                  onClick={() => setActiveDialog("archiving_downloading")}
                />
                <SettingsAction
                  id="action-accessibility-captions"
                  icon={Sliders}
                  label="Accessibility & captions"
                  hint="Auto-generated captions & high-contrast visibility"
                  onClick={() => setActiveDialog("accessibility_captions")}
                />
                <SettingsAction
                  id="action-language-region"
                  icon={Languages}
                  label="Language & region"
                  hint="Display language, Hindi, Hinglish & auto-translations"
                  onClick={() => setActiveDialog("language_region")}
                />
                <SettingsAction
                  id="action-data-usage"
                  icon={Wifi}
                  label="Data usage and media quality"
                  hint="Cellular data saver & upload at highest quality"
                  onClick={() => setActiveDialog("data_usage")}
                />
              </div>
            </section>

            {/* 10. Family Center */}
            <section className="space-y-1.5" id="section-family-center">
              <p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                10. Family Center
              </p>
              <div className="space-y-1.5">
                <SettingsAction
                  id="action-supervision"
                  icon={ShieldCheck}
                  label="Supervision"
                  hint="Parental controls, invite guardian & screen time limits"
                  onClick={() => setActiveDialog("supervision")}
                />
                <SettingsAction
                  id="action-safety-hub"
                  icon={HelpCircle}
                  label="Education & safety hub"
                  hint="Teen privacy defaults, guardian safety guides & resources"
                  onClick={() => setActiveDialog("safety_hub")}
                />
              </div>
            </section>

            {/* 11. Orders & payments */}
            <section className="space-y-1.5" id="section-orders-and-payments">
              <p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                11. Orders & payments
              </p>
              <div className="space-y-1.5">
                <SettingsAction
                  id="action-payment-methods"
                  icon={CreditCard}
                  label="Payment methods"
                  hint="Saved cards, UPI, digital wallet & billing address"
                  onClick={() => setActiveDialog("payment_methods")}
                />
                <SettingsAction
                  id="action-order-history"
                  icon={FileText}
                  label="Order history & receipts"
                  hint="Subscription invoices, creator tips & purchase history"
                  onClick={() => setActiveDialog("order_history")}
                />
                <SettingsAction
                  id="action-payouts"
                  icon={DollarSign}
                  label="Monetization payouts"
                  hint="Creator balance, direct deposit details & payout schedule"
                  onClick={() => setActiveDialog("payouts")}
                />
              </div>
            </section>

            {/* 12. More info & support */}
            <section className="space-y-1.5" id="section-more-info-and-support">
              <p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                12. More info & support
              </p>
              <div className="space-y-1.5">
                <SettingsAction
                  id="action-help-center"
                  icon={HelpCircle}
                  label="Help Center & FAQs"
                  hint="Troubleshooting guides & report a problem"
                  onClick={() => setActiveDialog("help_center")}
                />
                <SettingsAction
                  id="action-support-requests"
                  icon={ShieldCheck}
                  label="Support requests & appeals"
                  hint="Track submitted reports, violations & appeals"
                  onClick={() => setActiveDialog("support_requests")}
                />
                <SettingsAction
                  id="action-about-opexnal"
                  icon={Info}
                  label="About Opexnal"
                  hint="Platform release v2.5, AI foundation & credits"
                  onClick={() => setActiveDialog("about")}
                />
                <SettingsAction
                  id="action-terms-of-service"
                  icon={FileText}
                  label="Terms of Service"
                  hint="Creator rights, platform guidelines & code of conduct"
                  onClick={() => setActiveDialog("terms")}
                />
                <SettingsLink
                  to="/settings/privacy"
                  id="link-privacy-policy"
                  icon={Lock}
                  label="Privacy Policy"
                  hint="Data handling, encryption & cookie preferences"
                />
              </div>
            </section>

            {/* 13. Also from Opexnal */}
            <section className="space-y-1.5" id="section-also-from-opexnal">
              <p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                13. Also from Opexnal
              </p>
              <div className="space-y-1.5">
                <SettingsLink
                  to="/ai"
                  id="link-opexnal-ai-suite"
                  icon={Sparkles}
                  label="Opexnal AI Suite"
                  hint="Multimodal generative AI creator engine"
                />
                <SettingsLink
                  to="/messages"
                  id="link-opexnal-messenger"
                  icon={MessageCircle}
                  label="Opexnal Messenger"
                  hint="Fast, direct and encrypted social messaging"
                />
                <SettingsAction
                  id="action-creator-web"
                  icon={Smartphone}
                  label="Opexnal Studio for Web"
                  hint="Desktop publishing, post scheduling & bulk uploads"
                  onClick={() => setActiveDialog("creator_web")}
                />
              </div>
            </section>

            {/* 14. Login */}
            <section className="space-y-2 pt-2" id="section-login">
              <p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                14. Login
              </p>
              <div className="space-y-1.5">
                <SettingsAction
                  id="action-download-data"
                  icon={Download}
                  label="Download your data"
                  hint="Request a machine-readable JSON or HTML export of your data"
                  onClick={() => setActiveDialog("download_data")}
                />
                <SettingsAction
                  id="action-recently-deleted"
                  icon={History}
                  label="Recently deleted"
                  hint="Review, restore, or permanently remove items deleted within 30 days"
                  onClick={() => setActiveDialog("recently_deleted")}
                />
                <SettingsAction
                  id="action-active-sessions"
                  icon={Laptop}
                  label="Active login sessions"
                  hint="Review active devices, web browsers, and locations signed into your account"
                  onClick={() => setActiveDialog("active_sessions")}
                />
                <SettingsAction
                  id="action-deactivate-account"
                  icon={AlertTriangle}
                  label="Deactivate or delete account"
                  hint="Temporarily pause your presence or permanently delete your profile"
                  onClick={() => setActiveDialog("deactivate_account")}
                />
                <SettingsAction
                  id="action-add-account"
                  icon={UserPlus}
                  label="Add account"
                  hint="Log into an existing secondary creator account"
                  onClick={() => setActiveDialog("add_account")}
                />
                <SettingsAction
                  id="action-switch-account"
                  icon={RefreshCw}
                  label="Switch accounts"
                  hint="Seamlessly switch active profile session"
                  onClick={() => setActiveDialog("switch_account")}
                />
                <Button
                  id="btn-sign-out-current"
                  variant="surface"
                  size="xl"
                  className="w-full rounded-2xl text-destructive hover:bg-destructive/10 border-destructive/20 mt-1"
                  onClick={() => setActiveDialog("logout_confirm")}
                >
                  <LogOut className="h-4 w-4 mr-2" aria-hidden="true" />
                  Log out of @{username}
                </Button>
                <Button
                  id="btn-sign-out-all"
                  variant="ghost"
                  size="sm"
                  className="w-full text-muted-foreground hover:text-foreground text-xs"
                  onClick={() => setActiveDialog("logout_all_confirm")}
                >
                  Log out of all accounts
                </Button>
              </div>
            </section>
          </>
        )}

        {/* Modals & Dialogs Container */}
        <SettingsDialogContainer
          dialog={activeDialog}
          onClose={() => setActiveDialog(null)}
          username={username}
          onSignOut={signOut}
          onSignOutAll={signOutAll}
        />
      </div>
    </AppShell>
  );
}

function SettingsLink({
  to,
  id,
  icon: Icon,
  label,
  hint,
}: {
  to:
    | "/profile/edit"
    | "/settings/privacy"
    | "/settings/security"
    | "/activity"
    | "/ai"
    | "/messages";
  id?: string;
  icon: LucideIcon;
  label: string;
  hint: string;
}) {
  return (
    <Link
      to={to}
      id={id}
      className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3.5 transition-colors hover:bg-secondary cursor-pointer"
    >
      <Icon className="h-5 w-5 text-primary shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{label}</p>
        <p className="truncate text-xs text-muted-foreground">{hint}</p>
      </div>
      <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
    </Link>
  );
}

function SettingsAction({
  id,
  icon: Icon,
  label,
  hint,
  onClick,
}: {
  id?: string;
  icon: LucideIcon;
  label: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      id={id}
      onClick={onClick}
      className="w-full flex items-center text-left gap-3 rounded-2xl border border-border bg-surface px-4 py-3.5 transition-colors hover:bg-secondary cursor-pointer"
    >
      <Icon className="h-5 w-5 text-primary shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="truncate text-xs text-muted-foreground">{hint}</p>
      </div>
      <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
    </button>
  );
}
