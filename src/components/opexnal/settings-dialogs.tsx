import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  Sparkles,
  ShieldCheck,
  Lock,
  Bell,
  Clock,
  Bookmark,
  Archive,
  BarChart3,
  DollarSign,
  Users,
  UserX,
  EyeOff,
  MessageSquare,
  Share2,
  Heart,
  VolumeX,
  Smartphone,
  Download,
  Languages,
  Wifi,
  CreditCard,
  HelpCircle,
  Info,
  FileText,
  UserPlus,
  RefreshCw,
  BadgeCheck,
  Check,
  CheckCircle2,
  Trash2,
  ExternalLink,
  Crown,
  Search,
  Sliders,
  AlertTriangle,
  Key,
  Laptop,
  History,
  Calendar,
  ArrowUpRight,
  ShieldAlert,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import {
  getStoredSettings,
  saveSettings,
  type OpexnalSettings,
  type RecentlyDeletedItem,
  type ActiveSession,
} from "@/lib/settings-store";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export type SettingsDialogType =
  | "personal_details"
  | "account_status"
  | "accounts_center"
  | "ad_preferences"
  | "saved"
  | "archive"
  | "time_spent"
  | "notifications"
  | "insights"
  | "branded_content"
  | "account_type"
  | "creator_subscriptions"
  | "active_subscriptions"
  | "subscriber_badges"
  | "close_friends"
  | "blocked_accounts"
  | "hide_story"
  | "comment_filter"
  | "sharing_remixes"
  | "restricted_accounts"
  | "favorites"
  | "muted_accounts"
  | "content_preferences"
  | "like_counts"
  | "device_permissions"
  | "archiving_downloading"
  | "accessibility_captions"
  | "language_region"
  | "data_usage"
  | "supervision"
  | "safety_hub"
  | "payment_methods"
  | "order_history"
  | "payouts"
  | "help_center"
  | "support_requests"
  | "about"
  | "terms"
  | "creator_web"
  | "add_account"
  | "switch_account"
  | "download_data"
  | "recently_deleted"
  | "deactivate_account"
  | "active_sessions"
  | "logout_confirm"
  | "logout_all_confirm"
  | null;

interface SettingsModalProps {
  dialog: SettingsDialogType;
  onClose: () => void;
  username?: string;
  onSignOut: () => void;
  onSignOutAll: () => void;
}

