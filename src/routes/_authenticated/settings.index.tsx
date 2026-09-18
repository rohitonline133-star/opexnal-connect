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
            placeholder="Search all settings / સેટિંગ્સ શોધો (e.g. password, notification, પાસવર્ડ)..."
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
                  Try searching for keywords like password (પાસવર્ડ), notifications (નોટિફિકેશન),
                  blocked (બ્લોક), payments (પેમેન્ટ), or subscription (સબસ્ક્રિપ્શન).
                </p>
                <div className="flex flex-wrap justify-center gap-1.5 pt-2">
                  {[
                    "password",
                    "પાસવર્ડ",
                    "notifications",
                    "નોટિફિકેશન",
                    "blocked",
                    "બ્લોક",
                    "payments",
                    "પેમેન્ટ",
                    "archive",
                    "આર્કાઇવ",
                  ].map((term) => (
                    <Badge
                      key={term}
                      variant="outline"
                      className="cursor-pointer text-[10px] hover:bg-secondary"
                      onClick={() => setSearchQuery(term)}
                    >
                      {term}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                {searchResults.map((item) => {
                  const displayDesc = item.descriptionGu
                    ? `${item.description} — ${item.descriptionGu}`
                    : item.description;

                  if (item.route) {
                    return (
                      <Link
                        key={item.id}
                        to={item.route as AllowedSettingsRoute}
                        className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 transition-colors hover:bg-secondary cursor-pointer"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-xs font-semibold text-foreground">{item.title}</p>
                            {item.titleGu && item.titleGu !== item.title && (
                              <span className="text-[11px] text-muted-foreground font-normal">
                                • {item.titleGu}
                              </span>
                            )}
                            <Badge
                              variant="secondary"
                              className="text-[9px] py-0 px-1.5 ml-auto sm:ml-0"
                            >
                              {item.categoryTitle}
                            </Badge>
                          </div>
                          <p className="truncate text-[11px] text-muted-foreground mt-0.5">
                            {displayDesc}
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
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs font-semibold text-foreground">{item.title}</p>
                          {item.titleGu && item.titleGu !== item.title && (
                            <span className="text-[11px] text-muted-foreground font-normal">
                              • {item.titleGu}
                            </span>
                          )}
                          <Badge
                            variant="secondary"
                            className="text-[9px] py-0 px-1.5 ml-auto sm:ml-0"
                          >
                            {item.categoryTitle}
                          </Badge>
                        </div>
                        <p className="truncate text-[11px] text-muted-foreground mt-0.5">
                          {displayDesc}
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
                1. Your account (અકાઉન્ટ સેન્ટર)
              </p>
              <div className="space-y-1.5">
                <SettingsLink
                  to="/profile/edit"
                  id="link-edit-profile"
                  icon={UserCog}
                  label="Edit profile"
                  labelGu="પ્રોફાઇલ એડિટ કરો"
                  hint="Name, username, bio, website & avatar"
                  hintGu="નામ, યુઝરનેમ, બાયો અને અવતાર"
                />
                <SettingsAction
                  id="action-personal-details"
                  icon={Info}
                  label="Personal details"
                  labelGu="વ્યક્તિગત વિગતો"
                  hint="Contact email, phone number, birthday & ownership"
                  hintGu="ઈમેલ, મોબાઇલ નંબર, જન્મતારીખ અને અકાઉન્ટ ઓનરશિપ"
                  onClick={() => setActiveDialog("personal_details")}
                />
                <SettingsAction
                  id="action-account-status"
                  icon={BadgeCheck}
                  label="Account status"
                  labelGu="અકાઉન્ટ સ્ટેટસ"
                  hint="Guidelines standing, monetization eligibility & badges"
                  hintGu="ગાઇડલાઇન્સ સ્ટેન્ડિંગ, મોનેટાઇઝેશન અને બેજ"
                  onClick={() => setActiveDialog("account_status")}
                />
              </div>
            </section>

            {/* 2. Accounts Center */}
            <section className="space-y-1.5" id="section-accounts-center">
              <p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                2. Accounts Center (અકાઉન્ટ્સ સેન્ટર)
              </p>
              <div className="space-y-1.5">
                <SettingsAction
                  id="action-accounts-center-hub"
                  icon={Sparkles}
                  label="Accounts Center"
                  labelGu="અકાઉન્ટ્સ સેન્ટર"
                  hint="Connected profiles, cross-posting & identity sync"
                  hintGu="Opexnal, Facebook એકાઉન્ટ્સ લિંક કરવા અને સિંક"
                  onClick={() => setActiveDialog("accounts_center")}
                />
                <SettingsLink
                  to="/settings/security"
                  id="link-password-security"
                  icon={ShieldCheck}
                  label="Password and security"
                  labelGu="પાસવર્ડ અને સુરક્ષા"
                  hint="Password change, TOTP two-factor & audit logs"
                  hintGu="પાસવર્ડ બદલવો, 2FA સુરક્ષા અને સિક્યોરિટી ચેક"
                />
                <SettingsAction
                  id="action-ad-preferences"
                  icon={Sliders}
                  label="Personal details & ad preferences"
                  labelGu="એડ પ્રેફરન્સ"
                  hint="Data usage, creator partner ads & topic preferences"
                  hintGu="જાહેરાત ટોપિક્સ અને ટાર્ગેટેડ એડ્સ કંટ્રોલ"
                  onClick={() => setActiveDialog("ad_preferences")}
                />
              </div>
            </section>

            {/* 3. How you use Opexnal */}
            <section className="space-y-1.5" id="section-how-you-use-opexnal">
              <p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                3. How you use Opexnal (તમે એપનો ઉપયોગ કેવી રીતે કરો છો)
              </p>
              <div className="space-y-1.5">
                <SettingsLink
                  to="/activity"
                  id="link-your-activity"
                  icon={Bell}
                  label="Your activity & history"
                  labelGu="તમારી પ્રવૃત્તિ"
                  hint="Follow requests, interactions, tags & mentions"
                  hintGu="લાઇક્સ, કમેન્ટ્સ, સ્ટોરી રિપ્લાય અને સર્ચ હિસ્ટ્રી"
                />
                <SettingsAction
                  id="action-saved-collections"
                  icon={Bookmark}
                  label="Saved"
                  labelGu="સેવ કરેલું"
                  hint="Private bookmarks, saved posts & audio collections"
                  hintGu="સેવ કરેલા ઓડિયો, રીલ્સ અને પોસ્ટ્સ કલેક્શન"
                  onClick={() => setActiveDialog("saved")}
                />
                <SettingsAction
                  id="action-archive"
                  icon={Archive}
                  label="Archive"
                  labelGu="આર્કાઇવ"
                  hint="Stories archive, past reels & temporary post storage"
                  hintGu="Stories Archive (જૂની સ્ટોરીઝ) અને Posts Archive"
                  onClick={() => setActiveDialog("archive")}
                />
                <SettingsAction
                  id="action-time-spent"
                  icon={Clock}
                  label="Time spent"
                  labelGu="વિતાવેલો સમય"
                  hint="Daily screen time average, break alerts & usage limits"
                  hintGu="ડેઇલી સ્ક્રીન લિમિટ અને બ્રેક રિમાઇન્ડર્સ"
                  onClick={() => setActiveDialog("time_spent")}
                />
                <SettingsAction
                  id="action-notifications"
                  icon={Bell}
                  label="Notifications"
                  labelGu="નોટિફિકેશન્સ"
                  hint="Push notifications, pause all, DMs & live alerts"
                  hintGu="Pause all, Quiet mode (મ્યૂટ સમય) અને એલર્ટ્સ"
                  onClick={() => setActiveDialog("notifications")}
                />
              </div>
            </section>

            {/* 4. Your insights & tools */}
            <section className="space-y-1.5" id="section-your-insights-and-tools">
              <p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                4. Your insights & tools (તમારા ઇનસાઇટ્સ અને ટૂલ્સ)
              </p>
              <div className="space-y-1.5">
                <SettingsLink
                  to="/ai"
                  id="link-ai-studio"
                  icon={Sparkles}
                  label="Opexnal AI Studio"
                  labelGu="AI સ્ટુડિયો"
                  hint="Captions, viral hooks, hashtags, reels co-pilot"
                  hintGu="વાયરલ કેપ્શન્સ, હુક્સ અને હેશટેગ કો-પાઇલટ"
                />
                <SettingsAction
                  id="action-creator-insights"
                  icon={BarChart3}
                  label="Creator insights & analytics"
                  labelGu="પ્રોફેશનલ ડેશબોર્ડ"
                  hint="7-day reach, profile visits, engagement & followers"
                  hintGu="રીચ, એન્ગેજમેન્ટ અને ફોલોઅર્સ એનાલિટિક્સ"
                  onClick={() => setActiveDialog("insights")}
                />
                <SettingsAction
                  id="action-branded-content"
                  icon={DollarSign}
                  label="Branded content & partnerships"
                  labelGu="બ્રાન્ડેડ કન્ટેન્ટ"
                  hint="Commercial tags, paid partnership approvals & disclosures"
                  hintGu="પેઇડ પાર્ટનરશિપ લેબલ અને સ્પોન્સર કંટ્રોલ"
                  onClick={() => setActiveDialog("branded_content")}
                />
                <SettingsAction
                  id="action-account-type"
                  icon={UserCog}
                  label="Account type & professional tools"
                  labelGu="અકાઉન્ટ ટાઇપ અને ટૂલ્સ"
                  hint="Switch between Creator, Personal, and Business"
                  hintGu="પ્રોફેશનલ/ક્રિએટરમાં સ્વિચ કરો અને બ્લુ ટિક"
                  onClick={() => setActiveDialog("account_type")}
                />
              </div>
            </section>

            {/* 5. Subscriptions */}
            <section className="space-y-1.5" id="section-subscriptions">
              <p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                5. Subscriptions (સબસ્ક્રિપ્શન્સ)
              </p>
              <div className="space-y-1.5">
                <SettingsAction
                  id="action-creator-subscriptions"
                  icon={Crown}
                  label="Creator subscriptions"
                  labelGu="ક્રિએટર સબસ્ક્રિપ્શન્સ"
                  hint="Manage fan pricing, subscriber-only reels & benefits"
                  hintGu="ફેન ટિયર્સ અને એક્સક્લૂસિવ રીલ્સ કમાણી"
                  onClick={() => setActiveDialog("creator_subscriptions")}
                />
                <SettingsAction
                  id="action-active-subscriptions"
                  icon={Heart}
                  label="Your active subscriptions"
                  labelGu="સક્રિય સબસ્ક્રિપ્શન્સ"
                  hint="Creators you support, renewal cycles & receipts"
                  hintGu="તમે સપોર્ટ કરેલા ક્રિએટર્સ અને રિન્યુઅલ"
                  onClick={() => setActiveDialog("active_subscriptions")}
                />
                <SettingsAction
                  id="action-subscriber-badges"
                  icon={BadgeCheck}
                  label="Subscriber badges & perks"
                  labelGu="સબસ્ક્રાઇબર બેજ અને લાભો"
                  hint="Custom chat crown, exclusive ring & DM sorting"
                  hintGu="કસ્ટમ ક્રાઉન, એક્સક્લૂસિવ રિંગ અને લાભો"
                  onClick={() => setActiveDialog("subscriber_badges")}
                />
              </div>
            </section>

            {/* 6. Who can see your content */}
            <section className="space-y-1.5" id="section-who-can-see-your-content">
              <p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                6. Who can see your content (તમારું કન્ટેન્ટ કોણ જોઈ શકે છે)
              </p>
              <div className="space-y-1.5">
                <SettingsLink
                  to="/settings/privacy"
                  id="link-account-privacy"
                  icon={Lock}
                  label="Account privacy"
                  labelGu="અકાઉન્ટ પ્રાઇવસી"
                  hint="Private account toggle, mentions & tag permissions"
                  hintGu="પ્રાઇવેટ / પબ્લિક અકાઉન્ટ અને પરમિશન"
                />
                <SettingsAction
                  id="action-close-friends"
                  icon={Users}
                  label="Close Friends"
                  labelGu="ક્લોઝ ફ્રેન્ડ્સ"
                  hint="Curate exclusive green-ring story circle"
                  hintGu="ગ્રીન રિંગ સ્ટોરી શેરિંગ માટે અંગત મિત્રોની યાદી"
                  onClick={() => setActiveDialog("close_friends")}
                />
                <SettingsAction
                  id="action-blocked-accounts"
                  icon={UserX}
                  label="Blocked accounts"
                  labelGu="બ્લોક કરેલા અકાઉન્ટ્સ"
                  hint="View blocked profiles and manage unblocking"
                  hintGu="બ્લોક કરેલા યુઝર્સની યાદી અને અનબ્લોક"
                  onClick={() => setActiveDialog("blocked_accounts")}
                />
                <SettingsAction
                  id="action-hide-story"
                  icon={EyeOff}
                  label="Hide story and live"
                  labelGu="સ્ટોરી અને લાઇવ છુપાવો"
                  hint="Prevent specific users from viewing your stories"
                  hintGu="અમુક યુઝર્સથી સ્ટોરી અને લાઇવ વિડીયો હાઇડ કરવો"
                  onClick={() => setActiveDialog("hide_story")}
                />
              </div>
            </section>

            {/* 7. How others can interact with you */}
            <section className="space-y-1.5" id="section-how-others-can-interact">
              <p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                7. How others can interact with you (બીજા તમારી સાથે કેવી રીતે જોડાઈ શકે)
              </p>
              <div className="space-y-1.5">
                <SettingsLink
                  to="/messages"
                  id="link-messages-replies"
                  icon={MessageSquare}
                  label="Messages and story replies"
                  labelGu="મેસેજીસ અને સ્ટોરી રિપ્લાય"
                  hint="Message requests, read receipts & direct chat permissions"
                  hintGu="મેસેજ રિક્વેસ્ટ અને રીડ રિસિપ્ટ કંટ્રોલ"
                />
                <SettingsLink
                  to="/settings/privacy"
                  id="link-tags-mentions"
                  icon={AtSign}
                  label="Tags and mentions"
                  labelGu="ટેગ્સ અને મેન્શન્સ"
                  hint="Choose who can tag or mention you in posts"
                  hintGu="તમને કોણ ટેગ કે મેન્શન કરી શકે તે નક્કી કરો"
                />
                <SettingsAction
                  id="action-comments-filter"
                  icon={Sliders}
                  label="Comments & hidden words"
                  labelGu="કમેન્ટ્સ અને હિડન વર્ડ્સ"
                  hint="Profanity filter, custom offensive keyword blocklist"
                  hintGu="અપશબ્દો ફિલ્ટર અને કસ્ટમ શબ્દો છુપાવો"
                  onClick={() => setActiveDialog("comment_filter")}
                />
                <SettingsAction
                  id="action-sharing-remixes"
                  icon={Share2}
                  label="Sharing and remixes"
                  labelGu="શેરિંગ અને રીમિક્સ"
                  hint="Allow reels remixing and story resharing"
                  hintGu="રીલ્સ રીમિક્સ અને પોસ્ટ રીશેરિંગ મંજૂરી"
                  onClick={() => setActiveDialog("sharing_remixes")}
                />
                <SettingsAction
                  id="action-restricted-accounts"
                  icon={ShieldCheck}
                  label="Restricted accounts"
                  labelGu="રેસ્ટ્રિક્ટેડ અકાઉન્ટ્સ"
                  hint="Quietly limit interactions without blocking users"
                  hintGu="બ્લોક કર્યા વગર ઇન્ટરેક્શન મર્યાદિત કરો"
                  onClick={() => setActiveDialog("restricted_accounts")}
                />
              </div>
            </section>

            {/* 8. What you see */}
            <section className="space-y-1.5" id="section-what-you-see">
              <p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                8. What you see (તમે શું જુઓ છો)
              </p>
              <div className="space-y-1.5">
                <SettingsAction
                  id="action-favorites"
                  icon={Heart}
                  label="Favorites"
                  labelGu="ફેવરિટ્સ"
                  hint="Prioritize posts from starred creators in feed"
                  hintGu="પસંદીદા ક્રિએટર્સની પોસ્ટ્સ પહેલાં જુઓ"
                  onClick={() => setActiveDialog("favorites")}
                />
                <SettingsAction
                  id="action-muted-accounts"
                  icon={VolumeX}
                  label="Muted accounts"
                  labelGu="મ્યૂટ કરેલા અકાઉન્ટ્સ"
                  hint="Manage muted posts, stories and author notes"
                  hintGu="મ્યૂટ કરેલી સ્ટોરીઝ અને પોસ્ટ્સ મેનેજ કરો"
                  onClick={() => setActiveDialog("muted_accounts")}
                />
                <SettingsAction
                  id="action-content-preferences"
                  icon={Sliders}
                  label="Content preferences"
                  labelGu="કન્ટેન્ટ પ્રેફરન્સ"
                  hint="Sensitive content control & explore recommendation tuning"
                  hintGu="સેન્સિટિવ કન્ટેન્ટ અને એક્સપ્લોર ભલામણો"
                  onClick={() => setActiveDialog("content_preferences")}
                />
                <SettingsAction
                  id="action-like-counts"
                  icon={Heart}
                  label="Like and view counts"
                  labelGu="લાઇક અને વ્યુ કાઉન્ટ્સ છુપાવો"
                  hint="Hide total like and view counts across posts"
                  hintGu="બીજાની પોસ્ટ્સ પર લાઇક્સની સંખ્યા છુપાવો"
                  onClick={() => setActiveDialog("like_counts")}
                />
              </div>
            </section>

            {/* 9. Your app & media */}
            <section className="space-y-1.5" id="section-your-app-and-media">
              <p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                9. Your app & media (તમારી એપ અને મીડિયા)
              </p>
              <div className="space-y-1.5">
                <SettingsAction
                  id="action-device-permissions"
                  icon={Smartphone}
                  label="Device permissions"
                  labelGu="ડિવાઇસ પરમિશન્સ"
                  hint="Camera, microphone, photo library & push notification access"
                  hintGu="કેમેરા, માઇક્રોફોન, ફોટો ગેલેરી અને લોકેશન પરમિશન્સ"
                  onClick={() => setActiveDialog("device_permissions")}
                />
                <SettingsAction
                  id="action-archiving-downloading"
                  icon={Download}
                  label="Archiving and downloading"
                  labelGu="આર્કાઇવિંગ અને ડાઉનલોડિંગ"
                  hint="Auto-save to archive and original camera roll download"
                  hintGu="સ્ટોરીઝ સેવ કરવી અને ઓરિજિનલ ફોટા ડાઉનલોડ"
                  onClick={() => setActiveDialog("archiving_downloading")}
                />
                <SettingsAction
                  id="action-accessibility-captions"
                  icon={Sliders}
                  label="Accessibility & captions"
                  labelGu="એક્સેસિબિલિટી અને કેપ્શન્સ"
                  hint="Auto-generated captions & high-contrast visibility"
                  hintGu="ઓટોમેટિક કેપ્શન્સ અને વિઝ્યુઅલ સેટિંગ્સ"
                  onClick={() => setActiveDialog("accessibility_captions")}
                />
                <SettingsAction
                  id="action-language-region"
                  icon={Languages}
                  label="Language & region"
                  labelGu="ભાષા (Language)"
                  hint="Display language, Hindi, Hinglish & auto-translations"
                  hintGu="ગુજરાતી, હિન્દી, અંગ્રેજી અને પ્રાદેશિક ભાષા"
                  onClick={() => setActiveDialog("language_region")}
                />
                <SettingsAction
                  id="action-data-usage"
                  icon={Wifi}
                  label="Data usage and media quality"
                  labelGu="ડેટા વપરાશ અને મીડિયા ક્વોલિટી"
                  hint="Cellular data saver & upload at highest quality"
                  hintGu="ડેટા સેવર મોડ અને હાઇ-ક્વોલિટી અપલોડ્સ"
                  onClick={() => setActiveDialog("data_usage")}
                />
              </div>
            </section>

            {/* 10. Family Center */}
            <section className="space-y-1.5" id="section-family-center">
              <p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                10. Family Center (પરિવારો માટે / સુપરવિઝન)
              </p>
              <div className="space-y-1.5">
                <SettingsAction
                  id="action-supervision"
                  icon={ShieldCheck}
                  label="Supervision"
                  labelGu="સુપરવિઝન (Supervision)"
                  hint="Parental controls, invite guardian & screen time limits"
                  hintGu="માતા-પિતા માટે સુરક્ષા ટૂલ્સ અને એકાઉન્ટ લિંકિંગ"
                  onClick={() => setActiveDialog("supervision")}
                />
                <SettingsAction
                  id="action-safety-hub"
                  icon={HelpCircle}
                  label="Education & safety hub"
                  labelGu="સેફ્ટી હબ"
                  hint="Teen privacy defaults, guardian safety guides & resources"
                  hintGu="કિશોરો માટે પ્રાઇવસી ગાઇડ અને સેફ્ટી રિસોર્સિસ"
                  onClick={() => setActiveDialog("safety_hub")}
                />
              </div>
            </section>

            {/* 11. Orders & payments */}
            <section className="space-y-1.5" id="section-orders-and-payments">
              <p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                11. Orders & payments (ઓર્ડર્સ અને પેમેન્ટ્સ)
              </p>
              <div className="space-y-1.5">
                <SettingsAction
                  id="action-payment-methods"
                  icon={CreditCard}
                  label="Payment methods"
                  labelGu="પેમેન્ટ પદ્ધતિઓ"
                  hint="Saved cards, UPI, digital wallet & billing address"
                  hintGu="કાર્ડ્સ, UPI અને પેમેન્ટ હિસ્ટ્રી મેનેજ કરો"
                  onClick={() => setActiveDialog("payment_methods")}
                />
                <SettingsAction
                  id="action-order-history"
                  icon={FileText}
                  label="Order history & receipts"
                  labelGu="ઓર્ડર હિસ્ટ્રી"
                  hint="Subscription invoices, creator tips & purchase history"
                  hintGu="સબસ્ક્રિપ્શન રસીદો અને ખરીદીની વિગતો"
                  onClick={() => setActiveDialog("order_history")}
                />
                <SettingsAction
                  id="action-payouts"
                  icon={DollarSign}
                  label="Monetization payouts"
                  labelGu="પેઆઉટ સેટિંગ્સ"
                  hint="Creator balance, direct deposit details & payout schedule"
                  hintGu="બેંક એકાઉન્ટ વિગતો અને કમાણી ઉપાડવી"
                  onClick={() => setActiveDialog("payouts")}
                />
              </div>
            </section>

            {/* 12. More info & support */}
            <section className="space-y-1.5" id="section-more-info-and-support">
              <p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                12. More info & support (વધુ માહિતી અને મદદ)
              </p>
              <div className="space-y-1.5">
                <SettingsAction
                  id="action-help-center"
                  icon={HelpCircle}
                  label="Help Center & FAQs"
                  labelGu="હેલ્પ સેન્ટર"
                  hint="Troubleshooting guides & report a problem"
                  hintGu="વારંવાર પૂછાતા પ્રશ્નો અને સમસ્યા રિપોર્ટ કરો"
                  onClick={() => setActiveDialog("help_center")}
                />
                <SettingsAction
                  id="action-support-requests"
                  icon={ShieldCheck}
                  label="Support requests & appeals"
                  labelGu="સપોર્ટ રિક્વેસ્ટ"
                  hint="Track submitted reports, violations & appeals"
                  hintGu="તમારી સબમિટ કરેલી ફરિયાદો અને અપીલ્સ"
                  onClick={() => setActiveDialog("support_requests")}
                />
                <SettingsAction
                  id="action-about-opexnal"
                  icon={Info}
                  label="About Opexnal"
                  labelGu="અમારા વિશે (About)"
                  hint="Platform release v2.5, AI foundation & credits"
                  hintGu="એપ વર્ઝન, અપડેટ્સ અને લાઇસન્સ"
                  onClick={() => setActiveDialog("about")}
                />
                <SettingsAction
                  id="action-terms-of-service"
                  icon={FileText}
                  label="Terms of Service"
                  labelGu="નિયમો અને શરતો (Terms)"
                  hint="Creator rights, platform guidelines & code of conduct"
                  hintGu="પ્લેટફોર્મ નીતિઓ અને યુઝર ગાઇડલાઇન્સ"
                  onClick={() => setActiveDialog("terms")}
                />
                <SettingsLink
                  to="/settings/privacy"
                  id="link-privacy-policy"
                  icon={Lock}
                  label="Privacy Policy"
                  labelGu="પ્રાઇવસી પોલિસી"
                  hint="Data handling, encryption & cookie preferences"
                  hintGu="ડેટા સુરક્ષા અને કૂકી પોલિસી"
                />
              </div>
            </section>

            {/* 13. Also from Opexnal */}
            <section className="space-y-1.5" id="section-also-from-opexnal">
              <p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                13. Also from Opexnal (Opexnal તરફથી અન્ય)
              </p>
              <div className="space-y-1.5">
                <SettingsLink
                  to="/ai"
                  id="link-opexnal-ai-suite"
                  icon={Sparkles}
                  label="Opexnal AI Suite"
                  labelGu="AI ટૂલ્સ"
                  hint="Multimodal generative AI creator engine"
                  hintGu="મલ્ટીમોડલ આર્ટિફિશિયલ ઇન્ટેલિજન્સ એન્જિન"
                />
                <SettingsLink
                  to="/messages"
                  id="link-opexnal-messenger"
                  icon={MessageCircle}
                  label="Opexnal Messenger"
                  labelGu="મેસેન્જર"
                  hint="Fast, direct and encrypted social messaging"
                  hintGu="સુરક્ષિત અને ઝડપી મેસેજિંગ"
                />
                <SettingsAction
                  id="action-creator-web"
                  icon={Smartphone}
                  label="Opexnal Studio for Web"
                  labelGu="વેબ સ્ટુડિયો"
                  hint="Desktop publishing, post scheduling & bulk uploads"
                  hintGu="ડેસ્કટોપ પબ્લિશિંગ અને પોસ્ટ શેડ્યુલિંગ"
                  onClick={() => setActiveDialog("creator_web")}
                />
              </div>
            </section>

            {/* 14. Login */}
            <section className="space-y-2 pt-2" id="section-login">
              <p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                14. Login & Account Management (લોગિન અને એકાઉન્ટ વ્યવસ્થાપન)
              </p>
              <div className="space-y-1.5">
                <SettingsAction
                  id="action-download-data"
                  icon={Download}
                  label="Download your data"
                  labelGu="તમારી માહિતી ડાઉનલોડ કરો"
                  hint="Request a machine-readable JSON or HTML export of your data"
                  hintGu="તમારા ફોટા, વિડીયો અને એકાઉન્ટ ડેટાની નકલ મેળવો"
                  onClick={() => setActiveDialog("download_data")}
                />
                <SettingsAction
                  id="action-recently-deleted"
                  icon={History}
                  label="Recently deleted"
                  labelGu="તાજેતરમાં ડિલીટ કરેલું"
                  hint="Review, restore, or permanently remove items deleted within 30 days"
                  hintGu="30 દિવસમાં ડિલીટ કરેલું કન્ટેન્ટ પાછું મેળવો"
                  onClick={() => setActiveDialog("recently_deleted")}
                />
                <SettingsAction
                  id="action-active-sessions"
                  icon={Laptop}
                  label="Active login sessions"
                  labelGu="કયા ડિવાઇસમાં લોગિન છે તે જોવું"
                  hint="Review active devices, web browsers, and locations signed into your account"
                  hintGu="સક્રિય ડિવાઇસ, લોકેશન્સ અને લોગિન એલર્ટ્સ"
                  onClick={() => setActiveDialog("active_sessions")}
                />
                <SettingsAction
                  id="action-deactivate-account"
                  icon={AlertTriangle}
                  label="Deactivate or delete account"
                  labelGu="અકાઉન્ટ ડિલીટ કે ડીએક્ટિવેટ કરવું"
                  hint="Temporarily pause your presence or permanently delete your profile"
                  hintGu="ઓનરશિપ કંટ્રોલ: અસ્થાયી ડીએક્ટિવેટ અથવા કાયમી ડિલીટ"
                  onClick={() => setActiveDialog("deactivate_account")}
                />
                <SettingsAction
                  id="action-add-account"
                  icon={UserPlus}
                  label="Add account"
                  labelGu="નવું એકાઉન્ટ ઉમેરો"
                  hint="Log into an existing secondary creator account"
                  hintGu="બીજું એકાઉન્ટ લોગિન કરો અથવા લિંક કરો"
                  onClick={() => setActiveDialog("add_account")}
                />
                <SettingsAction
                  id="action-switch-account"
                  icon={RefreshCw}
                  label="Switch accounts"
                  labelGu="એકાઉન્ટ સ્વિચ કરો"
                  hint="Seamlessly switch active profile session"
                  hintGu="સરળતાથી પ્રોફાઇલ્સ વચ્ચે બદલો"
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
  labelGu,
  hint,
  hintGu,
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
  labelGu?: string;
  hint: string;
  hintGu?: string;
}) {
  return (
    <Link
      to={to}
      id={id}
      className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3.5 transition-colors hover:bg-secondary cursor-pointer"
    >
      <Icon className="h-5 w-5 text-primary shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="text-sm font-semibold">{label}</p>
          {labelGu && (
            <span className="text-xs text-muted-foreground font-normal">({labelGu})</span>
          )}
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {hintGu ? `${hint} • ${hintGu}` : hint}
        </p>
      </div>
      <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
    </Link>
  );
}

function SettingsAction({
  id,
  icon: Icon,
  label,
  labelGu,
  hint,
  hintGu,
  onClick,
}: {
  id?: string;
  icon: LucideIcon;
  label: string;
  labelGu?: string;
  hint: string;
  hintGu?: string;
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
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="text-sm font-semibold text-foreground">{label}</p>
          {labelGu && (
            <span className="text-xs text-muted-foreground font-normal">({labelGu})</span>
          )}
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {hintGu ? `${hint} • ${hintGu}` : hint}
        </p>
      </div>
      <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
    </button>
  );
}
