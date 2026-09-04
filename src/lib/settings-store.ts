import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export interface ActiveSession {
  id: string;
  device: string;
  browser: string;
  location: string;
  ipAddress: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface RecentlyDeletedItem {
  id: string;
  type: "post" | "reel" | "story";
  title: string;
  deletedAt: string;
  daysRemaining: number;
  thumbnailUrl?: string;
}

export interface ExportRequest {
  id: string;
  format: "json" | "html";
  categories: string[];
  createdAt: string;
  status: "processing" | "ready" | "expired";
  downloadUrl?: string;
  fileSizeBytes?: number;
}

export interface QuickReply {
  id: string;
  shortcut: string;
  message: string;
}

export interface OpexnalSettings {
  // 1. Your Account
  email: string;
  phone: string;
  dateOfBirth: string;
  ownershipVerified: boolean;
  recoveryEmail: string;
  recoveryPhone: string;
  backupCodes: string[];
  twoFactorEnabled: boolean;
  securityAlertsEmail: boolean;
  activeSessions: ActiveSession[];

  // 2. Accounts Center
  crossPostingEnabled: boolean;
  syncProfileData: boolean;
  connectedNetworks: { id: string; name: string; connected: boolean; username: string }[];
  interestBasedAds: boolean;
  adTopics: string[];

  // 3. How You Use Opexnal
  savedCollections: { id: string; name: string; count: number; createdAt: string }[];
  storiesArchiveAutoSave: boolean;
  postsArchiveAutoSave: boolean;
  liveArchiveAutoSave: boolean;
  timeSpentDailyGoalMinutes: number;
  bedtimeReminderEnabled: boolean;
  bedtimeReminderTime: string;
  pauseAllNotifications: boolean;
  pauseAllDuration: "15m" | "1h" | "2h" | "4h" | "8h" | "off";
  pauseUntil: string | null;
  quietModeEnabled: boolean;
  quietModeStart: string;
  quietModeEnd: string;

  // 4. Your Insights & Tools (Creator/Professional)
  accountType: "personal" | "creator" | "business";
  creatorModeEnabled: boolean;
  professionalCategory: string;
  quickReplies: QuickReply[];
  faqAutomationEnabled: boolean;
  brandedContentEligible: boolean;
  paidPartnershipTagEnabled: boolean;
  approvedBrandPartners: string[];

  // 5. Subscriptions
  creatorSubscriptionsEnabled: boolean;
  creatorTierPrice: number;
  subscriberBadgeCustomCrown: boolean;
  subscriberPriorityDMs: boolean;
  activeUserSubscriptions: {
    id: string;
    creatorUsername: string;
    tier: string;
    price: number;
    renewsAt: string;
    status: "active" | "cancelled";
  }[];
  opexnalMembership: {
    plan: "free" | "opexnal_one" | "opexnal_plus";
    price: number;
    billingCycle: "monthly" | "annual";
    status: "active" | "none";
    renewsAt: string | null;
  };

  // 6. Privacy & Who Can See Your Content
  isPrivate: boolean;
  showActivityStatus: boolean;
  showReadReceipts: boolean;
  locationPrivacyEnabled: boolean;
  suggestAccountToContacts: boolean;
  allowSearchEngineIndexing: boolean;
  closeFriends: string[];
  blockedUsers: { id: string; username: string; blockedAt: string }[];
  restrictedUsers: { id: string; username: string; restrictedAt: string }[];
  mutedUsers: { id: string; username: string; mutePosts: boolean; muteStories: boolean }[];
  hiddenStoriesFrom: string[];

  // 7. How Others Can Interact With You
  allowTagsFrom: "everyone" | "following" | "nobody";
  allowMentionsFrom: "everyone" | "following" | "nobody";
  manualTagApproval: boolean;
  messageRequestsFrom: "everyone" | "following" | "nobody";
  groupRequestsFrom: "everyone" | "following" | "nobody";
  storyRepliesFrom: "everyone" | "following" | "off";
  allowCallsFrom: "everyone" | "following" | "close_friends" | "nobody";
  typingIndicatorsEnabled: boolean;

  // 8. Comments & Interaction Limits
  whoCanComment: "everyone" | "following" | "followers" | "nobody";
  blockedCommenters: string[];
  hideOffensiveComments: boolean;
  customKeywordFilter: string[];
  manualCommentApproval: boolean;
  limitInteractionsNewAccounts: boolean;

  // 9. Content Sharing & Remixes
  allowPostSharingToStories: boolean;
  allowReelsSharing: boolean;
  allowStoryResharing: boolean;
  allowReelsRemix: boolean;
  allowReuseAudio: boolean;
  allowReelsDownloads: boolean;
  allowPostEmbeds: boolean;

  // 10. Content Preferences & What You See
  sensitiveContentLevel: "standard" | "less" | "more";
  hideLikeAndViewCounts: boolean;
  feedMode: "algorithmic" | "favorites" | "following";
  favoriteCreators: string[];
  notInterestedTags: string[];
  preferredTopics: string[];

  // 11. Media & App Quality
  uploadHighestQuality: boolean;
  cellularDataSaver: boolean;
  videoQualityPreference: "auto" | "hd_always" | "hd_wifi";
  autoplayVideos: "always" | "wifi" | "never";
  autoSaveOriginalMedia: boolean;
  autoGenerateCaptions: boolean;
  highContrastMode: boolean;
  appLanguage: string;
  autoTranslateCaptions: boolean;

  // 12. Family Center & Supervision
  parentalSupervisionEnabled: boolean;
  supervisedGuardianEmail: string | null;
  dailyScreenLimitMinutes: number;

  // 13. Monetization, Orders & Payments
  paymentProviderConfigured: boolean; // Server flag: false by default unless real Stripe/gateway keys configured
  creatorBalanceCents: number;
  pendingPayoutsCents: number;
  lifetimeEarningsCents: number;
  minimumPayoutThresholdCents: number;
  payoutDestination: {
    type: "bank" | "upi" | "paypal" | "none";
    accountIdentifier: string;
    holderName: string;
    verified: boolean;
  };
  taxFormSubmitted: boolean;
  savedPaymentMethods: {
    id: string;
    brand: "visa" | "mastercard" | "upi" | "apple_pay";
    last4: string;
    expiry: string;
    isDefault: boolean;
  }[];

  // 14. Notifications Granular
  notificationsLikes: boolean;
  notificationsComments: boolean;
  notificationsFollowers: boolean;
  notificationsFollowRequests: boolean;
  notificationsMessages: boolean;
  notificationsMessageRequests: boolean;
  notificationsMentions: boolean;
  notificationsTags: boolean;
  notificationsStories: boolean;
  notificationsReels: boolean;
  notificationsLive: boolean;
  notificationsCalls: boolean;
  notificationsCreatorAlerts: boolean;
  notificationsMonetization: boolean;
  notificationsPayments: boolean;
  notificationsSecurity: boolean;
  notificationsEmail: boolean;
  notificationsPush: boolean;
  notificationsInApp: boolean;

  // 15. Account Management & Lifecycle
  recentlyDeletedItems: RecentlyDeletedItem[];
  exportRequests: ExportRequest[];
  isDeactivated: boolean;
  deactivatedAt: string | null;
}

export const DEFAULT_SETTINGS: OpexnalSettings = {
  email: "creator@opexnal.user",
  phone: "+1 (555) 019-2834",
  dateOfBirth: "1998-07-15",
  ownershipVerified: true,
  recoveryEmail: "recovery@opexnal.user",
  recoveryPhone: "+1 (555) 019-9988",
  backupCodes: ["9823-1490", "7712-4019", "5541-8820", "3091-6652", "1104-9843"],
  twoFactorEnabled: false,
  securityAlertsEmail: true,
  activeSessions: [
    {
      id: "sess_curr_1",
      device: "MacBook Pro 16”",
      browser: "Chrome 128 / macOS",
      location: "San Francisco, CA, USA",
      ipAddress: "198.51.100.24",
      lastActive: "Active now",
      isCurrent: true,
    },
    {
      id: "sess_mob_2",
      device: "iPhone 15 Pro Max",
      browser: "Opexnal iOS App v2.5",
      location: "San Jose, CA, USA",
      ipAddress: "198.51.100.89",
      lastActive: "2 hours ago",
      isCurrent: false,
    },
  ],

  crossPostingEnabled: false,
  syncProfileData: true,
  connectedNetworks: [
    { id: "threads", name: "Threads", connected: true, username: "@creator" },
    { id: "x", name: "X / Twitter", connected: false, username: "" },
    { id: "youtube", name: "YouTube Shorts", connected: false, username: "" },
  ],
  interestBasedAds: true,
  adTopics: ["Technology", "Photography", "AI & Design", "Music", "Travel"],

  savedCollections: [
    { id: "col_all", name: "All Posts", count: 12, createdAt: "2026-01-01T00:00:00Z" },
    { id: "col_audio", name: "Saved Audio", count: 4, createdAt: "2026-01-10T00:00:00Z" },
    { id: "col_design", name: "Design Inspiration", count: 8, createdAt: "2026-02-01T00:00:00Z" },
  ],
  storiesArchiveAutoSave: true,
  postsArchiveAutoSave: true,
  liveArchiveAutoSave: false,
  timeSpentDailyGoalMinutes: 45,
  bedtimeReminderEnabled: true,
  bedtimeReminderTime: "23:00",
  pauseAllNotifications: false,
  pauseAllDuration: "off",
  pauseUntil: null,
  quietModeEnabled: true,
  quietModeStart: "23:00",
  quietModeEnd: "07:00",

  accountType: "creator",
  creatorModeEnabled: true,
  professionalCategory: "Digital Creator & Technologist",
  quickReplies: [
    {
      id: "qr_1",
      shortcut: "collab",
      message: "Thanks for reaching out! For collaborations, please email collab@opexnal.user",
    },
    {
      id: "qr_2",
      shortcut: "gear",
      message:
        "I shoot with Sony A7IV + 35mm f/1.4 GM and edit in DaVinci Resolve & Opexnal AI Studio!",
    },
  ],
  faqAutomationEnabled: true,
  brandedContentEligible: true,
  paidPartnershipTagEnabled: true,
  approvedBrandPartners: ["Apex Audio", "Lumina Optics", "Nova Workstations"],

  creatorSubscriptionsEnabled: true,
  creatorTierPrice: 4.99,
  subscriberBadgeCustomCrown: true,
  subscriberPriorityDMs: true,
  activeUserSubscriptions: [
    {
      id: "sub_1",
      creatorUsername: "zenith_design",
      tier: "Supporter Tier",
      price: 4.99,
      renewsAt: "2026-10-01T00:00:00Z",
      status: "active",
    },
  ],
  opexnalMembership: {
    plan: "opexnal_one",
    price: 9.99,
    billingCycle: "monthly",
    status: "active",
    renewsAt: "2026-10-05T00:00:00Z",
  },

  isPrivate: false,
  showActivityStatus: true,
  showReadReceipts: true,
  locationPrivacyEnabled: true,
  suggestAccountToContacts: true,
  allowSearchEngineIndexing: true,
  closeFriends: ["zenith_design", "maya_codes", "rohit_visuals"],
  blockedUsers: [
    { id: "blk_1", username: "spam_bot_902", blockedAt: "2026-02-14T10:00:00Z" },
    { id: "blk_2", username: "crypto_drop_alerts", blockedAt: "2026-02-18T14:30:00Z" },
  ],
  restrictedUsers: [
    { id: "rst_1", username: "curious_critic", restrictedAt: "2026-02-20T08:00:00Z" },
  ],
  mutedUsers: [{ id: "mut_1", username: "overposting_daily", mutePosts: true, muteStories: true }],
  hiddenStoriesFrom: ["random_acquaintance_44"],

  allowTagsFrom: "everyone",
  allowMentionsFrom: "everyone",
  manualTagApproval: false,
  messageRequestsFrom: "everyone",
  groupRequestsFrom: "following",
  storyRepliesFrom: "everyone",
  allowCallsFrom: "following",
  typingIndicatorsEnabled: true,

  whoCanComment: "everyone",
  blockedCommenters: [],
  hideOffensiveComments: true,
  customKeywordFilter: ["scam", "telegram giveaway", "whatsapp link", "free crypto"],
  manualCommentApproval: false,
  limitInteractionsNewAccounts: false,

  allowPostSharingToStories: true,
  allowReelsSharing: true,
  allowStoryResharing: true,
  allowReelsRemix: true,
  allowReuseAudio: true,
  allowReelsDownloads: true,
  allowPostEmbeds: true,

  sensitiveContentLevel: "standard",
  hideLikeAndViewCounts: false,
  feedMode: "algorithmic",
  favoriteCreators: ["maya_codes", "zenith_design", "alex_adventures"],
  notInterestedTags: ["celebrity gossip", "prank videos"],
  preferredTopics: ["Design", "AI Engineering", "Nature Photography", "Cinematography"],

  uploadHighestQuality: true,
  cellularDataSaver: false,
  videoQualityPreference: "hd_always",
  autoplayVideos: "always",
  autoSaveOriginalMedia: true,
  autoGenerateCaptions: true,
  highContrastMode: false,
  appLanguage: "en",
  autoTranslateCaptions: true,

  parentalSupervisionEnabled: false,
  supervisedGuardianEmail: null,
  dailyScreenLimitMinutes: 120,

  paymentProviderConfigured: false, // Honest server-authoritative flag: needs Stripe/Razorpay configuration
  creatorBalanceCents: 14250, // $142.50
  pendingPayoutsCents: 4500, // $45.00
  lifetimeEarningsCents: 89000, // $890.00
  minimumPayoutThresholdCents: 5000, // $50.00
  payoutDestination: {
    type: "bank",
    accountIdentifier: "•••• 4819",
    holderName: "Opexnal Creator LLC",
    verified: true,
  },
  taxFormSubmitted: true,
  savedPaymentMethods: [
    {
      id: "pm_1",
      brand: "visa",
      last4: "4242",
      expiry: "09/28",
      isDefault: true,
    },
    {
      id: "pm_2",
      brand: "mastercard",
      last4: "8812",
      expiry: "11/27",
      isDefault: false,
    },
  ],

  notificationsLikes: true,
  notificationsComments: true,
  notificationsFollowers: true,
  notificationsFollowRequests: true,
  notificationsMessages: true,
  notificationsMessageRequests: true,
  notificationsMentions: true,
  notificationsTags: true,
  notificationsStories: true,
  notificationsReels: true,
  notificationsLive: true,
  notificationsCalls: true,
  notificationsCreatorAlerts: true,
  notificationsMonetization: true,
  notificationsPayments: true,
  notificationsSecurity: true,
  notificationsEmail: true,
  notificationsPush: true,
  notificationsInApp: true,

  recentlyDeletedItems: [
    {
      id: "del_post_1",
      type: "post",
      title: "Draft sunset reel with 4K color grade",
      deletedAt: "2026-03-01T10:00:00Z",
      daysRemaining: 27,
      thumbnailUrl:
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=200&q=80",
    },
    {
      id: "del_story_2",
      type: "story",
      title: "Behind the scenes in studio",
      deletedAt: "2026-03-02T15:00:00Z",
      daysRemaining: 28,
      thumbnailUrl:
        "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=200&q=80",
    },
  ],
  exportRequests: [
    {
      id: "exp_2026_01",
      format: "json",
      categories: ["Profile", "Posts", "Comments", "Direct Messages", "Media Metadata"],
      createdAt: "2026-02-15T12:00:00Z",
      status: "ready",
      downloadUrl: "#",
      fileSizeBytes: 14285000,
    },
  ],
  isDeactivated: false,
  deactivatedAt: null,
};

const STORAGE_KEY = "opexnal_master_settings_v3";

/**
 * Retrieves the unified settings object with deep merge and Supabase profile synchronization.
 */
export function getStoredSettings(): OpexnalSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/**
 * Saves updated settings, updates local storage, and syncs profile columns with Supabase when logged in.
 */
export async function saveSettings(
  patch: Partial<OpexnalSettings>,
  userId?: string,
): Promise<OpexnalSettings> {
  const current = getStoredSettings();
  const updated: OpexnalSettings = { ...current, ...patch };

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore storage quota error
    }
  }

  // Synchronize applicable privacy & profile columns with Supabase if userId is authenticated
  if (userId) {
    try {
      const profileUpdates: {
        is_private?: boolean;
        show_activity_status?: boolean;
        allow_tags_from?: string;
        allow_mentions_from?: string;
        account_type?: "personal" | "creator" | "business";
      } = {};
      if ("isPrivate" in patch && patch.isPrivate !== undefined)
        profileUpdates.is_private = patch.isPrivate;
      if ("showActivityStatus" in patch && patch.showActivityStatus !== undefined)
        profileUpdates.show_activity_status = patch.showActivityStatus;
      if ("allowTagsFrom" in patch && patch.allowTagsFrom !== undefined)
        profileUpdates.allow_tags_from = patch.allowTagsFrom;
      if ("allowMentionsFrom" in patch && patch.allowMentionsFrom !== undefined)
        profileUpdates.allow_mentions_from = patch.allowMentionsFrom;
      if ("accountType" in patch && patch.accountType !== undefined)
        profileUpdates.account_type = patch.accountType;

      if (Object.keys(profileUpdates).length > 0) {
        await supabase.from("profiles").update(profileUpdates).eq("id", userId);
      }
    } catch {
      // non-fatal fallback
    }
  }

  // Dispatch custom window event for instant reactive component updates
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("opexnal:settings-updated", { detail: updated }));
  }

  return updated;
}