export function SettingsDialogContainer({
  dialog,
  onClose,
  username = "creator",
  onSignOut,
  onSignOutAll,
}: SettingsModalProps) {
  if (!dialog) return null;

  return (
    <Dialog open={Boolean(dialog)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto rounded-3xl p-5 sm:p-6 bg-card border-border">
        {dialog === "personal_details" && (
          <PersonalDetailsModal username={username} onClose={onClose} />
        )}
        {dialog === "account_status" && (
          <AccountStatusModal username={username} onClose={onClose} />
        )}
        {dialog === "accounts_center" && (
          <AccountsCenterModal username={username} onClose={onClose} />
        )}
        {dialog === "ad_preferences" && <AdPreferencesModal onClose={onClose} />}
        {dialog === "saved" && <SavedModal onClose={onClose} />}
        {dialog === "archive" && <ArchiveModal onClose={onClose} />}
        {dialog === "time_spent" && <TimeSpentModal onClose={onClose} />}
        {dialog === "notifications" && <NotificationsModal onClose={onClose} />}
        {dialog === "insights" && <InsightsModal onClose={onClose} />}
        {dialog === "branded_content" && <BrandedContentModal onClose={onClose} />}
        {dialog === "account_type" && <AccountTypeModal onClose={onClose} />}
        {dialog === "creator_subscriptions" && <CreatorSubscriptionsModal onClose={onClose} />}
        {dialog === "active_subscriptions" && <ActiveSubscriptionsModal onClose={onClose} />}
        {dialog === "subscriber_badges" && <SubscriberBadgesModal onClose={onClose} />}
        {dialog === "close_friends" && <CloseFriendsModal onClose={onClose} />}
        {dialog === "blocked_accounts" && <BlockedAccountsModal onClose={onClose} />}
        {dialog === "hide_story" && <HideStoryModal onClose={onClose} />}
        {dialog === "comment_filter" && <CommentFilterModal onClose={onClose} />}
        {dialog === "sharing_remixes" && <SharingRemixesModal onClose={onClose} />}
        {dialog === "restricted_accounts" && <RestrictedAccountsModal onClose={onClose} />}
        {dialog === "favorites" && <FavoritesModal onClose={onClose} />}
        {dialog === "muted_accounts" && <MutedAccountsModal onClose={onClose} />}
        {dialog === "content_preferences" && <ContentPreferencesModal onClose={onClose} />}
        {dialog === "like_counts" && <LikeCountsModal onClose={onClose} />}
        {dialog === "device_permissions" && <DevicePermissionsModal onClose={onClose} />}
        {dialog === "archiving_downloading" && <ArchivingDownloadingModal onClose={onClose} />}
        {dialog === "accessibility_captions" && <AccessibilityCaptionsModal onClose={onClose} />}
        {dialog === "language_region" && <LanguageRegionModal onClose={onClose} />}
        {dialog === "data_usage" && <DataUsageModal onClose={onClose} />}
        {dialog === "supervision" && <SupervisionModal onClose={onClose} />}
        {dialog === "safety_hub" && <SafetyHubModal onClose={onClose} />}
        {dialog === "payment_methods" && <PaymentMethodsModal onClose={onClose} />}
        {dialog === "order_history" && <OrderHistoryModal onClose={onClose} />}
        {dialog === "payouts" && <PayoutsModal onClose={onClose} />}
        {dialog === "help_center" && <HelpCenterModal onClose={onClose} />}
        {dialog === "support_requests" && <SupportRequestsModal onClose={onClose} />}
        {dialog === "about" && <AboutModal onClose={onClose} />}
        {dialog === "terms" && <TermsModal onClose={onClose} />}
        {dialog === "creator_web" && <CreatorWebModal onClose={onClose} />}
        {dialog === "add_account" && <AddAccountModal onClose={onClose} />}
        {dialog === "switch_account" && (
          <SwitchAccountModal username={username} onClose={onClose} />
        )}
        {dialog === "download_data" && <DownloadDataModal onClose={onClose} />}
        {dialog === "recently_deleted" && <RecentlyDeletedModal onClose={onClose} />}
        {dialog === "deactivate_account" && <DeactivateAccountModal onClose={onClose} />}
        {dialog === "active_sessions" && <ActiveSessionsModal onClose={onClose} />}
        {dialog === "logout_confirm" && (
          <LogoutConfirmModal onSignOut={onSignOut} onClose={onClose} />
        )}
        {dialog === "logout_all_confirm" && (
          <LogoutAllConfirmModal onSignOutAll={onSignOutAll} onClose={onClose} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function PersonalDetailsModal({ username, onClose }: { username: string; onClose: () => void }) {
  const [email, setEmail] = useState(() => localStorage.getItem("opexnal_user_email") || "");
  const [phone, setPhone] = useState(() => localStorage.getItem("opexnal_user_phone") || "");
  const [birthday, setBirthday] = useState(() => localStorage.getItem("opexnal_user_dob") || "");

  function save() {
    localStorage.setItem("opexnal_user_email", email);
    localStorage.setItem("opexnal_user_phone", phone);
    localStorage.setItem("opexnal_user_dob", birthday);
    toast.success("Personal details updated");
    onClose();
  }

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle className="text-lg font-bold">Personal Details</DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground">
          Opexnal uses this information to keep your account secure and verified.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-3 pt-2">
        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground">Contact Email</label>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-xl" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground">Phone Number</label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded-xl" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground">Date of Birth</label>
          <Input
            type="date"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
            className="rounded-xl"
          />
        </div>
        <div className="rounded-xl bg-secondary/50 p-3 text-xs text-muted-foreground flex items-center justify-between">
          <span>Account Ownership & Confirmation</span>
          <Badge variant="outline" className="text-emerald-500 border-emerald-500/30">
            Verified
          </Badge>
        </div>
      </div>
      <div className="flex gap-2 pt-3">
        <Button variant="outline" className="flex-1 rounded-xl" onClick={onClose}>
          Cancel
        </Button>
        <Button className="flex-1 rounded-xl" onClick={save}>
          Save Changes
        </Button>
      </div>
    </div>
  );
}

function AccountStatusModal({ username, onClose }: { username: string; onClose: () => void }) {
  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle className="text-lg font-bold">Account Status</DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground">
          Track policy standing, community standards, and monetization eligibility for @{username}.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-2.5 pt-2">
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
          <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
          <div className="text-xs">
            <p className="font-semibold text-emerald-600 dark:text-emerald-400">
              Community Guidelines: Clean
            </p>
            <p className="text-muted-foreground">You have zero strikes or reported violations.</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-primary/10 border border-primary/20">
          <BadgeCheck className="h-5 w-5 text-primary shrink-0" />
          <div className="text-xs">
            <p className="font-semibold text-foreground">Creator Monetization: Eligible</p>
            <p className="text-muted-foreground">
              Subscription gifts and brand partnerships are unlocked.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-secondary border border-border">
          <ShieldCheck className="h-5 w-5 text-muted-foreground shrink-0" />
          <div className="text-xs">
            <p className="font-semibold text-foreground">Search Recommendation: Recommended</p>
            <p className="text-muted-foreground">
              Your content is eligible to be shown in Explore and Reels.
            </p>
          </div>
        </div>
      </div>
      <Button className="w-full rounded-xl mt-2" onClick={onClose}>
        Understood
      </Button>
    </div>
  );
}

function AccountsCenterModal({ username, onClose }: { username: string; onClose: () => void }) {
  const [crossPost, setCrossPost] = useState(
    () => localStorage.getItem("opexnal_crosspost") === "true",
  );

  function toggleCrossPost(checked: boolean) {
    setCrossPost(checked);
    localStorage.setItem("opexnal_crosspost", String(checked));
    toast.success(
      checked ? "Cross-posting to connected accounts enabled" : "Cross-posting disabled",
    );
  }

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle className="text-lg font-bold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Opexnal Accounts Center
        </DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground">
          Manage connected profiles, synchronized experiences, and identity settings across
          platforms.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-3 pt-1">
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center font-bold text-sm text-primary">
                {username[0]?.toUpperCase() || "O"}
              </div>
              <div>
                <p className="text-sm font-semibold">@{username}</p>
                <p className="text-[11px] text-muted-foreground">Primary Opexnal Profile</p>
              </div>
            </div>
            <Badge variant="secondary">Active</Badge>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 rounded-2xl border border-border bg-surface">
          <div>
            <p className="text-xs font-semibold">Cross-Posting & Stories Sync</p>
            <p className="text-[11px] text-muted-foreground">
              Automatically share reels and stories to connected networks
            </p>
          </div>
          <Switch checked={crossPost} onCheckedChange={toggleCrossPost} />
        </div>

        <div className="flex items-center justify-between p-3 rounded-2xl border border-border bg-surface">
          <div>
            <p className="text-xs font-semibold">Sync Name & Profile Picture</p>
            <p className="text-[11px] text-muted-foreground">
              Keep avatar and display name updated across services
            </p>
          </div>
          <Switch
            defaultChecked
            onCheckedChange={(val) =>
              toast.success(val ? "Profile sync active" : "Profile sync stopped")
            }
          />
        </div>
      </div>
      <Button className="w-full rounded-xl" onClick={onClose}>
        Close Accounts Center
      </Button>
    </div>
  );
}

function AdPreferencesModal({ onClose }: { onClose: () => void }) {
  const [personalized, setPersonalized] = useState(
    () => localStorage.getItem("opexnal_personalized_ads") !== "false",
  );

  function toggle(val: boolean) {
    setPersonalized(val);
    localStorage.setItem("opexnal_personalized_ads", String(val));
    toast.success(val ? "Personalized recommendations enabled" : "Generic ad delivery enabled");
  }

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle className="text-lg font-bold">Personal Details & Ad Preferences</DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground">
          Control how your interests and creator interactions shape sponsored posts and
          recommendations.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between p-3 rounded-2xl border border-border bg-surface">
          <div>
            <p className="text-xs font-semibold">Interest-Based Ads</p>
            <p className="text-[11px] text-muted-foreground">
              Show brand sponsorships relevant to your content tags
            </p>
          </div>
          <Switch checked={personalized} onCheckedChange={toggle} />
        </div>
        <div className="p-3 rounded-2xl border border-border bg-secondary/30 space-y-1.5">
          <p className="text-xs font-semibold">Top Creator Topics</p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {["Technology", "Photography", "AI & Design", "Music", "Travel"].map((topic) => (
              <Badge key={topic} variant="outline" className="text-[11px]">
                {topic}
              </Badge>
            ))}
          </div>
        </div>
      </div>
      <Button className="w-full rounded-xl" onClick={onClose}>
        Done
      </Button>
    </div>
  );
}

function SavedModal({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<"posts" | "audio" | "collections">("posts");

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle className="text-lg font-bold flex items-center gap-2">
          <Bookmark className="h-5 w-5 text-primary" />
          Saved & Collections
        </DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground">
          Only you can see what you have saved in your private bookmarks.
        </DialogDescription>
      </DialogHeader>
      <div className="flex gap-2 border-b border-border pb-2">
        {(["posts", "audio", "collections"] as const).map((t) => (
          <Button
            key={t}
            variant={tab === t ? "secondary" : "ghost"}
            size="sm"
            className="capitalize rounded-xl text-xs"
            onClick={() => setTab(t)}
          >
            {t}
          </Button>
        ))}
      </div>
      <div className="py-6 text-center space-y-2">
        <Bookmark className="h-8 w-8 text-muted-foreground/50 mx-auto" />
        <p className="text-sm font-semibold">All Saved Items</p>
        <p className="text-xs text-muted-foreground max-w-xs mx-auto">
          Posts, reels, and audio tracks you bookmark while exploring Opexnal will appear here.
        </p>
      </div>
      <Button className="w-full rounded-xl" onClick={onClose}>
        Back to Settings
      </Button>
    </div>
  );
}

function ArchiveModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle className="text-lg font-bold flex items-center gap-2">
          <Archive className="h-5 w-5 text-primary" />
          Archive
        </DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground">
          Archived stories, reels, and posts are safely preserved and visible only to you.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-2 pt-1">
        <div className="p-3 rounded-2xl border border-border bg-surface flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold">Stories Archive</p>
            <p className="text-[11px] text-muted-foreground">Automatic 24-hour retention enabled</p>
          </div>
          <Badge variant="outline" className="text-emerald-500">
            Active
          </Badge>
        </div>
        <div className="p-3 rounded-2xl border border-border bg-surface flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold">Posts & Reels Archive</p>
            <p className="text-[11px] text-muted-foreground">
              Temporarily unpublish without deleting
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl text-xs"
            onClick={() => toast.info("No posts currently archived")}
          >
            View
          </Button>
        </div>
      </div>
      <Button className="w-full rounded-xl" onClick={onClose}>
        Done
      </Button>
    </div>
  );
}

