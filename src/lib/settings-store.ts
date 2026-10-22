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
  saveStoryToCameraRoll: boolean;
  storyReplyPermission: "everyone" | "following" | "off";
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
  reducedMotion: boolean;
  advancedCommentFiltering: boolean;
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
  email: "",
  phone: "",
  dateOfBirth: "",
  ownershipVerified: false,
  recoveryEmail: "",
  recoveryPhone: "",
  backupCodes: [],
  twoFactorEnabled: false,
  securityAlertsEmail: true,
  activeSessions: [],

  crossPostingEnabled: false,
  syncProfileData: true,
  connectedNetworks: [
    { id: "threads", name: "Threads", connected: false, username: "" },
    { id: "x", name: "X / Twitter", connected: false, username: "" },
    { id: "youtube", name: "YouTube Shorts", connected: false, username: "" },
  ],
  interestBasedAds: false,
  adTopics: ["Technology", "Photography", "AI & Design", "Music", "Travel"],

  savedCollections: [],
  storiesArchiveAutoSave: true,
  postsArchiveAutoSave: true,
  liveArchiveAutoSave: false,
  timeSpentDailyGoalMinutes: 45,
  bedtimeReminderEnabled: false,
  bedtimeReminderTime: "23:00",
  pauseAllNotifications: false,
  pauseAllDuration: "off",
  pauseUntil: null,
  quietModeEnabled: false,
  quietModeStart: "23:00",
  quietModeEnd: "07:00",

  accountType: "personal",
  creatorModeEnabled: false,
  professionalCategory: "",
  quickReplies: [],
  faqAutomationEnabled: false,
  brandedContentEligible: false,
  paidPartnershipTagEnabled: false,
  approvedBrandPartners: [],

  creatorSubscriptionsEnabled: false,
  creatorTierPrice: 0,
  subscriberBadgeCustomCrown: false,
  subscriberPriorityDMs: false,
  activeUserSubscriptions: [],
  opexnalMembership: {
    plan: "free",
    price: 0,
    billingCycle: "monthly",
    status: "none",
    renewsAt: null,
  },

  isPrivate: true,
  showActivityStatus: false,
  showReadReceipts: false,
  locationPrivacyEnabled: true,
  suggestAccountToContacts: false,
  allowSearchEngineIndexing: true,
  closeFriends: [],
  blockedUsers: [],
  restrictedUsers: [],
  mutedUsers: [],
  hiddenStoriesFrom: [],

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
  saveStoryToCameraRoll: false,
  storyReplyPermission: "everyone",
  allowReelsRemix: true,
  allowReuseAudio: true,
  allowReelsDownloads: true,
  allowPostEmbeds: true,

  sensitiveContentLevel: "standard",
  hideLikeAndViewCounts: false,
  feedMode: "algorithmic",
  favoriteCreators: [],
  notInterestedTags: [],
  preferredTopics: [],

  uploadHighestQuality: true,
  cellularDataSaver: false,
  videoQualityPreference: "hd_always",
  autoplayVideos: "always",
  autoSaveOriginalMedia: true,
  autoGenerateCaptions: true,
  highContrastMode: false,
  reducedMotion: false,
  advancedCommentFiltering: true,
  appLanguage: "en",
  autoTranslateCaptions: true,

  parentalSupervisionEnabled: false,
  supervisedGuardianEmail: null,
  dailyScreenLimitMinutes: 120,

  paymentProviderConfigured: false, // Honest server-authoritative flag: needs Stripe/Razorpay configuration
  creatorBalanceCents: 0,
  pendingPayoutsCents: 0,
  lifetimeEarningsCents: 0,
  minimumPayoutThresholdCents: 5000, // $50.00
  payoutDestination: {
    type: "bank",
    accountIdentifier: "",
    holderName: "",
    verified: false,
  },
  taxFormSubmitted: false,
  savedPaymentMethods: [],

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

  recentlyDeletedItems: [],
  exportRequests: [],
  isDeactivated: false,
  deactivatedAt: null,
};

const STORAGE_KEY = "opexnal_master_settings_v3";

function getSettingsStorageKey(userId?: string): string {
  return userId ? `${STORAGE_KEY}:${encodeURIComponent(userId)}` : STORAGE_KEY;
}

/**
 * Retrieves the unified settings object with deep merge and Supabase profile synchronization.
 */