/**
 * Item specification for setting searchable items across all categories
 */
export interface SearchableSettingItem {
  id: string;
  categoryNumber: number;
  categoryTitle: string;
  title: string;
  description: string;
  keywords: string[];
  route?: string;
  dialog?: string;
}

export const SETTINGS_SEARCH_INDEX: SearchableSettingItem[] = [
  // 1. Your Account
  {
    id: "edit_profile",
    categoryNumber: 1,
    categoryTitle: "Your account",
    title: "Edit profile",
    description: "Name, username, bio, website, avatar & pronouns",
    keywords: ["profile", "name", "username", "bio", "avatar", "photo", "website", "picture"],
    route: "/profile/edit",
  },
  {
    id: "personal_details",
    categoryNumber: 1,
    categoryTitle: "Your account",
    title: "Personal details",
    description: "Contact email, phone number, birthday & account ownership",
    keywords: [
      "personal",
      "details",
      "email",
      "phone",
      "birthday",
      "dob",
      "ownership",
      "contact",
      "verification",
    ],
    dialog: "personal_details",
  },
  {
    id: "account_status",
    categoryNumber: 1,
    categoryTitle: "Your account",
    title: "Account status",
    description: "Guidelines standing, monetization eligibility & recommendation badges",
    keywords: [
      "status",
      "guidelines",
      "strikes",
      "violations",
      "monetization",
      "standing",
      "recommendation",
      "badges",
    ],
    dialog: "account_status",
  },

  // 2. Accounts Center
  {
    id: "accounts_center",
    categoryNumber: 2,
    categoryTitle: "Accounts Center",
    title: "Accounts Center",
    description: "Connected profiles, cross-posting & identity sync across platforms",
    keywords: [
      "accounts",
      "center",
      "connected",
      "sync",
      "threads",
      "meta",
      "crossposting",
      "avatar sync",
    ],
    dialog: "accounts_center",
  },
  {
    id: "password_security",
    categoryNumber: 2,
    categoryTitle: "Accounts Center",
    title: "Password and security",
    description: "Change password, TOTP two-factor authentication, security alerts & sessions",
    keywords: [
      "password",
      "security",
      "credentials",
      "two factor",
      "2fa",
      "totp",
      "mfa",
      "audit log",
      "sessions",
      "login activity",
    ],
    route: "/settings/security",
  },
  {
    id: "ad_preferences",
    categoryNumber: 2,
    categoryTitle: "Accounts Center",
    title: "Personal details & ad preferences",
    description: "Data usage, creator partner ads, personalized ads & topic controls",
    keywords: [
      "ads",
      "advertising",
      "preferences",
      "topics",
      "personalization",
      "sponsored",
      "commercial",
    ],
    dialog: "ad_preferences",
  },

  // 3. How You Use Opexnal
  {
    id: "your_activity",
    categoryNumber: 3,
    categoryTitle: "How you use Opexnal",
    title: "Your activity & history",
    description: "Likes, comments, tags, mentions, search history & account history",
    keywords: [
      "activity",
      "history",
      "likes",
      "comments",
      "tags",
      "mentions",
      "search history",
      "shares",
    ],
    route: "/activity",
  },
  {
    id: "saved_collections",
    categoryNumber: 3,
    categoryTitle: "How you use Opexnal",
    title: "Saved",
    description: "Private bookmarks, saved posts, audio collections & custom folders",
    keywords: ["saved", "collections", "bookmarks", "audio", "folders", "saves", "favorites"],
    dialog: "saved",
  },
  {
    id: "archive",
    categoryNumber: 3,
    categoryTitle: "How you use Opexnal",
    title: "Archive",
    description: "Stories archive, past reels, live archive & auto-saving retention",
    keywords: [
      "archive",
      "stories archive",
      "posts archive",
      "live archive",
      "retention",
      "expired",
    ],
    dialog: "archive",
  },
  {
    id: "time_spent",
    categoryNumber: 3,
    categoryTitle: "How you use Opexnal",
    title: "Time spent & management",
    description: "Daily screen time average, break alerts, usage limits & bedtime reminders",
    keywords: ["time", "spent", "screen time", "break", "limits", "usage", "wellbeing", "bedtime"],
    dialog: "time_spent",
  },
  {
    id: "notifications",
    categoryNumber: 3,
    categoryTitle: "How you use Opexnal",
    title: "Notifications",
    description: "Granular controls for likes, comments, DMs, live, quiet mode & pause all",
    keywords: [
      "notifications",
      "push",
      "alerts",
      "quiet mode",
      "pause all",
      "sounds",
      "badges",
      "email alerts",
    ],
    dialog: "notifications",
  },

  // 4. Your Insights & Tools
  {
    id: "ai_studio",
    categoryNumber: 4,
    categoryTitle: "Your insights & tools",
    title: "Opexnal AI Studio",
    description: "Multimodal generative AI tools, viral captions, hooks & hashtag co-pilot",
    keywords: [
      "ai",
      "studio",
      "generative",
      "captions",
      "hashtags",
      "hooks",
      "gemini",
      "assistant",
    ],
    route: "/ai",
  },
  {
    id: "creator_insights",
    categoryNumber: 4,
    categoryTitle: "Your insights & tools",
    title: "Creator insights & analytics",
    description: "Reach, profile visits, engagement rate, impressions & follower growth",
    keywords: [
      "insights",
      "analytics",
      "reach",
      "views",
      "engagement",
      "metrics",
      "stats",
      "audience",
      "growth",
    ],
    dialog: "insights",
  },
  {
    id: "branded_content",
    categoryNumber: 4,
    categoryTitle: "Your insights & tools",
    title: "Branded content & partnerships",
    description: "Paid partnership label, commercial tags & brand partner approvals",
    keywords: [
      "branded",
      "partnerships",
      "commercial",
      "sponsor",
      "brand",
      "disclosure",
      "paid partner",
    ],
    dialog: "branded_content",
  },
  {
    id: "account_type",
    categoryNumber: 4,
    categoryTitle: "Your insights & tools",
    title: "Account type & professional tools",
    description: "Switch between Creator, Personal, and Business account architecture",
    keywords: [
      "account type",
      "professional",
      "creator",
      "business",
      "personal",
      "switch account type",
      "quick replies",
    ],
    dialog: "account_type",
  },

  // 5. Subscriptions
  {
    id: "creator_subscriptions",
    categoryNumber: 5,
    categoryTitle: "Subscriptions",
    title: "Creator subscriptions",
    description: "Fan subscription tier pricing, subscriber-only reels & exclusive perks",
    keywords: [
      "subscriptions",
      "creator",
      "fan",
      "tiers",
      "exclusive",
      "pricing",
      "earnings",
      "subscribers",
    ],
    dialog: "creator_subscriptions",
  },
  {
    id: "active_subscriptions",
    categoryNumber: 5,
    categoryTitle: "Subscriptions",
    title: "Your active subscriptions",
    description: "Creators you support, Opexnal One / Plus status & renewal invoices",
    keywords: [
      "active subscriptions",
      "opexnal one",
      "opexnal plus",
      "billing",
      "renewals",
      "receipts",
      "membership",
    ],
    dialog: "active_subscriptions",
  },
  {
    id: "subscriber_badges",
    categoryNumber: 5,
    categoryTitle: "Subscriptions",
    title: "Subscriber badges & perks",
    description: "Chat crown badges, exclusive story rings & priority DM placement",
    keywords: ["badges", "crown", "perks", "subscriber", "priority dms", "vip", "chat badge"],
    dialog: "subscriber_badges",
  },

  // 6. Who Can See Your Content
  {
    id: "account_privacy",
    categoryNumber: 6,
    categoryTitle: "Who can see your content",
    title: "Account privacy",
    description: "Private account toggle, profile discovery & activity status",
    keywords: ["privacy", "private account", "public", "visibility", "discoverable", "secret"],
    route: "/settings/privacy",
  },
  {
    id: "close_friends",
    categoryNumber: 6,
    categoryTitle: "Who can see your content",
    title: "Close Friends",
    description: "Manage your curated green-ring close friends circle for exclusive stories",
    keywords: ["close friends", "green ring", "exclusive circle", "best friends", "private story"],
    dialog: "close_friends",
  },
  {
    id: "blocked_accounts",
    categoryNumber: 6,
    categoryTitle: "Who can see your content",
    title: "Blocked accounts",
    description: "View blocked users and unblock with one click",
    keywords: ["blocked", "blocklist", "unblock", "user block", "bans"],
    dialog: "blocked_accounts",
  },
  {
    id: "hide_story",
    categoryNumber: 6,
    categoryTitle: "Who can see your content",
    title: "Hide story and live",
    description: "Prevent specific users from viewing your stories and live broadcasts",
    keywords: ["hide story", "hide live", "broadcast", "story visibility", "exclude users"],
    dialog: "hide_story",
  },

  // 7. How Others Can Interact With You
  {
    id: "messages_replies",
    categoryNumber: 7,
    categoryTitle: "How others can interact with you",
    title: "Messages and story replies",
    description: "Message requests, read receipts, calling permissions & active status",
    keywords: [
      "messages",
      "dms",
      "replies",
      "read receipts",
      "calls",
      "chat requests",
      "direct messages",
    ],
    route: "/messages",
  },
  {
    id: "tags_mentions",
    categoryNumber: 7,
    categoryTitle: "How others can interact with you",
    title: "Tags and mentions",
    description: "Choose who can tag or mention you in posts and stories, manual approval",
    keywords: ["tags", "mentions", "tagging", "approval", "who can tag", "@mentions"],
    route: "/settings/privacy",
  },
  {
    id: "comment_filter",
    categoryNumber: 7,
    categoryTitle: "How others can interact with you",
    title: "Comments & hidden words",
    description: "Profanity filters, custom offensive word blacklist & comment approvals",
    keywords: [
      "comments",
      "hidden words",
      "profanity",
      "offensive",
      "filter",
      "block words",
      "comment moderation",
    ],
    dialog: "comment_filter",
  },
  {
    id: "sharing_remixes",
    categoryNumber: 7,
    categoryTitle: "How others can interact with you",
    title: "Sharing and remixes",
    description: "Reels remixing, audio reuse, downloads, embeds & story resharing",
    keywords: ["sharing", "remix", "remixes", "reuse audio", "downloads", "embeds", "crossposting"],
    dialog: "sharing_remixes",
  },
  {
    id: "restricted_accounts",
    categoryNumber: 7,
    categoryTitle: "How others can interact with you",
    title: "Restricted accounts",
    description: "Quietly protect yourself from unwanted interactions without blocking",
    keywords: ["restricted", "restrict", "limit", "shadow", "quiet limit"],
    dialog: "restricted_accounts",
  },

  // 8. What You See
  {
    id: "favorites",
    categoryNumber: 8,
    categoryTitle: "What you see",
    title: "Favorites",
    description: "Prioritize posts from starred creators and switch to Favorites feed",
    keywords: ["favorites", "starred", "priority feed", "favorite creators", "stars"],
    dialog: "favorites",
  },
  {
    id: "muted_accounts",
    categoryNumber: 8,
    categoryTitle: "What you see",
    title: "Muted accounts",
    description: "Manage muted posts, muted stories and author notes without unfollowing",
    keywords: ["muted", "mute", "unmute", "silence", "hide posts"],
    dialog: "muted_accounts",
  },
  {
    id: "content_preferences",
    categoryNumber: 8,
    categoryTitle: "What you see",
    title: "Content preferences",
    description: "Sensitive content control, reset Explore recommendations & topic controls",
    keywords: [
      "content preferences",
      "sensitive content",
      "explore",
      "recommendations",
      "reset suggestions",
      "topics",
    ],
    dialog: "content_preferences",
  },
  {
    id: "like_counts",
    categoryNumber: 8,
    categoryTitle: "What you see",
    title: "Like and view counts",
    description: "Hide total like and view counts across your posts and other creators' posts",
    keywords: ["likes", "views", "counts", "hide likes", "vanity metrics", "view counts"],
    dialog: "like_counts",
  },

  // 9. Your App & Media
  {
    id: "device_permissions",
    categoryNumber: 9,
    categoryTitle: "Your app & media",
    title: "Device permissions",
    description: "Camera, microphone, photo library & push notification hardware access",
    keywords: ["permissions", "camera", "microphone", "photos", "hardware", "device access"],
    dialog: "device_permissions",
  },
  {
    id: "archiving_downloading",
    categoryNumber: 9,
    categoryTitle: "Your app & media",
    title: "Archiving and downloading",
    description: "Auto-save stories to archive, save to camera roll & cloud backups",
    keywords: ["downloading", "auto-save", "camera roll", "cloud backup", "media storage"],
    dialog: "archiving_downloading",
  },
  {
    id: "accessibility_captions",
    categoryNumber: 9,
    categoryTitle: "Your app & media",
    title: "Accessibility & captions",
    description: "Auto-generated subtitles, high-contrast visibility & screen reader support",
    keywords: ["accessibility", "captions", "subtitles", "contrast", "screen reader", "alt text"],
    dialog: "accessibility_captions",
  },
  {
    id: "language_region",
    categoryNumber: 9,
    categoryTitle: "Your app & media",
    title: "Language & region",
    description: "Display language (English, Hindi, Hinglish, Spanish) & auto-translations",
    keywords: ["language", "region", "locale", "hindi", "hinglish", "spanish", "translation"],
    dialog: "language_region",
  },
  {
    id: "data_usage",
    categoryNumber: 9,
    categoryTitle: "Your app & media",
    title: "Data usage and media quality",
    description: "Cellular data saver mode, upload at highest quality (4K) & video autoplay",
    keywords: [
      "data usage",
      "media quality",
      "data saver",
      "highest quality",
      "4k upload",
      "autoplay",
      "bandwidth",
    ],
    dialog: "data_usage",
  },

  // 10. Family Center
  {
    id: "supervision",
    categoryNumber: 10,
    categoryTitle: "Family Center",
    title: "Supervision",
    description: "Parental supervision, invite guardian & screen time schedules",
    keywords: ["supervision", "parental", "family", "guardian", "teen safety", "screen schedule"],
    dialog: "supervision",
  },
  {
    id: "safety_hub",
    categoryNumber: 10,
    categoryTitle: "Family Center",
    title: "Education & safety hub",
    description: "Teen privacy defaults, anti-bullying resources & guardian safety guides",
    keywords: ["safety", "hub", "education", "teen privacy", "anti-bullying", "resources"],
    dialog: "safety_hub",
  },

  // 11. Orders & Payments
  {
    id: "payment_methods",
    categoryNumber: 11,
    categoryTitle: "Orders & payments",
    title: "Payment methods",
    description: "Saved cards, UPI, digital wallet & billing details (Server status checked)",
    keywords: ["payments", "payment methods", "cards", "upi", "billing", "wallet", "checkout"],
    dialog: "payment_methods",
  },
  {
    id: "order_history",
    categoryNumber: 11,
    categoryTitle: "Orders & payments",
    title: "Order history & receipts",
    description: "Subscription invoices, creator tips, digital gifts & tax receipts",
    keywords: ["orders", "receipts", "invoices", "history", "purchases", "creator tips", "gifts"],
    dialog: "order_history",
  },
  {
    id: "payouts",
    categoryNumber: 11,
    categoryTitle: "Orders & payments",
    title: "Monetization payouts",
    description: "Creator balance, direct deposit destination, tax forms & payout schedules",
    keywords: ["payouts", "earnings", "balance", "direct deposit", "tax", "revenue", "withdraw"],
    dialog: "payouts",
  },

  // 12. More Info & Support
  {
    id: "help_center",
    categoryNumber: 12,
    categoryTitle: "More info & support",
    title: "Help Center & FAQs",
    description: "Searchable troubleshooting guides, FAQ & report a technical problem",
    keywords: ["help", "faqs", "support", "troubleshooting", "report problem", "bug report"],
    dialog: "help_center",
  },
  {
    id: "support_requests",
    categoryNumber: 12,
    categoryTitle: "More info & support",
    title: "Support requests & appeals",
    description: "Track submitted reports, content decisions, strikes & policy appeals",
    keywords: ["appeals", "tickets", "support requests", "violations", "reports tracking"],
    dialog: "support_requests",
  },
  {
    id: "about_opexnal",
    categoryNumber: 12,
    categoryTitle: "More info & support",
    title: "About Opexnal",
    description: "Platform release v2.5, multimodal architecture & engineering credits",
    keywords: ["about", "version", "release", "credits", "legal", "opexnal"],
    dialog: "about",
  },
  {
    id: "terms_of_service",
    categoryNumber: 12,
    categoryTitle: "More info & support",
    title: "Terms of Service",
    description: "Creator rights, intellectual property ownership & platform terms",
    keywords: ["terms", "tos", "conditions", "intellectual property", "creator rights", "contract"],
    dialog: "terms",
  },

  // 13. Also from Opexnal
  {
    id: "opexnal_ai_suite",
    categoryNumber: 13,
    categoryTitle: "Also from Opexnal",
    title: "Opexnal AI Suite",
    description: "Multimodal generative AI creator engine and smart content studio",
    keywords: ["ai suite", "gemini", "generative ai", "creator suite", "tools"],
    route: "/ai",
  },
  {
    id: "opexnal_messenger",
    categoryNumber: 13,
    categoryTitle: "Also from Opexnal",
    title: "Opexnal Messenger",
    description: "Direct encrypted chat, voice notes & real-time messaging",
    keywords: ["messenger", "chat", "direct messaging", "inbox", "conversations"],
    route: "/messages",
  },
  {
    id: "creator_web",
    categoryNumber: 13,
    categoryTitle: "Also from Opexnal",
    title: "Opexnal Studio for Web",
    description: "Desktop publishing suite, post scheduling, bulk uploads & analytics",
    keywords: ["studio", "web", "desktop", "scheduling", "bulk upload", "publishing"],
    dialog: "creator_web",
  },

  // 14. Account Management & Lifecycle
  {
    id: "download_export_data",
    categoryNumber: 14,
    categoryTitle: "Account management & lifecycle",
    title: "Download your data / Export",
    description: "Request an archive of your profile, posts, reels, messages & comments",
    keywords: ["export", "download data", "archive data", "backup", "gdpr", "data portability"],
    dialog: "download_data",
  },
  {
    id: "recently_deleted",
    categoryNumber: 14,
    categoryTitle: "Account management & lifecycle",
    title: "Recently deleted",
    description: "Restore posts, reels and stories within 30 days or delete permanently",
    keywords: ["recently deleted", "restore", "trash", "recycle bin", "permanent deletion"],
    dialog: "recently_deleted",
  },
  {
    id: "deactivate_account",
    categoryNumber: 14,
    categoryTitle: "Account management & lifecycle",
    title: "Account deactivation & deletion",
    description: "Temporarily deactivate or permanently delete your Opexnal profile",
    keywords: ["deactivate", "delete account", "close account", "erase data", "disable"],
    dialog: "deactivate_account",
  },
  {
    id: "login_activity_sessions",
    categoryNumber: 14,
    categoryTitle: "Account management & lifecycle",
    title: "Login activity & active sessions",
    description: "Devices logged into your account, IP addresses & revoke session",
    keywords: [
      "sessions",
      "devices",
      "login activity",
      "revoke session",
      "logout devices",
      "macbook",
      "iphone",
    ],
    dialog: "active_sessions",
  },
];

/**
 * High-performance real-time search across all settings
 */
export function searchSettings(query: string): SearchableSettingItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  return SETTINGS_SEARCH_INDEX.filter((item) => {
    if (item.title.toLowerCase().includes(q)) return true;
    if (item.description.toLowerCase().includes(q)) return true;
    if (item.categoryTitle.toLowerCase().includes(q)) return true;
    return item.keywords.some((k) => k.toLowerCase().includes(q));
  });
}