function TimeSpentModal({ onClose }: { onClose: () => void }) {
  const [reminderMin, setReminderMin] = useState(
    () => localStorage.getItem("opexnal_time_reminder") || "30",
  );
  const [breakEnabled, setBreakEnabled] = useState(
    () => localStorage.getItem("opexnal_break_reminders") !== "false",
  );

  function save() {
    localStorage.setItem("opexnal_time_reminder", reminderMin);
    localStorage.setItem("opexnal_break_reminders", String(breakEnabled));
    toast.success("Time management goals updated");
    onClose();
  }

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle className="text-lg font-bold flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Time Spent & Digital Wellbeing
        </DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground">
          Monitor your time on Opexnal and configure mindful break alerts.
        </DialogDescription>
      </DialogHeader>
      <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 text-center space-y-1">
        <p className="text-[11px] font-semibold text-primary uppercase tracking-wider">
          Daily Average
        </p>
        <p className="text-3xl font-extrabold text-foreground">24m</p>
        <p className="text-xs text-muted-foreground">
          You spent 12% less time this week compared to last week.
        </p>
      </div>
      <div className="space-y-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground">Daily Usage Reminder</label>
          <div className="flex gap-2">
            {["15", "30", "45", "60"].map((min) => (
              <Button
                key={min}
                type="button"
                variant={reminderMin === min ? "default" : "outline"}
                size="sm"
                className="flex-1 rounded-xl text-xs"
                onClick={() => setReminderMin(min)}
              >
                {min}m
              </Button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between p-3 rounded-2xl border border-border bg-surface">
          <div>
            <p className="text-xs font-semibold">Take a Break Notifications</p>
            <p className="text-[11px] text-muted-foreground">
              Reminder to step away after 20 minutes of scrolling
            </p>
          </div>
          <Switch checked={breakEnabled} onCheckedChange={setBreakEnabled} />
        </div>
      </div>
      <Button className="w-full rounded-xl" onClick={save}>
        Save Preferences
      </Button>
    </div>
  );
}

function NotificationsModal({ onClose }: { onClose: () => void }) {
  const [pauseAll, setPauseAll] = useState(
    () => localStorage.getItem("opexnal_notif_pause") === "true",
  );
  const [likes, setLikes] = useState(true);
  const [comments, setComments] = useState(true);
  const [messages, setMessages] = useState(true);
  const [reels, setReels] = useState(true);

  function togglePause(checked: boolean) {
    setPauseAll(checked);
    localStorage.setItem("opexnal_notif_pause", String(checked));
    toast.success(checked ? "All push notifications paused" : "Push notifications resumed");
  }

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle className="text-lg font-bold flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          Notification Preferences
        </DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground">
          Choose what alerts reach your device and email inbox.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between p-3 rounded-2xl border border-primary/30 bg-primary/5">
          <div>
            <p className="text-xs font-bold text-foreground">Pause All Notifications</p>
            <p className="text-[11px] text-muted-foreground">
              Temporarily silence all activity pushes
            </p>
          </div>
          <Switch checked={pauseAll} onCheckedChange={togglePause} />
        </div>
        <div className="flex items-center justify-between p-3 rounded-2xl border border-border bg-surface">
          <span className="text-xs font-semibold">Likes & Reactions</span>
          <Switch checked={likes && !pauseAll} disabled={pauseAll} onCheckedChange={setLikes} />
        </div>
        <div className="flex items-center justify-between p-3 rounded-2xl border border-border bg-surface">
          <span className="text-xs font-semibold">Comments & Replies</span>
          <Switch
            checked={comments && !pauseAll}
            disabled={pauseAll}
            onCheckedChange={setComments}
          />
        </div>
        <div className="flex items-center justify-between p-3 rounded-2xl border border-border bg-surface">
          <span className="text-xs font-semibold">Direct Messages & Chats</span>
          <Switch
            checked={messages && !pauseAll}
            disabled={pauseAll}
            onCheckedChange={setMessages}
          />
        </div>
        <div className="flex items-center justify-between p-3 rounded-2xl border border-border bg-surface">
          <span className="text-xs font-semibold">Reels & Live Broadcasts</span>
          <Switch checked={reels && !pauseAll} disabled={pauseAll} onCheckedChange={setReels} />
        </div>
      </div>
      <Button className="w-full rounded-xl" onClick={onClose}>
        Done
      </Button>
    </div>
  );
}

function InsightsModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle className="text-lg font-bold flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Creator Insights & Analytics
        </DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground">
          Performance metrics over the last 7 days for your profile and stories.
        </DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-2 gap-2.5 pt-1">
        <div className="p-3 rounded-2xl bg-secondary/50 border border-border">
          <p className="text-[11px] text-muted-foreground">Accounts Reached</p>
          <p className="text-xl font-bold text-foreground">14,280</p>
          <span className="text-[10px] text-emerald-500 font-semibold">+18.4% vs last week</span>
        </div>
        <div className="p-3 rounded-2xl bg-secondary/50 border border-border">
          <p className="text-[11px] text-muted-foreground">Interactions</p>
          <p className="text-xl font-bold text-foreground">1,894</p>
          <span className="text-[10px] text-emerald-500 font-semibold">+9.2% engagement</span>
        </div>
        <div className="p-3 rounded-2xl bg-secondary/50 border border-border">
          <p className="text-[11px] text-muted-foreground">Profile Visits</p>
          <p className="text-xl font-bold text-foreground">640</p>
          <span className="text-[10px] text-primary font-semibold">Top referral: Reels</span>
        </div>
        <div className="p-3 rounded-2xl bg-secondary/50 border border-border">
          <p className="text-[11px] text-muted-foreground">New Followers</p>
          <p className="text-xl font-bold text-foreground">+85</p>
          <span className="text-[10px] text-emerald-500 font-semibold">98% organic</span>
        </div>
      </div>
      <Button className="w-full rounded-xl" onClick={onClose}>
        Close Insights
      </Button>
    </div>
  );
}

function BrandedContentModal({ onClose }: { onClose: () => void }) {
  const [requireApproval, setRequireApproval] = useState(true);

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle className="text-lg font-bold flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          Branded Content & Partnerships
        </DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground">
          Tools for commercial tags, paid partnership disclosures, and brand partner approvals.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between p-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
          <div>
            <p className="text-xs font-semibold text-foreground">Partnership Eligibility Status</p>
            <p className="text-[11px] text-muted-foreground">
              Compliant with Opexnal Branded Content policies
            </p>
          </div>
          <Badge variant="outline" className="text-emerald-500 border-emerald-500/30">
            Eligible
          </Badge>
        </div>
        <div className="flex items-center justify-between p-3 rounded-2xl border border-border bg-surface">
          <div>
            <p className="text-xs font-semibold">Require Brand Partner Approval</p>
            <p className="text-[11px] text-muted-foreground">
              Only approved brand tags can feature your content
            </p>
          </div>
          <Switch checked={requireApproval} onCheckedChange={setRequireApproval} />
        </div>
      </div>
      <Button className="w-full rounded-xl" onClick={onClose}>
        Done
      </Button>
    </div>
  );
}

function AccountTypeModal({ onClose }: { onClose: () => void }) {
  const [type, setType] = useState(() => localStorage.getItem("opexnal_account_type") || "Creator");

  function selectType(newType: string) {
    setType(newType);
    localStorage.setItem("opexnal_account_type", newType);
    toast.success(`Account switched to ${newType}`);
    onClose();
  }

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle className="text-lg font-bold">Account Type & Professional Tools</DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground">
          Choose the account configuration that best matches your workflow.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-2 pt-1">
        {[
          {
            id: "Creator",
            title: "Creator Account",
            desc: "Best for influencers, artists, filmmakers & content producers",
          },
          {
            id: "Business",
            title: "Business Account",
            desc: "Best for retailers, local businesses, brands & organizations",
          },
          {
            id: "Personal",
            title: "Personal Account",
            desc: "Standard private or casual personal social profile",
          },
        ].map((item) => (
          <div
            key={item.id}
            onClick={() => selectType(item.id)}
            className={`p-3.5 rounded-2xl border cursor-pointer transition-colors flex items-center justify-between ${
              type === item.id
                ? "border-primary bg-primary/10"
                : "border-border bg-surface hover:bg-secondary"
            }`}
          >
            <div>
              <p className="text-xs font-bold text-foreground">{item.title}</p>
              <p className="text-[11px] text-muted-foreground">{item.desc}</p>
            </div>
            {type === item.id && <Check className="h-4 w-4 text-primary" />}
          </div>
        ))}
      </div>
    </div>
  );
}

function CreatorSubscriptionsModal({ onClose }: { onClose: () => void }) {
  const [price, setPrice] = useState("4.99");
  const [enabled, setEnabled] = useState(true);

  return (
    <div className="space-y-4">
      <DialogHeader>
        <div className="flex items-center justify-between gap-2">
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-500" />
            Creator Subscriptions
          </DialogTitle>
          <Badge
            variant="outline"
            className="border-amber-500/40 text-amber-600 dark:text-amber-400 text-[10px] uppercase font-bold tracking-wider"
          >
            NEEDS PAYMENT PROVIDER CONFIGURATION
          </Badge>
        </div>
        <DialogDescription className="text-xs text-muted-foreground">
          Offer monthly subscriber-only stories, exclusive reels, and badges to supporters.
        </DialogDescription>
      </DialogHeader>

      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs space-y-1">
        <p className="font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5" />
          Server-Authoritative Billing Notice
        </p>
        <p className="text-muted-foreground text-[11px] leading-relaxed">
          Creator tier pricing and subscriber-exclusive access are validated server-side. Live
          payment processing and automated recurring renewals require an active Stripe Connect or
          payment gateway integration.
        </p>
      </div>

      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between p-3 rounded-2xl border border-border bg-surface">
          <div>
            <p className="text-xs font-semibold">Enable Fan Subscriptions</p>
            <p className="text-[11px] text-muted-foreground">
              Allow followers to subscribe monthly
            </p>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground">Monthly Subscription Tier</label>
          <div className="flex gap-2">
            {["2.99", "4.99", "9.99"].map((p) => (
              <Button
                key={p}
                variant={price === p ? "default" : "outline"}
                size="sm"
                className="flex-1 rounded-xl"
                onClick={() => setPrice(p)}
              >
                ${p}/mo
              </Button>
            ))}
          </div>
        </div>
      </div>
      <Button
        className="w-full rounded-xl"
        onClick={() => {
          toast.success("Subscription configuration saved (Awaiting payment gateway activation)");
          onClose();
        }}
      >
        Save Subscription Configuration
      </Button>
    </div>
  );
}

function ActiveSubscriptionsModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="space-y-4">
      <DialogHeader>
        <div className="flex items-center justify-between gap-2">
          <DialogTitle className="text-lg font-bold">Your Active Subscriptions</DialogTitle>
          <Badge
            variant="outline"
            className="border-amber-500/40 text-amber-600 dark:text-amber-400 text-[10px] uppercase font-bold tracking-wider"
          >
            NEEDS PAYMENT PROVIDER CONFIGURATION
          </Badge>
        </div>
        <DialogDescription className="text-xs text-muted-foreground">
          Manage creators you support, Opexnal One / Plus plans, and active billing cycles.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-2 pt-1">
        <div className="p-3.5 rounded-2xl border border-primary/20 bg-primary/5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center font-bold text-sm text-primary">
              ★
            </div>
            <div>
              <p className="text-xs font-semibold">Opexnal One Membership</p>
              <p className="text-[11px] text-muted-foreground">
                $9.99/mo • AI Studio Pro + 4K HD Uploads
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="text-[10px]">
            Server Preview
          </Badge>
        </div>

        <div className="p-3.5 rounded-2xl border border-border bg-surface flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center font-bold text-sm text-foreground">
              A
            </div>
            <div>
              <p className="text-xs font-semibold">@alex_creative</p>
              <p className="text-[11px] text-muted-foreground">$4.99/mo • Renews in 18 days</p>
            </div>
          </div>
          <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 text-[10px]">
            Active
          </Badge>
        </div>
      </div>

      <Button className="w-full rounded-xl" onClick={onClose}>
        Done
      </Button>
    </div>
  );
}

function SubscriberBadgesModal({ onClose }: { onClose: () => void }) {
  const [badgeVisible, setBadgeVisible] = useState(true);

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle className="text-lg font-bold flex items-center gap-2">
          <Crown className="h-5 w-5 text-purple-500" />
          Subscriber Badges & Perks
        </DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground">
          Custom badges displayed beside your name in comments and direct messages.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between p-3 rounded-2xl border border-border bg-surface">
          <div>
            <p className="text-xs font-semibold">Display Subscriber Crown</p>
            <p className="text-[11px] text-muted-foreground">
              Show badge beside comments on creator posts
            </p>
          </div>
          <Switch checked={badgeVisible} onCheckedChange={setBadgeVisible} />
        </div>
        <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-700 dark:text-purple-300">
          Exclusive subscriber perks include priority DM inbox placement and subscriber broadcast
          channels.
        </div>
      </div>
      <Button className="w-full rounded-xl" onClick={onClose}>
        Understood
      </Button>
    </div>
  );
}

function CloseFriendsModal({ onClose }: { onClose: () => void }) {
  const [friends, setFriends] = useState([
    { username: "sophia_v", name: "Sophia Vance", selected: true },
    { username: "dev_raj", name: "Raj Sharma", selected: true },
    { username: "elena_lens", name: "Elena Rostova", selected: false },
    { username: "marcus_k", name: "Marcus Klein", selected: false },
  ]);

  function toggle(user: string) {
    setFriends((prev) =>
      prev.map((f) => (f.username === user ? { ...f, selected: !f.selected } : f)),
    );
  }

  function save() {
    toast.success(
      `Close Friends list updated (${friends.filter((f) => f.selected).length} accounts)`,
    );
    onClose();
  }

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle className="text-lg font-bold flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-emerald-500 inline-block" />
          Close Friends
        </DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground">
          We do not send notifications when you add or remove people from Close Friends.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-2 pt-1 max-h-56 overflow-y-auto">
        {friends.map((friend) => (
          <div
            key={friend.username}
            onClick={() => toggle(friend.username)}
            className="flex items-center justify-between p-2.5 rounded-2xl border border-border bg-surface hover:bg-secondary cursor-pointer"
          >
            <div>
              <p className="text-xs font-semibold">{friend.name}</p>
              <p className="text-[11px] text-muted-foreground">@{friend.username}</p>
            </div>
            <div
              className={`h-5 w-5 rounded-full border flex items-center justify-center ${friend.selected ? "bg-emerald-500 border-emerald-500 text-white" : "border-muted-foreground"}`}
            >
              {friend.selected && <Check className="h-3 w-3" />}
            </div>
          </div>
        ))}
      </div>
      <Button className="w-full rounded-xl" onClick={save}>
        Save Close Friends
      </Button>
    </div>
  );
}

function BlockedAccountsModal({ onClose }: { onClose: () => void }) {
  const [blocked, setBlocked] = useState(["spam_bot_09", "promo_aggregator_22"]);

  function unblock(u: string) {
    setBlocked((prev) => prev.filter((b) => b !== u));
    toast.success(`@${u} unblocked`);
  }

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle className="text-lg font-bold flex items-center gap-2">
          <UserX className="h-5 w-5 text-destructive" />
          Blocked Accounts
        </DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground">
          Blocked accounts cannot find your profile, posts, or stories on Opexnal.
        </DialogDescription>
      </DialogHeader>
      {blocked.length === 0 ? (
        <div className="py-8 text-center text-xs text-muted-foreground">
          You haven't blocked any accounts.
        </div>
      ) : (
        <div className="space-y-2 pt-1">
          {blocked.map((b) => (
            <div
              key={b}
              className="flex items-center justify-between p-3 rounded-2xl border border-border bg-surface"
            >
              <span className="text-xs font-semibold">@{b}</span>
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl text-xs h-7"
                onClick={() => unblock(b)}
              >
                Unblock
              </Button>
            </div>
          ))}
        </div>
      )}
      <Button className="w-full rounded-xl" onClick={onClose}>
        Done
      </Button>
    </div>
  );
}

function HideStoryModal({ onClose }: { onClose: () => void }) {
  const [hiddenCount, setHiddenCount] = useState(0);

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle className="text-lg font-bold flex items-center gap-2">
          <EyeOff className="h-5 w-5 text-primary" />
          Hide Story and Live
        </DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground">
          Hide your story, highlights, and live broadcasts from specific users without blocking
          them.
        </DialogDescription>
      </DialogHeader>
      <div className="p-3 rounded-2xl border border-border bg-surface flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold">Hidden From</p>
          <p className="text-[11px] text-muted-foreground">{hiddenCount} accounts selected</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="rounded-xl text-xs"
          onClick={() => {
            setHiddenCount(1);
            toast.success("Story hidden from selected accounts");
          }}
        >
          Manage Accounts
        </Button>
      </div>
      <Button className="w-full rounded-xl" onClick={onClose}>
        Done
      </Button>
    </div>
  );
}

function CommentFilterModal({ onClose }: { onClose: () => void }) {
  const [filterOffensive, setFilterOffensive] = useState(true);
  const [customWords, setCustomWords] = useState("");

  function save() {
    toast.success("Comment moderation rules applied");
    onClose();
  }

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle className="text-lg font-bold">Comments & Hidden Words</DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground">
          Automatically hide offensive comments and messages containing custom keywords.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between p-3 rounded-2xl border border-border bg-surface">
          <div>
            <p className="text-xs font-semibold">Hide Offensive Words</p>
            <p className="text-[11px] text-muted-foreground">
              AI filter for profanity and hate speech
            </p>
          </div>
          <Switch checked={filterOffensive} onCheckedChange={setFilterOffensive} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground">
            Custom Keyword Filter (comma separated)
          </label>
          <Input
            placeholder="e.g. crypto, giveaway, spam"
            value={customWords}
            onChange={(e) => setCustomWords(e.target.value)}
            className="rounded-xl text-xs"
          />
        </div>
      </div>
      <Button className="w-full rounded-xl" onClick={save}>
        Save Filters
      </Button>
    </div>
  );
}

function SharingRemixesModal({ onClose }: { onClose: () => void }) {
  const [allowRemix, setAllowRemix] = useState(true);
  const [allowShare, setAllowShare] = useState(true);

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle className="text-lg font-bold flex items-center gap-2">
          <Share2 className="h-5 w-5 text-primary" />
          Sharing & Remixes
        </DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground">
          Control how others can reshare your posts to stories or create video remix collaborations.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between p-3 rounded-2xl border border-border bg-surface">
          <div>
            <p className="text-xs font-semibold">Allow Reels Remixing</p>
            <p className="text-[11px] text-muted-foreground">
              Anyone can create a remix side-by-side with your reel
            </p>
          </div>
          <Switch checked={allowRemix} onCheckedChange={setAllowRemix} />
        </div>
        <div className="flex items-center justify-between p-3 rounded-2xl border border-border bg-surface">
          <div>
            <p className="text-xs font-semibold">Allow Resharing to Stories</p>
            <p className="text-[11px] text-muted-foreground">
              Others can share your public posts in their story
            </p>
          </div>
          <Switch checked={allowShare} onCheckedChange={setAllowShare} />
        </div>
      </div>
      <Button
        className="w-full rounded-xl"
        onClick={() => {
          toast.success("Sharing permissions updated");
          onClose();
        }}
      >
        Done
      </Button>
    </div>
  );
}

function RestrictedAccountsModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle className="text-lg font-bold">Restricted Accounts</DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground">
          Protect yourself from unwanted interactions without blocking. Only you and the restricted
          person can see their comments on your posts.
        </DialogDescription>
      </DialogHeader>
      <div className="p-4 rounded-2xl bg-secondary/40 text-center text-xs text-muted-foreground">
        No accounts currently restricted.
      </div>
      <Button className="w-full rounded-xl" onClick={onClose}>
        Close
      </Button>
    </div>
  );
}

function FavoritesModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle className="text-lg font-bold flex items-center gap-2">
          <Heart className="h-5 w-5 text-rose-500" />
          Favorites Feed
        </DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground">
          Posts from your favorites appear higher in your home feed with a red star indicator.
        </DialogDescription>
      </DialogHeader>
      <div className="p-4 rounded-2xl bg-secondary/40 text-center text-xs text-muted-foreground space-y-1">
        <p className="font-semibold text-foreground">You haven't added favorites yet</p>
        <p>Add up to 50 creators to see their content first.</p>
      </div>
      <Button className="w-full rounded-xl" onClick={onClose}>
        Done
      </Button>
    </div>
  );
}

function MutedAccountsModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle className="text-lg font-bold flex items-center gap-2">
          <VolumeX className="h-5 w-5 text-muted-foreground" />
          Muted Accounts
        </DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground">
          Manage accounts whose posts, stories, or notes you have temporarily muted.
        </DialogDescription>
      </DialogHeader>
      <div className="p-4 rounded-2xl bg-secondary/40 text-center text-xs text-muted-foreground">
        No muted accounts.
      </div>
      <Button className="w-full rounded-xl" onClick={onClose}>
        Close
      </Button>
    </div>
  );
}

function ContentPreferencesModal({ onClose }: { onClose: () => void }) {
  const [level, setLevel] = useState("standard");

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle className="text-lg font-bold flex items-center gap-2">
          <Sliders className="h-5 w-5 text-primary" />
          Content Preferences & Sensitive Control
        </DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground">
          Customize what appears in your Explore feed and search suggestions.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-2 pt-1">
        {[
          { id: "less", label: "Less", desc: "Filter out more borderline or intense content" },
          {
            id: "standard",
            label: "Standard (Default)",
            desc: "Balanced feed according to community standards",
          },
          { id: "more", label: "More", desc: "Allows broader range of creator topics" },
        ].map((item) => (
          <div
            key={item.id}
            onClick={() => {
              setLevel(item.id);
              toast.success(`Content level set to ${item.label}`);
            }}
            className={`p-3 rounded-2xl border cursor-pointer flex items-center justify-between ${
              level === item.id ? "border-primary bg-primary/10" : "border-border bg-surface"
            }`}
          >
            <div>
              <p className="text-xs font-bold text-foreground">{item.label}</p>
              <p className="text-[11px] text-muted-foreground">{item.desc}</p>
            </div>
            {level === item.id && <Check className="h-4 w-4 text-primary" />}
          </div>
        ))}
      </div>
      <Button className="w-full rounded-xl" onClick={onClose}>
        Done
      </Button>
    </div>
  );
}

function LikeCountsModal({ onClose }: { onClose: () => void }) {
  const [hideLikes, setHideLikes] = useState(
    () => localStorage.getItem("opexnal_hide_likes") === "true",
  );

  function toggle(val: boolean) {
    setHideLikes(val);
    localStorage.setItem("opexnal_hide_likes", String(val));
    toast.success(val ? "Like counts hidden on your posts" : "Like counts visible");
  }

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle className="text-lg font-bold">Like and View Counts</DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground">
          Hide total likes and view counts on posts from other accounts and your own posts.
        </DialogDescription>
      </DialogHeader>
      <div className="flex items-center justify-between p-3.5 rounded-2xl border border-border bg-surface">
        <div>
          <p className="text-xs font-semibold">Hide Like and View Counts</p>
          <p className="text-[11px] text-muted-foreground">
            Focus on content quality rather than numbers
          </p>
        </div>
        <Switch checked={hideLikes} onCheckedChange={toggle} />
      </div>
      <Button className="w-full rounded-xl" onClick={onClose}>
        Done
      </Button>
    </div>
  );
}

function DevicePermissionsModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle className="text-lg font-bold flex items-center gap-2">
          <Smartphone className="h-5 w-5 text-primary" />
          Device & App Permissions
        </DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground">
          Permissions granted to Opexnal for camera capture, audio recording, and media upload.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-2 pt-1">
        {[
          { name: "Camera", desc: "Stories, reels recording & photo posts", status: "Authorized" },
          { name: "Microphone", desc: "Audio for reels and voice messages", status: "Authorized" },
          {
            name: "Photo Library",
            desc: "Uploading images and videos from device",
            status: "Full Access",
          },
          { name: "Notifications", desc: "Direct messages and creator alerts", status: "Enabled" },
        ].map((p) => (
          <div
            key={p.name}
            className="flex items-center justify-between p-3 rounded-2xl border border-border bg-surface"
          >
            <div>
              <p className="text-xs font-semibold text-foreground">{p.name}</p>
              <p className="text-[11px] text-muted-foreground">{p.desc}</p>
            </div>
            <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 text-[10px]">
              {p.status}
            </Badge>
          </div>
        ))}
      </div>
      <Button className="w-full rounded-xl" onClick={onClose}>
        Understood
      </Button>
    </div>
  );
}

function ArchivingDownloadingModal({ onClose }: { onClose: () => void }) {
  const [saveToCameraRoll, setSaveToCameraRoll] = useState(false);
  const [autoArchive, setAutoArchive] = useState(true);

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle className="text-lg font-bold flex items-center gap-2">
          <Download className="h-5 w-5 text-primary" />
          Archiving & Downloading
        </DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground">
          Configure automatic story preservation and local camera roll downloads.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between p-3 rounded-2xl border border-border bg-surface">
          <div>
            <p className="text-xs font-semibold">Save Story to Archive</p>
            <p className="text-[11px] text-muted-foreground">
              Preserve stories automatically after 24 hours
            </p>
          </div>
          <Switch checked={autoArchive} onCheckedChange={setAutoArchive} />
        </div>
        <div className="flex items-center justify-between p-3 rounded-2xl border border-border bg-surface">
          <div>
            <p className="text-xs font-semibold">Save to Camera Roll</p>
            <p className="text-[11px] text-muted-foreground">
              Automatically download captured reels to device storage
            </p>
          </div>
          <Switch checked={saveToCameraRoll} onCheckedChange={setSaveToCameraRoll} />
        </div>
      </div>
      <Button
        className="w-full rounded-xl"
        onClick={() => {
          toast.success("Archive preferences updated");
          onClose();
        }}
      >
        Done
      </Button>
    </div>
  );
}

function AccessibilityCaptionsModal({ onClose }: { onClose: () => void }) {
  const [captions, setCaptions] = useState(true);

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle className="text-lg font-bold">Accessibility & Captions</DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground">
          Features designed to make video and creator content accessible to all audiences.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between p-3 rounded-2xl border border-border bg-surface">
          <div>
            <p className="text-xs font-semibold">Auto-Generated Captions</p>
            <p className="text-[11px] text-muted-foreground">
              Display real-time speech-to-text on video reels
            </p>
          </div>
          <Switch checked={captions} onCheckedChange={setCaptions} />
        </div>
      </div>
      <Button
        className="w-full rounded-xl"
        onClick={() => {
          toast.success("Accessibility settings saved");
          onClose();
        }}
      >
        Done
      </Button>
    </div>
  );
}

function LanguageRegionModal({ onClose }: { onClose: () => void }) {
  const [lang, setLang] = useState(() => localStorage.getItem("opexnal_lang") || "English");

  function select(l: string) {
    setLang(l);
    localStorage.setItem("opexnal_lang", l);
    toast.success(`Language set to ${l}`);
    onClose();
  }

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle className="text-lg font-bold flex items-center gap-2">
          <Languages className="h-5 w-5 text-primary" />
          Language & Region
        </DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground">
          Select interface language and automatic story translation preferences.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-2 pt-1">
        {[
          "English (US)",
          "Hindi (हिंदी)",
          "Hinglish (Conversational)",
          "Spanish (Español)",
          "French (Français)",
        ].map((l) => (
          <div
            key={l}
            onClick={() => select(l)}
            className={`p-3 rounded-2xl border cursor-pointer flex items-center justify-between ${
              lang === l
                ? "border-primary bg-primary/10"
                : "border-border bg-surface hover:bg-secondary"
            }`}
          >
            <span className="text-xs font-semibold">{l}</span>
            {lang === l && <Check className="h-4 w-4 text-primary" />}
          </div>
        ))}
      </div>
    </div>
  );
}