export function getStoredSettings(userId?: string): OpexnalSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(getSettingsStorageKey(userId));
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
  const current = getStoredSettings(userId);
  const updated: OpexnalSettings = { ...current, ...patch };

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(getSettingsStorageKey(userId), JSON.stringify(updated));
    } catch {
      // ignore storage quota error
    }
  }

  // Synchronize applicable privacy & profile columns with Supabase if userId is authenticated
  const { data: authData } = await supabase.auth.getUser();
  const effectiveUserId = authData?.user?.id || userId;

  if (effectiveUserId) {
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
        await supabase.from("profiles").update(profileUpdates).eq("id", effectiveUserId);
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

export async function updateSettings(
  userIdOrPatch: string | Partial<OpexnalSettings> | undefined,
  maybePatch?: Partial<OpexnalSettings>,
): Promise<OpexnalSettings> {
  if (typeof userIdOrPatch === "string") {
    return saveSettings(maybePatch || {}, userIdOrPatch);
  }
  return saveSettings(userIdOrPatch || {}, undefined);
}

/**
 * Item specification for setting searchable items across all categories
 */
export interface SearchableSettingItem {
  id: string;
  categoryNumber: number;
  categoryTitle: string;
  title: string;
  titleGu?: string;
  description: string;
  descriptionGu?: string;
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
    titleGu: "પ્રોફાઇલ એડિટ કરો",
    description: "Name, username, bio, website, avatar & pronouns",
    descriptionGu: "નામ, યુઝરનેમ, બાયો, વેબસાઇટ, અવતાર અને પ્રોનાઉન્સ",
    keywords: [
      "profile",
      "name",
      "username",
      "bio",
      "avatar",
      "photo",
      "website",
      "picture",
      "પ્રોફાઇલ",
      "નામ",
      "બાયો",
      "અવતાર",
      "ફોટો",
    ],
    route: "/profile/edit",
  },
  {
    id: "personal_details",
    categoryNumber: 1,
    categoryTitle: "Your account",
    title: "Personal details",
    titleGu: "વ્યક્તિગત વિગતો (Personal details)",
    description: "Contact email, phone number, birthday & account ownership",
    descriptionGu: "સંપર્ક માહિતી (ઈમેલ અને મોબાઇલ નંબર), જન્મતારીખ અને અકાઉન્ટ ઓનરશિપ",
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
      "વ્યક્તિગત વિગતો",
      "ઈમેલ",
      "મોબાઇલ નંબર",
      "જન્મતારીખ",
      "ઓળખ ચકાસણી",
    ],
    dialog: "personal_details",
  },
  {
    id: "account_status",
    categoryNumber: 1,
    categoryTitle: "Your account",
    title: "Account status",
    titleGu: "અકાઉન્ટ સ્ટેટસ (Account status)",
    description: "Guidelines standing, monetization eligibility & recommendation badges",
    descriptionGu: "ગાઇડલાઇન્સ સ્ટેન્ડિંગ, મોનેટાઇઝેશન પાત્રતા અને ભલામણ બેજ",
    keywords: [
      "status",
      "guidelines",
      "strikes",
      "violations",
      "monetization",
      "standing",
      "recommendation",
      "badges",
      "અકાઉન્ટ સ્ટેટસ",
      "મોનેટાઇઝેશન",
      "સ્ટ્રાઇક",
    ],
    dialog: "account_status",
  },

  // 2. Accounts Center
  {
    id: "accounts_center",
    categoryNumber: 2,
    categoryTitle: "Accounts Center",
    title: "Accounts Center",
    titleGu: "અકાઉન્ટ્સ સેન્ટર (Accounts Center)",
    description: "Connected profiles, cross-posting & identity sync across platforms",
    descriptionGu: "પ્રોફાઇલ્સ (Opexnal, Facebook), એકાઉન્ટ્સ લિંક કરવા, ક્રોસ-પોસ્ટિંગ અને સિંક",
    keywords: [
      "accounts",
      "center",
      "connected",
      "sync",
      "threads",
      "meta",
      "crossposting",
      "avatar sync",
      "અકાઉન્ટ સેન્ટર",
      "ફેસબુક",
      "લિંક",
      "પ્રોફાઇલ્સ",
    ],
    dialog: "accounts_center",
  },
  {
    id: "password_security",
    categoryNumber: 2,
    categoryTitle: "Accounts Center",
    title: "Password and security",
    titleGu: "પાસવર્ડ અને સુરક્ષા (Password and security)",
    description: "Change password, TOTP two-factor authentication, security alerts & sessions",
    descriptionGu:
      "પાસવર્ડ બદલવો, 2FA સુરક્ષા, સેવ્ડ લોગિન, કયા ડિવાઇસમાં લોગિન છે અને સિક્યોરિટી ચેક",
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
      "પાસવર્ડ બદલવો",
      "2fa સુરક્ષા",
      "સુરક્ષા",
      "સેવ્ડ લોગિન",
      "કયા ડિવાઇસમાં લોગિન",
    ],
    route: "/settings/security",
  },
  {
    id: "ad_preferences",
    categoryNumber: 2,
    categoryTitle: "Accounts Center",
    title: "Personal details & ad preferences",
    titleGu: "એડ પ્રેફરન્સ (Ad preferences)",
    description: "Data usage, creator partner ads, personalized ads & topic controls",
    descriptionGu:
      "એડ ટોપિક્સ (કઈ જાહેરાતો જોવી), એડ સેટિંગ્સ (ટાર્ગેટેડ એડ્સ) અને પાર્ટનર એક્ટિવિટી",
    keywords: [
      "ads",
      "advertising",
      "preferences",
      "topics",
      "personalization",
      "sponsored",
      "commercial",
      "એડ પ્રેફરન્સ",
      "જાહેરાતો",
      "ટાર્ગેટેડ એડ્સ",
      "એડ ટોપિક્સ",
    ],
    dialog: "ad_preferences",
  },

  // 3. How You Use Opexnal
  {
    id: "your_activity",
    categoryNumber: 3,
    categoryTitle: "How you use Opexnal",
    title: "Your activity & history",
    titleGu: "તમારી પ્રવૃત્તિ (Your activity)",
    description: "Likes, comments, tags, mentions, search history & account history",
    descriptionGu:
      "ઇન્ટરેક્શન્સ (લાઇક્સ, કમેન્ટ્સ, સ્ટોરી રિપ્લાય), ફોટો-વિડીયો, એકાઉન્ટ હિસ્ટ્રી, સર્ચ હિસ્ટ્રી અને રિકવરી",
    keywords: [
      "activity",
      "history",
      "likes",
      "comments",
      "tags",
      "mentions",
      "search history",
      "shares",
      "તમારી પ્રવૃત્તિ",
      "એક્ટિવિટી",
      "લાઇક્સ",
      "કમેન્ટ્સ",
      "સર્ચ હિસ્ટ્રી",
      "લિંક હિસ્ટ્રી",
    ],
    route: "/activity",
  },
  {
    id: "saved_collections",
    categoryNumber: 3,
    categoryTitle: "How you use Opexnal",
    title: "Saved",
    titleGu: "સેવ કરેલું (Saved)",
    description: "Private bookmarks, saved posts, audio collections & custom folders",
    descriptionGu: "સેવ કરેલી તમામ પોસ્ટ્સ, ઓડિયો, રીલ્સ અને બનાવેલા Audio/Post કલેક્શન્સ",
    keywords: [
      "saved",
      "collections",
      "bookmarks",
      "audio",
      "folders",
      "saves",
      "favorites",
      "સેવ",
      "ઓડિયો",
      "રીલ્સ",
      "કલેક્શન",
      "બુકમાર્ક",
    ],
    dialog: "saved",
  },
  {
    id: "archive",
    categoryNumber: 3,
    categoryTitle: "How you use Opexnal",
    title: "Archive",
    titleGu: "આર્કાઇવ (Archive)",
    description: "Stories archive, past reels, live archive & auto-saving retention",
    descriptionGu:
      "Stories Archive (જૂની સ્ટોરીઝ), Posts Archive (હાઇડ પોસ્ટ્સ), Live Archive (લાઈવ વિડીયો)",
    keywords: [
      "archive",
      "stories archive",
      "posts archive",
      "live archive",
      "retention",
      "expired",
      "આર્કાઇવ",
      "જૂની સ્ટોરીઝ",
      "લાઈવ વિડીયો",
      "પોસ્ટ આર્કાઇવ",
    ],
    dialog: "archive",
  },
  {
    id: "time_spent",
    categoryNumber: 3,
    categoryTitle: "How you use Opexnal",
    title: "Time spent & management",
    titleGu: "સમય વ્યવસ્થાપન (Time management)",
    description: "Daily screen time average, break alerts, usage limits & bedtime reminders",
    descriptionGu:
      "Daily limit (રોજની સમય મર્યાદા), Take a break reminders અને Instagram for tablets",
    keywords: [
      "time",
      "spent",
      "screen time",
      "break",
      "limits",
      "usage",
      "wellbeing",
      "bedtime",
      "tablets",
      "સમય મર્યાદા",
      "ડેઇલી લિમિટ",
      "બ્રેક રિમાઇન્ડર",
      "ટેબ્લેટ",
    ],
    dialog: "time_spent",
  },
  {
    id: "notifications",
    categoryNumber: 3,
    categoryTitle: "How you use Opexnal",
    title: "Notifications",
    titleGu: "નોટિફિકેશન્સ (Notifications)",
    description: "Granular controls for likes, comments, DMs, live, quiet mode & pause all",
    descriptionGu:
      "Pause all (તમામ બંધ), Quiet mode (મ્યૂટ સમય), Posts, Stories, Messages, Live અને Email alerts",
    keywords: [
      "notifications",
      "push",
      "alerts",
      "quiet mode",
      "pause all",
      "sounds",
      "badges",
      "email alerts",
      "નોટિફિકેશન",
      "ક્વાયટ મોડ",
      "પોઝ ઓલ",
      "ઈમેલ નોટિફિકેશન",
    ],
    dialog: "notifications",
  },

  // 4. Your Insights & Tools
  {
    id: "ai_studio",
    categoryNumber: 4,
    categoryTitle: "Your insights & tools",
    title: "Opexnal AI Studio",
    titleGu: "Opexnal AI સ્ટુડિયો",
    description: "Multimodal generative AI tools, viral captions, hooks & hashtag co-pilot",
    descriptionGu: "મલ્ટિમોડલ AI ટૂલ્સ, વાયરલ કેપ્શન્સ, હુક્સ અને હેશટેગ કો-પાઇલટ",
    keywords: [
      "ai",
      "studio",
      "generative",
      "captions",
      "hashtags",
      "hooks",
      "gemini",
      "assistant",
      "એઆઈ",
      "સ્ટુડિયો",
      "કેપ્શન",
    ],
    route: "/ai",
  },
  {
    id: "creator_insights",
    categoryNumber: 4,
    categoryTitle: "Your insights & tools",
    title: "Creator insights & analytics",
    titleGu: "પ્રોફેશનલ ડેશબોર્ડ (Professional dashboard & insights)",
    description: "Reach, profile visits, engagement rate, impressions & follower growth",
    descriptionGu:
      "Accounts reached (રીચ), Accounts engaged, Total followers અને Content you shared",
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
      "dashboard",
      "પ્રોફેશનલ ડેશબોર્ડ",
      "ઇનસાઇટ્સ",
      "ફોલોઅર્સ",
      "રીચ",
    ],
    dialog: "insights",
  },
  {
    id: "branded_content",
    categoryNumber: 4,
    categoryTitle: "Your insights & tools",
    title: "Branded content & partnerships",
    titleGu: "બ્રાન્ડેડ કન્ટેન્ટ અને પાર્ટનરશિપ્સ",
    description: "Paid partnership label, commercial tags & brand partner approvals",
    descriptionGu: "પેઇડ પાર્ટનરશિપ લેબલ, કમર્શિયલ ટેગ્સ અને બ્રાન્ડ પાર્ટનર ટૂલ્સ",
    keywords: [
      "branded",
      "partnerships",
      "commercial",
      "sponsor",
      "brand",
      "disclosure",
      "paid partner",
      "બ્રાન્ડેડ કન્ટેન્ટ",
      "પાર્ટનરશિપ",
      "સ્પોન્સર",
    ],
    dialog: "branded_content",
  },
  {
    id: "account_type",
    categoryNumber: 4,
    categoryTitle: "Your insights & tools",
    title: "Account type & professional tools",
    titleGu: "અકાઉન્ટ ટાઇપ અને ટૂલ્સ (Account type & tools)",
    description: "Switch between Creator, Personal, and Business account architecture",
    descriptionGu:
      "Switch to professional/creator/personal, Add new account, Request verification (બ્લુ ટિક)",
    keywords: [
      "account type",
      "professional",
      "creator",
      "business",
      "personal",
      "switch account type",
      "quick replies",
      "verification",
      "blue tick",
      "અકાઉન્ટ ટાઇપ",
      "પ્રોફેશનલ",
      "ક્રિએટર",
      "બ્લુ ટિક",
      "વેરિફિકેશન",
    ],
    dialog: "account_type",
  },

  // 5. Subscriptions
  {
    id: "creator_subscriptions",
    categoryNumber: 5,
    categoryTitle: "Subscriptions",
    title: "Creator subscriptions",
    titleGu: "ક્રિએટર સબસ્ક્રિપ્શન્સ",
    description: "Fan subscription tier pricing, subscriber-only reels & exclusive perks",
    descriptionGu: "ફેન સબસ્ક્રિપ્શન ટિયર, સબસ્ક્રાઇબર એક્સક્લૂસિવ રીલ્સ અને કમાણી",
    keywords: [
      "subscriptions",
      "creator",
      "fan",
      "tiers",
      "exclusive",
      "pricing",
      "earnings",
      "subscribers",
      "સબસ્ક્રિપ્શન",
      "ફેન",
    ],
    dialog: "creator_subscriptions",
  },
  {
    id: "active_subscriptions",
    categoryNumber: 5,
    categoryTitle: "Subscriptions",
    title: "Your active subscriptions",
    titleGu: "તમારા સક્રિય સબસ્ક્રિપ્શન્સ",
    description: "Creators you support, Opexnal One / Plus status & renewal invoices",
    descriptionGu: "તમે સપોર્ટ કરો છો તે ક્રિએટર્સ, Opexnal One પ્લાન અને રિન્યૂઅલ ઇન્વૉઇસ",
    keywords: [
      "active subscriptions",
      "opexnal one",
      "opexnal plus",
      "billing",
      "renewals",
      "receipts",
      "membership",
      "સક્રિય સબસ્ક્રિપ્શન",
    ],
    dialog: "active_subscriptions",
  },
  {
    id: "subscriber_badges",
    categoryNumber: 5,
    categoryTitle: "Subscriptions",
    title: "Subscriber badges & perks",
    titleGu: "સબસ્ક્રાઇબર બેજ અને પર્ક્સ",
    description: "Chat crown badges, exclusive story rings & priority DM placement",
    descriptionGu: "ચેટ ક્રાઉન બેજ, એક્સક્લૂસિવ સ્ટોરી રિંગ્સ અને પ્રાયોરિટી ડીએમ",
    keywords: [
      "badges",
      "crown",
      "perks",
      "subscriber",
      "priority dms",
      "vip",
      "chat badge",
      "બેજ",
      "ક્રાઉન",
    ],
    dialog: "subscriber_badges",
  },

  // 6. Who Can See Your Content
  {
    id: "account_privacy",
    categoryNumber: 6,
    categoryTitle: "Who can see your content",
    title: "Account privacy",
    titleGu: "અકાઉન્ટ પ્રાઇવસી (Account privacy)",
    description: "Private account toggle, profile discovery & activity status",
    descriptionGu: "Private account Toggle (ઓન/ઓફ), પ્રોફાઇલ ડિસ્કવરી અને એક્ટિવિટી સ્ટેટસ",
    keywords: [
      "privacy",
      "private account",
      "public",
      "visibility",
      "discoverable",
      "secret",
      "પ્રાઇવસી",
      "પ્રાઇવેટ અકાઉન્ટ",
      "સિક્રેટ",
    ],
    route: "/settings/privacy",
  },
  {
    id: "close_friends",
    categoryNumber: 6,
    categoryTitle: "Who can see your content",
    title: "Close Friends",
    titleGu: "ક્લોઝ ફ્રેન્ડ્સ (Close Friends)",
    description: "Manage your curated green-ring close friends circle for exclusive stories",
    descriptionGu: "પસંદગીના મિત્રોનું ગ્રીન-રિંગ લિસ્ટ અને એક્સક્લૂસિવ સ્ટોરીઝ",
    keywords: [
      "close friends",
      "green ring",
      "exclusive circle",
      "best friends",
      "private story",
      "ક્લોઝ ફ્રેન્ડ્સ",
      "પસંદગીના મિત્રો",
    ],
    dialog: "close_friends",
  },
  {
    id: "blocked_accounts",
    categoryNumber: 6,
    categoryTitle: "Who can see your content",
    title: "Blocked accounts",
    titleGu: "બ્લોક કરેલા અકાઉન્ટ્સ (Blocked)",
    description: "View blocked users and unblock with one click",
    descriptionGu: "બ્લોક કરેલા તમામ અકાઉન્ટ્સનું લિસ્ટ અને અનબ્લોક કરવાની સુવિધા",
    keywords: ["blocked", "blocklist", "unblock", "user block", "bans", "બ્લોક", "બ્લોક લિસ્ટ"],
    dialog: "blocked_accounts",
  },
  {
    id: "hide_story",
    categoryNumber: 6,
    categoryTitle: "Who can see your content",
    title: "Hide story and live",
    titleGu: "સ્ટોરી અને લાઈવ હાઇડ કરવું (Hide story & live)",
    description: "Prevent specific users from viewing your stories and live broadcasts",
    descriptionGu: "ચોક્કસ વ્યક્તિઓથી તમારી સ્ટોરી કે લાઈવ બ્રોડકાસ્ટ હાઇડ કરો",
    keywords: [
      "hide story",
      "hide live",
      "broadcast",
      "story visibility",
      "exclude users",
      "હાઇડ સ્ટોરી",
      "હાઇડ લાઈવ",
    ],
    dialog: "hide_story",
  },

  // 7. How Others Can Interact With You
  {
    id: "messages_replies",
    categoryNumber: 7,
    categoryTitle: "How others can interact with you",
    title: "Messages and story replies",
    titleGu: "મેસેજીસ અને સ્ટોરી રિપ્લાય (Messages & story replies)",
    description: "Message requests, read receipts, calling permissions & active status",
    descriptionGu: "Message controls (કોણ મોકલી શકે), Story replies, રીડ રિસીપ્ટ અને ચેટ કંટ્રોલ",
    keywords: [
      "messages",
      "dms",
      "replies",
      "read receipts",
      "calls",
      "chat requests",
      "direct messages",
      "મેસેજીસ",
      "ચેટ",
      "સ્ટોરી રિપ્લાય",
    ],
    route: "/messages",
  },
  {
    id: "tags_mentions",
    categoryNumber: 7,
    categoryTitle: "How others can interact with you",
    title: "Tags and mentions",
    titleGu: "ટેગ્સ અને મેન્શન્સ (Tags & mentions)",
    description: "Choose who can tag or mention you in posts and stories, manual approval",
    descriptionGu: "Allow tags from (તમામ, ફોલોઅર્સ), Manually approve tags (જાતે મંજૂરી આપવી)",
    keywords: [
      "tags",
      "mentions",
      "tagging",
      "approval",
      "who can tag",
      "@mentions",
      "ટેગ્સ",
      "મેન્શન્સ",
      "મંજૂરી",
    ],
    route: "/settings/privacy",
  },
  {
    id: "comment_filter",
    categoryNumber: 7,
    categoryTitle: "How others can interact with you",
    title: "Comments & hidden words",
    titleGu: "કમેન્ટ્સ અને ફિલ્ટર્સ (Comments & hidden words)",
    description: "Profanity filters, custom offensive word blacklist & comment approvals",
    descriptionGu:
      "Allow comments from, Block comments from, Filter offensive comments અને હિડન વર્ડ્સ",
    keywords: [
      "comments",
      "hidden words",
      "profanity",
      "offensive",
      "filter",
      "block words",
      "comment moderation",
      "કમેન્ટ્સ",
      "ફિલ્ટર",
      "શબ્દો",
      "બ્લોક કમેન્ટ",
    ],
    dialog: "comment_filter",
  },
  {
    id: "sharing_remixes",
    categoryNumber: 7,
    categoryTitle: "How others can interact with you",
    title: "Sharing and remixes",
    titleGu: "શેરિંગ અને રિમિક્સ (Sharing & remixes)",
    description: "Reels remixing, audio reuse, downloads, embeds & story resharing",
    descriptionGu:
      "Allow story sharing in messages, Allow post sharing to stories, Allow reuse of photos/reels",
    keywords: [
      "sharing",
      "remix",
      "remixes",
      "reuse audio",
      "downloads",
      "embeds",
      "crossposting",
      "શેરિંગ",
      "રિમિક્સ",
      "રીલ્સ રિમિક્સ",
    ],
    dialog: "sharing_remixes",
  },
  {
    id: "restricted_accounts",
    categoryNumber: 7,
    categoryTitle: "How others can interact with you",
    title: "Restricted accounts",
    titleGu: "પ્રતિબંધિત અકાઉન્ટ્સ (Restricted accounts)",
    description: "Quietly protect yourself from unwanted interactions without blocking",
    descriptionGu: "બ્લોક કર્યા વગર અનિચ્છનીય ઇન્ટરેક્શનથી રક્ષણ મેળવો (લિમિટેડ એક્સેસ)",
    keywords: [
      "restricted",
      "restrict",
      "limit",
      "shadow",
      "quiet limit",
      "પ્રતિબંધિત",
      "લિમિટેડ એક્સેસ",
    ],
    dialog: "restricted_accounts",
  },

  // 8. What You See
  {
    id: "favorites",
    categoryNumber: 8,
    categoryTitle: "What you see",
    title: "Favorites",
    titleGu: "ફેવરિટ્સ (Favorites)",
    description: "Prioritize posts from starred creators and switch to Favorites feed",
    descriptionGu: "ફીડમાં સૌથી પહેલાં કન્ટેન્ટ જોવા માટે પસંદ કરેલા એકાઉન્ટ્સ",
    keywords: [
      "favorites",
      "starred",
      "priority feed",
      "favorite creators",
      "stars",
      "ફેવરિટ્સ",
      "પસંદીદા",
      "સ્ટાર",
    ],
    dialog: "favorites",
  },
  {
    id: "muted_accounts",
    categoryNumber: 8,
    categoryTitle: "What you see",
    title: "Muted accounts",
    titleGu: "મ્યૂટ કરેલા અકાઉન્ટ્સ (Muted accounts)",
    description: "Manage muted posts, muted stories and author notes without unfollowing",
    descriptionGu: "મ્યૂટ કરેલી પોસ્ટ્સ, સ્ટોરીઝ અને નોટ્સ (જે ફીડમાં નહીં દેખાય)",
    keywords: ["muted", "mute", "unmute", "silence", "hide posts", "મ્યૂટ", "મ્યૂટ કરેલા", "હાઇડ"],
    dialog: "muted_accounts",
  },
  {
    id: "content_preferences",
    categoryNumber: 8,
    categoryTitle: "What you see",
    title: "Content preferences",
    titleGu: "કન્ટેન્ટ પ્રેફરન્સ (Content preferences)",
    description: "Sensitive content control, reset Explore recommendations & topic controls",
    descriptionGu:
      "Sensitive content control (સંવેદનશીલ કન્ટેન્ટ), Specific words and phrases, Not interested",
    keywords: [
      "content preferences",
      "sensitive content",
      "explore",
      "recommendations",
      "reset suggestions",
      "topics",
      "not interested",
      "કન્ટેન્ટ",
      "સંવેદનશીલ",
      "નૉટ ઇન્ટરેસ્ટેડ",
    ],
    dialog: "content_preferences",
  },
  {
    id: "like_counts",
    categoryNumber: 8,
    categoryTitle: "What you see",
    title: "Like and view counts",
    titleGu: "લાઇક અને શેર કાઉન્ટ્સ (Like & share counts)",
    description: "Hide total like and view counts across your posts and other creators' posts",
    descriptionGu: "પોસ્ટ પરથી લાઇક્સ અને શેરિંગના આંકડા સંતાડવા (હાઇડ કાઉન્ટ્સ)",
    keywords: [
      "likes",
      "views",
      "counts",
      "hide likes",
      "vanity metrics",
      "view counts",
      "લાઇક કાઉન્ટ",
      "હાઇડ લાઇક્સ",
    ],
    dialog: "like_counts",
  },

  // 9. Your App & Media
  {
    id: "device_permissions",
    categoryNumber: 9,
    categoryTitle: "Your app & media",
    title: "Device permissions",
    titleGu: "ડિવાઇસ પરમિશન્સ (Device permissions)",
    description: "Camera, microphone, photo library & push notification hardware access",
    descriptionGu: "Camera, Microphone, Location, Photos/Gallery, Contacts અને Notifications",
    keywords: [
      "permissions",
      "camera",
      "microphone",
      "photos",
      "hardware",
      "device access",
      "પરમિશન",
      "કેમેરા",
      "માઇક્રોફોન",
      "લોકેશન",
      "ગેલેરી",
    ],
    dialog: "device_permissions",
  },
  {
    id: "archiving_downloading",
    categoryNumber: 9,
    categoryTitle: "Your app & media",
    title: "Archiving and downloading",
    titleGu: "આર્કાઇવિંગ અને ડાઉનલોડિંગ (Archiving & downloading)",
    description: "Auto-save stories to archive, save to camera roll & cloud backups",
    descriptionGu:
      "Save story to Archive, Save live to Archive, Save original photos/videos to gallery",
    keywords: [
      "downloading",
      "auto-save",
      "camera roll",
      "cloud backup",
      "media storage",
      "ગેલેરી સેવ",
      "ઓટો સેવ",
      "ડાઉનલોડિંગ",
    ],
    dialog: "archiving_downloading",
  },
  {
    id: "accessibility_captions",
    categoryNumber: 9,
    categoryTitle: "Your app & media",
    title: "Accessibility & captions",
    titleGu: "એક્સેસિબિલિટી અને કેપ્શન્સ (Accessibility & captions)",
    description: "Auto-generated subtitles, high-contrast visibility & screen reader support",
    descriptionGu:
      "Captions (ઓટોમેટિક સબટાઇટલ્સ), Alt text (ફોટો ડિસ્ક્રિપ્શન) અને હાઇ કોન્ટ્રાસ્ટ",
    keywords: [
      "accessibility",
      "captions",
      "subtitles",
      "contrast",
      "screen reader",
      "alt text",
      "સબટાઇટલ્સ",
      "કેપ્શન્સ",
    ],
    dialog: "accessibility_captions",
  },
  {
    id: "language_region",
    categoryNumber: 9,
    categoryTitle: "Your app & media",
    title: "Language & region",
    titleGu: "ભાષા (Language)",
    description:
      "Display language (English, Gujarati, Hindi, Hinglish, Spanish) & auto-translations",
    descriptionGu:
      "એપની ભાષા (Gujarati / ગુજરાતી, Hindi / हिंदी, English વગેરે) અને ઓટો-ટ્રાન્સલેશન",
    keywords: [
      "language",
      "region",
      "locale",
      "gujarati",
      "hindi",
      "hinglish",
      "spanish",
      "translation",
      "ભાષા",
      "ગુજરાતી",
      "હિન્દી",
      "લેંગ્વેજ",
    ],
    dialog: "language_region",
  },
  {
    id: "data_usage",
    categoryNumber: 9,
    categoryTitle: "Your app & media",
    title: "Data usage and media quality",
    titleGu: "ડેટા વપરાશ અને મીડિયા ક્વોલિટી (Data usage & media quality)",
    description: "Cellular data saver mode, upload at highest quality (4K) & video autoplay",
    descriptionGu:
      "Data Saver Mode (ઓછા ડેટાનો વપરાશ), Upload at highest quality (હાઇ ક્વોલિટી અપલોડિંગ)",
    keywords: [
      "data usage",
      "media quality",
      "data saver",
      "highest quality",
      "4k upload",
      "autoplay",
      "bandwidth",
      "ડેટા સેવર",
      "હાઇ ક્વોલિટી",
    ],
    dialog: "data_usage",
  },

  // 10. Family Center
  {
    id: "supervision",
    categoryNumber: 10,
    categoryTitle: "Family Center",
    title: "Supervision",
    titleGu: "સુપરવિઝન (Supervision / Parental Control)",
    description: "Parental supervision, invite guardian & screen time schedules",
    descriptionGu: "બાળકોના અકાઉન્ટ લિંક કરીને દેખરેખ રાખવી, સ્ક્રીન ટાઇમ લિમિટ્સ અને સેફ્ટી",
    keywords: [
      "supervision",
      "parental",
      "family",
      "guardian",
      "teen safety",
      "screen schedule",
      "પેરેન્ટલ કંટ્રોલ",
      "દેખરેખ",
      "બાળકો",
      "ગાર્ડિયન",
    ],
    dialog: "supervision",
  },
  {
    id: "safety_hub",
    categoryNumber: 10,
    categoryTitle: "Family Center",
    title: "Education & safety hub",
    titleGu: "શિક્ષણ અને સુરક્ષા કેન્દ્ર (Safety Hub)",
    description: "Teen privacy defaults, anti-bullying resources & guardian safety guides",
    descriptionGu: "ટીન પ્રાઇવસી ડિફોલ્ટ્સ, એન્ટિ-બુલિંગ સંસાધનો અને ગાર્ડિયન ગાઇડ્સ",
    keywords: [
      "safety",
      "hub",
      "education",
      "teen privacy",
      "anti-bullying",
      "resources",
      "સુરક્ષા કેન્દ્ર",
      "ગાઇડ્સ",
    ],
    dialog: "safety_hub",
  },

  // 11. Orders & Payments
  {
    id: "payment_methods",
    categoryNumber: 11,
    categoryTitle: "Orders & payments",
    title: "Payment methods",
    titleGu: "પેમેન્ટ પદ્ધતિઓ (Payment methods & Ads payments)",
    description: "Saved cards, UPI, digital wallet & billing details (Server status checked)",
    descriptionGu: "સેવ્ડ કાર્ડ્સ, UPI, ડિજિટલ વૉલેટ, પેમેન્ટ હિસ્ટ્રી અને બિલિંગ ઇન્ફો",
    keywords: [
      "payments",
      "payment methods",
      "cards",
      "upi",
      "billing",
      "wallet",
      "checkout",
      "ads payments",
      "પેમેન્ટ",
      "ક્રેડિટ કાર્ડ",
      "ડેબિટ કાર્ડ",
      "UPI",
      "બિલિંગ",
    ],
    dialog: "payment_methods",
  },
  {
    id: "order_history",
    categoryNumber: 11,
    categoryTitle: "Orders & payments",
    title: "Order history & receipts",
    titleGu: "ઓર્ડર હિસ્ટ્રી અને રસીદો (Order history)",
    description: "Subscription invoices, creator tips, digital gifts & tax receipts",
    descriptionGu: "સબસ્ક્રિપ્શન ઇન્વૉઇસ, ક્રિએટર ટિપ્સ, ડિજિટલ ગિફ્ટ્સ અને ટેક્સ રિસીપ્ટ્સ",
    keywords: [
      "orders",
      "receipts",
      "invoices",
      "history",
      "purchases",
      "creator tips",
      "gifts",
      "ઓર્ડર હિસ્ટ્રી",
      "રસીદ",
      "ઇન્વૉઇસ",
    ],
    dialog: "order_history",
  },
  {
    id: "payouts",
    categoryNumber: 11,
    categoryTitle: "Orders & payments",
    title: "Monetization payouts",
    titleGu: "મોનેટાઇઝેશન પેઆઉટ્સ (Payouts)",
    description: "Creator balance, direct deposit destination, tax forms & payout schedules",
    descriptionGu: "ક્રિએટર બેલેન્સ, ડાયરેક્ટ ડિપોઝિટ, ટેક્સ ફોર્મ્સ અને પેઆઉટ શેડ્યૂલ",
    keywords: [
      "payouts",
      "earnings",
      "balance",
      "direct deposit",
      "tax",
      "revenue",
      "withdraw",
      "પેઆઉટ",
      "બેલેન્સ",
      "કમાણી",
    ],
    dialog: "payouts",
  },

  // 12. More Info & Support
  {
    id: "help_center",
    categoryNumber: 12,
    categoryTitle: "More info & support",
    title: "Help Center & FAQs",
    titleGu: "મદદ કેન્દ્ર (Help Center & Report a problem)",
    description: "Searchable troubleshooting guides, FAQ & report a technical problem",
    descriptionGu:
      "Report a problem (સમસ્યા રિપોર્ટ), Help Center (મદદ કેન્દ્ર), Privacy & Security Help",
    keywords: [
      "help",
      "faqs",
      "support",
      "troubleshooting",
      "report problem",
      "bug report",
      "મદદ",
      "હેલ્પ સેન્ટર",
      "સમસ્યા રિપોર્ટ",
      "ફરિયાદ",
    ],
    dialog: "help_center",
  },
  {
    id: "support_requests",
    categoryNumber: 12,
    categoryTitle: "More info & support",
    title: "Support requests & appeals",
    titleGu: "સપોર્ટ રિક્વેસ્ટ્સ (Support requests)",
    description: "Track submitted reports, content decisions, strikes & policy appeals",
    descriptionGu: "તમે કરેલી ફરિયાદોનું સ્ટેટસ, કન્ટેન્ટ ડિસિશન્સ અને પોલિસી અપીલ્સ",
    keywords: [
      "appeals",
      "tickets",
      "support requests",
      "violations",
      "reports tracking",
      "સપોર્ટ રિક્વેસ્ટ",
      "અપીલ",
    ],
    dialog: "support_requests",
  },
  {
    id: "about_opexnal",
    categoryNumber: 12,
    categoryTitle: "More info & support",
    title: "About Opexnal",
    titleGu: "વિશે (About Opexnal)",
    description: "Platform release v2.5, multimodal architecture & engineering credits",
    descriptionGu: "Privacy Policy, Terms of Use, Open Source Libraries, એપ વર્ઝન v2.5",
    keywords: ["about", "version", "release", "credits", "legal", "opexnal", "વિશે", "વર્ઝન"],
    dialog: "about",
  },
  {
    id: "terms_of_service",
    categoryNumber: 12,
    categoryTitle: "More info & support",
    title: "Terms of Service",
    titleGu: "સેવાની શરતો (Terms of Use)",
    description: "Creator rights, intellectual property ownership & platform terms",
    descriptionGu: "ક્રિએટર રાઇટ્સ, ઇન્ટેલેક્ચ્યુઅલ પ્રોપર્ટી અને પ્લેટફોર્મ શરતો",
    keywords: [
      "terms",
      "tos",
      "conditions",
      "intellectual property",
      "creator rights",
      "contract",
      "શરતો",
      "નિયમો",
    ],
    dialog: "terms",
  },

  // 13. Also from Opexnal
  {
    id: "opexnal_ai_suite",
    categoryNumber: 13,
    categoryTitle: "Also from Opexnal",
    title: "Opexnal AI Suite",
    titleGu: "Opexnal AI સ્યુટ",
    description: "Multimodal generative AI creator engine and smart content studio",
    descriptionGu: "મલ્ટિમોડલ જનરેટિવ AI ક્રિએટર એન્જિન અને સ્માર્ટ કન્ટેન્ટ સ્ટુડિયો",
    keywords: ["ai suite", "gemini", "generative ai", "creator suite", "tools", "એઆઈ સ્યુટ"],
    route: "/ai",
  },
  {
    id: "opexnal_messenger",
    categoryNumber: 13,
    categoryTitle: "Also from Opexnal",
    title: "Opexnal Messenger",
    titleGu: "Opexnal મેસેન્જર",
    description: "Direct encrypted chat, voice notes & real-time messaging",
    descriptionGu: "ડાયરેક્ટ એન્ક્રિપ્ટેડ ચેટ, વૉઇસ નોટ્સ અને રીઅલ-ટાઇમ મેસેજિંગ",
    keywords: [
      "messenger",
      "chat",
      "direct messaging",
      "inbox",
      "conversations",
      "મેસેન્જર",
      "ચેટિંગ",
    ],
    route: "/messages",
  },
  {
    id: "creator_web",
    categoryNumber: 13,
    categoryTitle: "Also from Opexnal",
    title: "Opexnal Studio for Web",
    titleGu: "Opexnal વેબ સ્ટુડિયો",
    description: "Desktop publishing suite, post scheduling, bulk uploads & analytics",
    descriptionGu: "ડેસ્કટોપ પબ્લિશિંગ, પોસ્ટ શેડ્યૂલિંગ, બલ્ક અપલોડ્સ અને એનાલિટિક્સ",
    keywords: [
      "studio",
      "web",
      "desktop",
      "scheduling",
      "bulk upload",
      "publishing",
      "વેબ સ્ટુડિયો",
    ],
    dialog: "creator_web",
  },

  // 14. Account Management & Lifecycle
  {
    id: "download_export_data",
    categoryNumber: 14,
    categoryTitle: "Account management & lifecycle",
    title: "Download your data / Export",
    titleGu: "માહિતી ડાઉનલોડ કરવી (Download your information / Export)",
    description: "Request an archive of your profile, posts, reels, messages & comments",
    descriptionGu: "તમારો ડેટા ડાઉનલોડ કરવો, Access information, Transfer copy અને GDPR આર્કાઇવ",
    keywords: [
      "export",
      "download data",
      "archive data",
      "backup",
      "gdpr",
      "data portability",
      "ડેટા ડાઉનલોડ",
      "એક્સપોર્ટ",
      "માહિતી",
    ],
    dialog: "download_data",
  },
  {
    id: "recently_deleted",
    categoryNumber: 14,
    categoryTitle: "Account management & lifecycle",
    title: "Recently deleted",
    titleGu: "તાજેતરમાં ડિલીટ કરેલું (Recently deleted)",
    description: "Restore posts, reels and stories within 30 days or delete permanently",
    descriptionGu: "30 દિવસની અંદર ડિલીટ કરેલી કન્ટેન્ટ રિકવર કરવી (પોસ્ટ્સ, રીલ્સ, સ્ટોરીઝ)",
    keywords: [
      "recently deleted",
      "restore",
      "trash",
      "recycle bin",
      "permanent deletion",
      "તાજેતરમાં ડિલીટ",
      "રિકવરી",
      "કચરાપેટી",
    ],
    dialog: "recently_deleted",
  },
  {
    id: "deactivate_account",
    categoryNumber: 14,
    categoryTitle: "Account management & lifecycle",
    title: "Account deactivation & deletion",
    titleGu: "અકાઉન્ટ ડિલીટ કે ડીએક્ટિવેટ કરવું (Account ownership & control)",
    description: "Temporarily deactivate or permanently delete your Opexnal profile",
    descriptionGu: "અકાઉન્ટ કામચલાઉ ડીએક્ટિવેટ કે કાયમ માટે ડિલીટ કરવું",
    keywords: [
      "deactivate",
      "delete account",
      "close account",
      "erase data",
      "disable",
      "અકાઉન્ટ ડિલીટ",
      "ડીએક્ટિવેટ",
      "અકાઉન્ટ બંધ",
    ],
    dialog: "deactivate_account",
  },
  {
    id: "login_activity_sessions",
    categoryNumber: 14,
    categoryTitle: "Account management & lifecycle",
    title: "Login activity & active sessions",
    titleGu: "કયા ડિવાઇસમાં લોગિન છે (Where you're logged in / Sessions)",
    description: "Devices logged into your account, IP addresses & revoke session",
    descriptionGu: "સક્રિય ઉપકરણો, લોકેશન, IP એડ્રેસ અને એક ક્લિકમાં સેશન રદ કરવું",
    keywords: [
      "sessions",
      "devices",
      "login activity",
      "revoke session",
      "logout devices",
      "macbook",
      "iphone",
      "કયા ડિવાઇસમાં લોગિન",
      "સેશન",
      "ઉપકરણો",
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
    if (item.titleGu && item.titleGu.toLowerCase().includes(q)) return true;
    if (item.description.toLowerCase().includes(q)) return true;
    if (item.descriptionGu && item.descriptionGu.toLowerCase().includes(q)) return true;
    if (item.categoryTitle.toLowerCase().includes(q)) return true;
    return item.keywords.some((k) => k.toLowerCase().includes(q));
  });
}