function DataUsageModal({ onClose }: { onClose: () => void }) {
  const [dataSaver, setDataSaver] = useState(false);
  const [highQuality, setHighQuality] = useState(true);

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle className="text-lg font-bold flex items-center gap-2">
          <Wifi className="h-5 w-5 text-primary" />
          Data Usage & Media Quality
        </DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground">
          Optimize bandwidth consumption or prioritize crisp 4K uploads for reels.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between p-3 rounded-2xl border border-border bg-surface">
          <div>
            <p className="text-xs font-semibold">Upload at Highest Quality</p>
            <p className="text-[11px] text-muted-foreground">
              Always upload high-resolution video even on cellular data
            </p>
          </div>
          <Switch checked={highQuality} onCheckedChange={setHighQuality} />
        </div>
        <div className="flex items-center justify-between p-3 rounded-2xl border border-border bg-surface">
          <div>
            <p className="text-xs font-semibold">Cellular Data Saver</p>
            <p className="text-[11px] text-muted-foreground">
              Videos will not load in advance to reduce data usage
            </p>
          </div>
          <Switch checked={dataSaver} onCheckedChange={setDataSaver} />
        </div>
      </div>
      <Button
        className="w-full rounded-xl"
        onClick={() => {
          toast.success("Media quality settings saved");
          onClose();
        }}
      >
        Done
      </Button>
    </div>
  );
}

function SupervisionModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle className="text-lg font-bold flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          Parental Supervision
        </DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground">
          Tools for parents and guardians to support their teens and monitor healthy usage patterns.
        </DialogDescription>
      </DialogHeader>
      <div className="p-4 rounded-2xl bg-secondary/50 border border-border text-center space-y-2">
        <p className="text-xs font-semibold text-foreground">Set Up Family Supervision</p>
        <p className="text-xs text-muted-foreground">
          Invite a parent or guardian to see time spent, followers list, and manage downtime
          boundaries.
        </p>
        <Button
          size="sm"
          className="rounded-xl mt-2"
          onClick={() => toast.success("Supervision invitation link copied to clipboard")}
        >
          Create Guardian Invite Link
        </Button>
      </div>
      <Button variant="outline" className="w-full rounded-xl" onClick={onClose}>
        Close
      </Button>
    </div>
  );
}

function SafetyHubModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle className="text-lg font-bold">Safety & Education Hub</DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground">
          Expert resources on digital literacy, anti-bullying tools, and teen privacy defaults.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-2 pt-1 text-xs text-muted-foreground">
        <div className="p-3 rounded-2xl border border-border bg-surface">
          <p className="font-semibold text-foreground">Default Privacy for Teens</p>
          <p className="mt-0.5">
            Accounts for creators under 18 default to private with restricted adult messaging.
          </p>
        </div>
        <div className="p-3 rounded-2xl border border-border bg-surface">
          <p className="font-semibold text-foreground">Anti-Bullying & Comment Moderation</p>
          <p className="mt-0.5">
            Automated screening prevents repetitive unwanted harassment in reels and comments.
          </p>
        </div>
      </div>
      <Button className="w-full rounded-xl" onClick={onClose}>
        Understood
      </Button>
    </div>
  );
}

function PaymentMethodsModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="space-y-4">
      <DialogHeader>
        <div className="flex items-center justify-between gap-2">
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Payment Methods
          </DialogTitle>
          <Badge
            variant="outline"
            className="border-amber-500/40 text-amber-600 dark:text-amber-400 text-[10px] uppercase font-bold tracking-wider"
          >
            NEEDS PAYMENT PROVIDER CONFIGURATION
          </Badge>
        </div>
        <DialogDescription className="text-xs text-muted-foreground">
          Manage cards and billing methods for in-app tipping and creator subscriptions.
        </DialogDescription>
      </DialogHeader>

      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs space-y-1">
        <p className="font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
          <ShieldAlert className="h-3.5 w-3.5" />
          Gateway Credentials Required
        </p>
        <p className="text-muted-foreground text-[11px] leading-relaxed">
          In production, card collection must use tokenized iframes (Stripe Elements / Razorpay SDK)
          without raw card storage. Live card authorization is disabled until gateway keys are
          connected.
        </p>
      </div>

      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between p-3.5 rounded-2xl border border-border bg-surface">
          <div className="flex items-center gap-3">
            <div className="h-8 w-12 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center font-bold text-xs">
              VISA
            </div>
            <div>
              <p className="text-xs font-semibold">Visa ending in 4242</p>
              <p className="text-[11px] text-muted-foreground">Expires 08/28 • Server Vault Mock</p>
            </div>
          </div>
          <Badge variant="secondary">Saved Method</Badge>
        </div>
        <Button
          variant="outline"
          className="w-full rounded-xl text-xs"
          onClick={() => toast.info("Payment provider gateway is required for live card tokens")}
        >
          + Add New Payment Method (Gateway Required)
        </Button>
      </div>
      <Button className="w-full rounded-xl" onClick={onClose}>
        Done
      </Button>
    </div>
  );
}

function OrderHistoryModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle className="text-lg font-bold">Orders & Purchase History</DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground">
          Receipts for subscriptions, creator support tips, and merchandise transactions.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-2 pt-1">
        <div className="p-3 rounded-2xl border border-border bg-surface flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold">Creator Subscription — @alex_creative</p>
            <p className="text-[11px] text-muted-foreground">Sep 1, 2026 • Receipt #OPX-9182</p>
          </div>
          <span className="text-xs font-bold text-foreground">$4.99</span>
        </div>
      </div>
      <Button className="w-full rounded-xl" onClick={onClose}>
        Close
      </Button>
    </div>
  );
}

function PayoutsModal({ onClose }: { onClose: () => void }) {
  const [withdrawAmount, setWithdrawAmount] = useState("50.00");
  const [balance, setBalance] = useState(142.5);
  const [isProcessing, setIsProcessing] = useState(false);

  function handleWithdrawal() {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Withdrawal amount must be greater than $0.00");
      return;
    }
    if (amount < 50.0) {
      toast.error("Minimum payout withdrawal threshold is $50.00");
      return;
    }
    if (amount > balance) {
      toast.error("Insufficient creator balance. Overdraft rejected by server.");
      return;
    }

    setIsProcessing(true);
    // Server-authoritative idempotency simulation
    const idempotencyKey = `payout_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    setTimeout(() => {
      setIsProcessing(false);
      setBalance((prev) => +(prev - amount).toFixed(2));
      toast.success(
        `Withdrawal of $${amount.toFixed(2)} initiated with key ${idempotencyKey.slice(0, 14)}... (Awaiting payment gateway payout clearance)`,
      );
    }, 600);
  }

  return (
    <div className="space-y-4">
      <DialogHeader>
        <div className="flex items-center justify-between gap-2">
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-emerald-500" />
            Monetization Payouts
          </DialogTitle>
          <Badge
            variant="outline"
            className="border-amber-500/40 text-amber-600 dark:text-amber-400 text-[10px] uppercase font-bold tracking-wider"
          >
            NEEDS PAYMENT PROVIDER CONFIGURATION
          </Badge>
        </div>
        <DialogDescription className="text-xs text-muted-foreground">
          Server-authoritative creator balance, bank direct deposit, and payout controls.
        </DialogDescription>
      </DialogHeader>

      <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-1">
        <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
          Available Creator Balance
        </p>
        <p className="text-3xl font-extrabold text-foreground">${balance.toFixed(2)}</p>
        <p className="text-[11px] text-muted-foreground">
          Minimum withdrawal threshold: $50.00 • Direct Deposit: Bank ending in 4819
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-3.5 space-y-2.5">
        <label className="text-xs font-semibold text-foreground">
          Request Payout (Idempotent Transaction)
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-2.5 text-xs text-muted-foreground font-semibold">
              $
            </span>
            <Input
              type="number"
              min="50"
              max={balance}
              step="5"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              className="pl-7 rounded-xl text-xs"
            />
          </div>
          <Button
            className="rounded-xl text-xs"
            disabled={isProcessing || balance < 50}
            onClick={handleWithdrawal}
          >
            {isProcessing ? "Validating..." : "Withdraw"}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground">
          * Server checks: Negative amounts and overdrafts are strictly blocked. Unique idempotency
          keys prevent duplicate payouts.
        </p>
      </div>

      <Button className="w-full rounded-xl" onClick={onClose}>
        Done
      </Button>
    </div>
  );
}

function HelpCenterModal({ onClose }: { onClose: () => void }) {
  const [problem, setProblem] = useState("");

  function submitReport() {
    if (!problem.trim()) {
      toast.error("Please describe your question or issue");
      return;
    }
    toast.success("Support ticket created. Our team will follow up via email.");
    setProblem("");
    onClose();
  }

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle className="text-lg font-bold flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-primary" />
          Help Center & Support
        </DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground">
          Browse common creator guides or submit an issue directly to the Opexnal support team.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-3 pt-1">
        <div className="p-3 rounded-2xl bg-secondary/50 border border-border text-xs space-y-1.5">
          <p className="font-semibold text-foreground">Frequently Asked Questions</p>
          <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
            <li>How to verify creator status and earn verification badges</li>
            <li>Setting up two-factor authentication (TOTP)</li>
            <li>Content monetization guidelines & payout dates</li>
          </ul>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground">Report a Problem</label>
          <Input
            placeholder="Briefly explain what happened..."
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            className="rounded-xl text-xs"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1 rounded-xl" onClick={onClose}>
          Close
        </Button>
        <Button className="flex-1 rounded-xl" onClick={submitReport}>
          Send Report
        </Button>
      </div>
    </div>
  );
}

function SupportRequestsModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle className="text-lg font-bold">Support Requests & Appeals</DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground">
          Track the status of reports you have submitted and active appeal requests.
        </DialogDescription>
      </DialogHeader>
      <div className="p-4 rounded-2xl bg-secondary/40 text-center text-xs text-muted-foreground">
        You have no active support requests or pending appeals.
      </div>
      <Button className="w-full rounded-xl" onClick={onClose}>
        Done
      </Button>
    </div>
  );
}

function AboutModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle className="text-lg font-bold flex items-center gap-2">
          <Info className="h-5 w-5 text-primary" />
          About Opexnal
        </DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground">
          The next-generation social and creator platform engineered for velocity and intelligence.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-2.5 pt-1 text-xs">
        <div className="flex items-center justify-between p-3 rounded-2xl border border-border bg-surface">
          <span className="font-medium text-foreground">Platform Release</span>
          <span className="font-semibold text-primary">v2.5 Production Build</span>
        </div>
        <div className="flex items-center justify-between p-3 rounded-2xl border border-border bg-surface">
          <span className="font-medium text-foreground">AI Foundation</span>
          <span className="font-medium text-muted-foreground">Google Gemini 3.7 Flash</span>
        </div>
        <div className="flex items-center justify-between p-3 rounded-2xl border border-border bg-surface">
          <span className="font-medium text-foreground">Backend & Storage</span>
          <span className="font-medium text-muted-foreground">Supabase Enterprise Auth & DB</span>
        </div>
      </div>
      <Button className="w-full rounded-xl" onClick={onClose}>
        Close
      </Button>
    </div>
  );
}

function TermsModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle className="text-lg font-bold flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Terms of Service
        </DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground">
          Opexnal platform guidelines, creator ownership, and community standards.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-2 max-h-56 overflow-y-auto text-xs text-muted-foreground p-3 rounded-2xl bg-secondary/30 border border-border leading-relaxed">
        <p className="font-semibold text-foreground">1. Creator Ownership</p>
        <p>
          You retain 100% intellectual property ownership of all media, text, reels, and stories you
          post.
        </p>
        <p className="font-semibold text-foreground mt-2">2. Respect & Integrity</p>
        <p>Harassment, abusive automation, and copyright infringement are strictly prohibited.</p>
        <p className="font-semibold text-foreground mt-2">3. Monetization Integrity</p>
        <p>Fan subscriptions and payouts are subject to verified identity and good standing.</p>
      </div>
      <Button className="w-full rounded-xl" onClick={onClose}>
        Understood
      </Button>
    </div>
  );
}

function CreatorWebModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle className="text-lg font-bold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Opexnal Studio for Web
        </DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground">
          Desktop publishing, multi-reel scheduling, and professional analytics for creators.
        </DialogDescription>
      </DialogHeader>
      <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 text-xs text-muted-foreground space-y-2">
        <p className="font-semibold text-foreground">Desktop Creator Suite</p>
        <p>
          Opexnal is fully responsive and optimized for desktop workflows. Access high-resolution
          video uploads, scheduled posts, and in-depth analytics directly on your desktop browser.
        </p>
      </div>
      <Button className="w-full rounded-xl" onClick={onClose}>
        Got It
      </Button>
    </div>
  );
}

function AddAccountModal({ onClose }: { onClose: () => void }) {
  const [newUsername, setNewUsername] = useState("");

  function submit() {
    if (!newUsername.trim()) {
      toast.error("Please enter a username or email");
      return;
    }
    toast.success(`Account @${newUsername.replace(/^@/, "")} registered for multi-account login`);
    onClose();
  }

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle className="text-lg font-bold flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-primary" />
          Add Existing Account
        </DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground">
          Log into another Opexnal account to switch seamlessly between profiles.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-2 pt-1">
        <Input
          placeholder="Phone, username or email"
          value={newUsername}
          onChange={(e) => setNewUsername(e.target.value)}
          className="rounded-xl"
        />
        <Input type="password" placeholder="Password" className="rounded-xl" />
      </div>
      <div className="flex gap-2 pt-2">
        <Button variant="outline" className="flex-1 rounded-xl" onClick={onClose}>
          Cancel
        </Button>
        <Button className="flex-1 rounded-xl" onClick={submit}>
          Log In
        </Button>
      </div>
    </div>
  );
}

function SwitchAccountModal({ username, onClose }: { username: string; onClose: () => void }) {
  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle className="text-lg font-bold flex items-center gap-2">
          <RefreshCw className="h-5 w-5 text-primary" />
          Switch Accounts
        </DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground">
          Select an active profile to switch your current workspace.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between p-3 rounded-2xl border border-primary bg-primary/10">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-xs text-primary">
              {username[0]?.toUpperCase() || "U"}
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">@{username}</p>
              <p className="text-[10px] text-muted-foreground">Current Account</p>
            </div>
          </div>
          <Check className="h-4 w-4 text-primary" />
        </div>
      </div>
      <Button variant="outline" className="w-full rounded-xl" onClick={onClose}>
        Done
      </Button>
    </div>
  );
}

function DownloadDataModal({ onClose }: { onClose: () => void }) {
  const [format, setFormat] = useState<"json" | "html">("json");
  const [categories, setCategories] = useState<string[]>([
    "Profile Information",
    "Posts & Reels",
    "Messages & Comments",
    "Activity & Media Metadata",
  ]);
  const [isRequesting, setIsRequesting] = useState(false);
  const [readyExport, setReadyExport] = useState<{
    id: string;
    createdAt: string;
    size: string;
  } | null>({
    id: "exp_2026_01",
    createdAt: "Feb 15, 2026",
    size: "14.2 MB",
  });

  function toggleCategory(cat: string) {
    setCategories((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));
  }

  function handleRequest() {
    if (categories.length === 0) {
      toast.error("Please select at least one data category to include in the export");
      return;
    }
    setIsRequesting(true);
    setTimeout(() => {
      setIsRequesting(false);
      setReadyExport({
        id: `exp_${Date.now()}`,
        createdAt: "Just now",
        size: "18.6 MB",
      });
      toast.success("Data export package generated. You can download the archive.");
    }, 800);
  }

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle className="text-lg font-bold flex items-center gap-2">
          <Download className="h-5 w-5 text-primary" />
          Download Your Data
        </DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground">
          Request a secure copy of your Opexnal profile, media, comments, and interactions.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-3 pt-1">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">Archive Format</label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={format === "json" ? "default" : "outline"}
              size="sm"
              className="rounded-xl text-xs"
              onClick={() => setFormat("json")}
            >
              JSON (Machine-Readable)
            </Button>
            <Button
              type="button"
              variant={format === "html" ? "default" : "outline"}
              size="sm"
              className="rounded-xl text-xs"
              onClick={() => setFormat("html")}
            >
              HTML (Web Viewable)
            </Button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">Categories to Include</label>
          <div className="space-y-1.5">
            {[
              "Profile Information",
              "Posts & Reels",
              "Messages & Comments",
              "Activity & Media Metadata",
            ].map((cat) => (
              <label
                key={cat}
                className="flex items-center justify-between p-2.5 rounded-xl border border-border bg-surface text-xs cursor-pointer hover:bg-secondary/40"
              >
                <span>{cat}</span>
                <input
                  type="checkbox"
                  checked={categories.includes(cat)}
                  onChange={() => toggleCategory(cat)}
                  className="rounded border-border"
                />
              </label>
            ))}
          </div>
        </div>

        {readyExport && (
          <div className="p-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 flex items-center justify-between">
            <div className="text-xs">
              <p className="font-semibold text-emerald-700 dark:text-emerald-400">
                Export Archive Ready
              </p>
              <p className="text-[11px] text-muted-foreground">
                Created: {readyExport.createdAt} • {readyExport.size}
              </p>
            </div>
            <Button
              size="sm"
              className="rounded-xl text-xs h-8"
              onClick={() => toast.success("Downloading export ZIP archive...")}
            >
              Download
            </Button>
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-2">
        <Button variant="outline" className="flex-1 rounded-xl" onClick={onClose}>
          Close
        </Button>
        <Button className="flex-1 rounded-xl" disabled={isRequesting} onClick={handleRequest}>
          {isRequesting ? "Preparing Export..." : "Request Export"}
        </Button>
      </div>
    </div>
  );
}

function RecentlyDeletedModal({ onClose }: { onClose: () => void }) {
  const [items, setItems] = useState<RecentlyDeletedItem[]>([
    {
      id: "del_post_1",
      type: "post",
      title: "Draft sunset reel with 4K color grade",
      deletedAt: "2026-03-01T10:00:00Z",
      daysRemaining: 27,
    },
    {
      id: "del_story_2",
      type: "story",
      title: "Behind the scenes in studio",
      deletedAt: "2026-03-02T15:00:00Z",
      daysRemaining: 28,
    },
  ]);

  function handleRestore(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
    toast.success("Item restored to your profile and active feed");
  }

  function handlePermanentDelete(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
    toast.success("Item permanently purged from server");
  }

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle className="text-lg font-bold flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          Recently Deleted
        </DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground">
          Items here are held for 30 days before permanent deletion. Only you can view this bin.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-2 pt-1 max-h-60 overflow-y-auto">
        {items.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground space-y-1">
            <Trash2 className="h-8 w-8 mx-auto text-muted-foreground/40" />
            <p className="font-semibold text-foreground">Recently Deleted is Empty</p>
            <p>Deleted posts, stories, and reels will appear here for 30 days.</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="p-3 rounded-2xl border border-border bg-surface flex items-center justify-between gap-2"
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold truncate text-foreground">{item.title}</p>
                <p className="text-[11px] text-muted-foreground capitalize">
                  {item.type} • {item.daysRemaining} days remaining
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 rounded-xl text-xs flex items-center gap-1"
                  onClick={() => handleRestore(item.id)}
                >
                  <RotateCcw className="h-3 w-3" />
                  Restore
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 rounded-xl text-destructive hover:bg-destructive/10"
                  onClick={() => handlePermanentDelete(item.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <Button className="w-full rounded-xl" onClick={onClose}>
        Done
      </Button>
    </div>
  );
}

function DeactivateAccountModal({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<"deactivate" | "delete">("deactivate");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleSubmit() {
    if (!password) {
      toast.error("Please enter your current password to authorize this action");
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      if (mode === "deactivate") {
        toast.success("Account temporarily deactivated. Log in anytime to reactivate.");
      } else {
        toast.success("Account deletion initiated. 30-day grace period started.");
      }
      onClose();
    }, 700);
  }

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle className="text-lg font-bold flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          Deactivate or Delete Account
        </DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground">
          Choose whether to temporarily take a break or permanently erase your Opexnal profile.
        </DialogDescription>
      </DialogHeader>

      <div className="grid grid-cols-2 gap-2 pt-1">
        <Button
          type="button"
          variant={mode === "deactivate" ? "default" : "outline"}
          size="sm"
          className="rounded-xl text-xs"
          onClick={() => setMode("deactivate")}
        >
          Deactivate (Temporary)
        </Button>
        <Button
          type="button"
          variant={mode === "delete" ? "destructive" : "outline"}
          size="sm"
          className="rounded-xl text-xs"
          onClick={() => setMode("delete")}
        >
          Delete (Permanent)
        </Button>
      </div>

      <div className="p-3 rounded-2xl bg-secondary/50 border border-border text-xs text-muted-foreground space-y-1">
        {mode === "deactivate" ? (
          <p>
            Deactivating your account will hide your profile, posts, comments, and likes until you
            log back in. Your data remains safe and preserved.
          </p>
        ) : (
          <p className="text-destructive font-medium">
            Permanent deletion will queue your profile, followers, posts, reels, and messages for
            total erasure after a 30-day grace period.
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground">Confirm With Your Password</label>
        <Input
          type="password"
          placeholder="Enter current password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-xl text-xs"
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button variant="outline" className="flex-1 rounded-xl" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant={mode === "delete" ? "destructive" : "default"}
          className="flex-1 rounded-xl"
          disabled={isSubmitting}
          onClick={handleSubmit}
        >
          {isSubmitting
            ? "Submitting..."
            : mode === "deactivate"
              ? "Deactivate Account"
              : "Delete Account"}
        </Button>
      </div>
    </div>
  );
}

function ActiveSessionsModal({ onClose }: { onClose: () => void }) {
  const [sessions, setSessions] = useState<ActiveSession[]>([
    {
      id: "sess_1",
      device: "MacBook Pro 16”",
      browser: "Chrome 128 / macOS",
      location: "San Francisco, CA, USA",
      ipAddress: "198.51.100.24",
      lastActive: "Active now",
      isCurrent: true,
    },
    {
      id: "sess_2",
      device: "iPhone 15 Pro Max",
      browser: "Opexnal iOS App v2.5",
      location: "San Jose, CA, USA",
      ipAddress: "198.51.100.89",
      lastActive: "2 hours ago",
      isCurrent: false,
    },
    {
      id: "sess_3",
      device: "iPad Air 5th Gen",
      browser: "Safari 17.5 / iPadOS",
      location: "Oakland, CA, USA",
      ipAddress: "198.51.100.112",
      lastActive: "Yesterday",
      isCurrent: false,
    },
  ]);

  function revokeSession(id: string) {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    toast.success("Session revoked. That device has been signed out immediately.");
  }

  function revokeAllOtherSessions() {
    setSessions((prev) => prev.filter((s) => s.isCurrent));
    toast.success("All other active sessions revoked across all devices.");
  }

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle className="text-lg font-bold flex items-center gap-2">
          <Laptop className="h-5 w-5 text-primary" />
          Active Login Sessions
        </DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground">
          Review all web browsers, tablets, and mobile devices currently signed into your account.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-2.5 pt-1">
        {sessions.map((sess) => (
          <div
            key={sess.id}
            className={`p-3 rounded-2xl border ${
              sess.isCurrent ? "border-primary/40 bg-primary/5" : "border-border bg-surface"
            } flex items-center justify-between gap-2`}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold text-foreground">{sess.device}</p>
                {sess.isCurrent ? (
                  <Badge className="text-[10px] bg-primary text-primary-foreground py-0">
                    This Device
                  </Badge>
                ) : (
                  <span className="text-[10px] text-muted-foreground">{sess.lastActive}</span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {sess.browser} • {sess.location}
              </p>
              <p className="text-[10px] text-muted-foreground/70 font-mono mt-0.5">
                IP: {sess.ipAddress}
              </p>
            </div>

            {!sess.isCurrent && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-xl text-xs text-destructive hover:bg-destructive/10"
                onClick={() => revokeSession(sess.id)}
              >
                Revoke
              </Button>
            )}
          </div>
        ))}

        {sessions.length > 1 && (
          <Button
            variant="outline"
            className="w-full rounded-xl text-xs text-destructive border-destructive/30 hover:bg-destructive/10 mt-1"
            onClick={revokeAllOtherSessions}
          >
            Log Out of All Other Devices ({sessions.length - 1})
          </Button>
        )}
      </div>

      <Button className="w-full rounded-xl" onClick={onClose}>
        Done
      </Button>
    </div>
  );
}

function LogoutConfirmModal({
  onSignOut,
  onClose,
}: {
  onSignOut: () => void;
  onClose: () => void;
}) {
  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle className="text-lg font-bold">Log Out of Opexnal?</DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground">
          You will need to enter your credentials or use quick sign-in to access your account again.
        </DialogDescription>
      </DialogHeader>
      <div className="flex gap-2 pt-2">
        <Button variant="outline" className="flex-1 rounded-xl" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="destructive" className="flex-1 rounded-xl" onClick={onSignOut}>
          Log Out
        </Button>
      </div>
    </div>
  );
}

function LogoutAllConfirmModal({
  onSignOutAll,
  onClose,
}: {
  onSignOutAll: () => void;
  onClose: () => void;
}) {
  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle className="text-lg font-bold">Log Out of All Devices?</DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground">
          This will revoke all active sessions across all web browsers, tablets, and phones.
        </DialogDescription>
      </DialogHeader>
      <div className="flex gap-2 pt-2">
        <Button variant="outline" className="flex-1 rounded-xl" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="destructive" className="flex-1 rounded-xl" onClick={onSignOutAll}>
          Log Out Everywhere
        </Button>
      </div>
    </div>
  );
}
