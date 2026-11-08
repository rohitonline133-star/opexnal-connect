/** Searchable Help Center directory for Opexnal. */
export interface HelpTopic { id: string; category: string; title: string; }
const topicRows: Array<Pick<HelpTopic, "category" | "title">> = [
  {
    "category": "Account & Login",
    "title": "Create an account"
  },
  {
    "category": "Account & Login",
    "title": "Sign up with email"
  },
  {
    "category": "Account & Login",
    "title": "Sign up with phone"
  },
  {
    "category": "Account & Login",
    "title": "Verify email address"
  },
  {
    "category": "Account & Login",
    "title": "Verify phone number"
  },
  {
    "category": "Account & Login",
    "title": "Log in"
  },
  {
    "category": "Account & Login",
    "title": "Log out"
  },
  {
    "category": "Account & Login",
    "title": "Forgot password"
  },
  {
    "category": "Account & Login",
    "title": "Reset password"
  },
  {
    "category": "Account & Login",
    "title": "Find username"
  },
  {
    "category": "Account & Login",
    "title": "Recover account"
  },
  {
    "category": "Account & Login",
    "title": "Recover hacked account"
  },
  {
    "category": "Account & Login",
    "title": "Recover disabled account"
  },
  {
    "category": "Account & Login",
    "title": "Two-factor authentication"
  },
  {
    "category": "Account & Login",
    "title": "Login alerts"
  },
  {
    "category": "Profile & Feed",
    "title": "Edit profile"
  },
  {
    "category": "Profile & Feed",
    "title": "Change profile photo"
  },
  {
    "category": "Profile & Feed",
    "title": "Change username"
  },
  {
    "category": "Profile & Feed",
    "title": "Edit bio and links"
  },
  {
    "category": "Profile & Feed",
    "title": "Set profile visibility"
  },
  {
    "category": "Profile & Feed",
    "title": "Manage followers"
  },
  {
    "category": "Profile & Feed",
    "title": "Manage following"
  },
  {
    "category": "Profile & Feed",
    "title": "Follow requests"
  },
  {
    "category": "Profile & Feed",
    "title": "Remove follower"
  },
  {
    "category": "Profile & Feed",
    "title": "Pin profile posts"
  },
  {
    "category": "Profile & Feed",
    "title": "Profile highlights"
  },
  {
    "category": "Profile & Feed",
    "title": "Feed not refreshing"
  },
  {
    "category": "Posts & Reels",
    "title": "Create a photo post"
  },
  {
    "category": "Posts & Reels",
    "title": "Create a carousel"
  },
  {
    "category": "Posts & Reels",
    "title": "Upload a video post"
  },
  {
    "category": "Posts & Reels",
    "title": "Edit a post"
  },
  {
    "category": "Posts & Reels",
    "title": "Delete a post"
  },
  {
    "category": "Posts & Reels",
    "title": "Archive a post"
  },
  {
    "category": "Posts & Reels",
    "title": "Restore an archived post"
  },
  {
    "category": "Posts & Reels",
    "title": "Schedule a post"
  },
  {
    "category": "Posts & Reels",
    "title": "Tag people in a post"
  },
  {
    "category": "Posts & Reels",
    "title": "Add a location"
  },
  {
    "category": "Posts & Reels",
    "title": "Add alternative text"
  },
  {
    "category": "Posts & Reels",
    "title": "Manage comments"
  },
  {
    "category": "Posts & Reels",
    "title": "Create a reel"
  },
  {
    "category": "Posts & Reels",
    "title": "Edit a reel"
  },
  {
    "category": "Stories & Live",
    "title": "Create a story"
  },
  {
    "category": "Stories & Live",
    "title": "Add music to a story"
  },
  {
    "category": "Stories & Live",
    "title": "Use story stickers"
  },
  {
    "category": "Stories & Live",
    "title": "Create a poll or quiz"
  },
  {
    "category": "Stories & Live",
    "title": "Share a link in a story"
  },
  {
    "category": "Stories & Live",
    "title": "Manage close friends"
  },
  {
    "category": "Stories & Live",
    "title": "Hide story from someone"
  },
  {
    "category": "Stories & Live",
    "title": "View story viewers"
  },
  {
    "category": "Stories & Live",
    "title": "Create story highlights"
  },
  {
    "category": "Stories & Live",
    "title": "Start a live broadcast"
  },
  {
    "category": "Messages & Calls",
    "title": "Send a direct message"
  },
  {
    "category": "Messages & Calls",
    "title": "Manage message requests"
  },
  {
    "category": "Messages & Calls",
    "title": "Create a group chat"
  },
  {
    "category": "Messages & Calls",
    "title": "Manage group admins"
  },
  {
    "category": "Messages & Calls",
    "title": "Send a voice message"
  },
  {
    "category": "Messages & Calls",
    "title": "Share photos in chat"
  },
  {
    "category": "Messages & Calls",
    "title": "Unsend a message"
  },
  {
    "category": "Messages & Calls",
    "title": "Edit a message"
  },
  {
    "category": "Messages & Calls",
    "title": "Delete a conversation"
  },
  {
    "category": "Messages & Calls",
    "title": "Make a voice call"
  },
  {
    "category": "Messages & Calls",
    "title": "Make a video call"
  },
  {
    "category": "Messages & Calls",
    "title": "Manage broadcast channels"
  },
  {
    "category": "Privacy & Security",
    "title": "Set account to private"
  },
  {
    "category": "Privacy & Security",
    "title": "Control activity status"
  },
  {
    "category": "Privacy & Security",
    "title": "Control read receipts"
  },
  {
    "category": "Privacy & Security",
    "title": "Manage tags"
  },
  {
    "category": "Privacy & Security",
    "title": "Manage mentions"
  },
  {
    "category": "Privacy & Security",
    "title": "Manage story replies"
  },
  {
    "category": "Privacy & Security",
    "title": "Block an account"
  },
  {
    "category": "Privacy & Security",
    "title": "Restrict an account"
  },
  {
    "category": "Privacy & Security",
    "title": "Mute an account"
  },
  {
    "category": "Privacy & Security",
    "title": "Manage hidden words"
  },
  {
    "category": "Privacy & Security",
    "title": "Filter comments"
  },
  {
    "category": "Privacy & Security",
    "title": "Control sensitive content"
  },
  {
    "category": "Privacy & Security",
    "title": "Review login sessions"
  },
  {
    "category": "Privacy & Security",
    "title": "Change password"
  },
  {
    "category": "Privacy & Security",
    "title": "Manage trusted devices"
  },
  {
    "category": "Safety, Copyright & Appeals",
    "title": "Report an account"
  },
  {
    "category": "Safety, Copyright & Appeals",
    "title": "Report a post"
  },
  {
    "category": "Safety, Copyright & Appeals",
    "title": "Report a reel"
  },
  {
    "category": "Safety, Copyright & Appeals",
    "title": "Report a comment"
  },
  {
    "category": "Safety, Copyright & Appeals",
    "title": "Report a message"
  },
  {
    "category": "Safety, Copyright & Appeals",
    "title": "Report impersonation"
  },
  {
    "category": "Safety, Copyright & Appeals",
    "title": "Report bullying or harassment"
  },
  {
    "category": "Safety, Copyright & Appeals",
    "title": "Report spam"
  },
  {
    "category": "Safety, Copyright & Appeals",
    "title": "Submit a copyright complaint"
  },
  {
    "category": "Safety, Copyright & Appeals",
    "title": "Submit a trademark complaint"
  },
  {
    "category": "Safety, Copyright & Appeals",
    "title": "Respond to a copyright notice"
  },
  {
    "category": "Safety, Copyright & Appeals",
    "title": "Appeal a moderation decision"
  },
  {
    "category": "Creator & Business",
    "title": "Switch to creator account"
  },
  {
    "category": "Creator & Business",
    "title": "Switch to business account"
  },
  {
    "category": "Creator & Business",
    "title": "Use professional dashboard"
  },
  {
    "category": "Creator & Business",
    "title": "View account insights"
  },
  {
    "category": "Creator & Business",
    "title": "View reel insights"
  },
  {
    "category": "Creator & Business",
    "title": "Schedule creator content"
  },
  {
    "category": "Creator & Business",
    "title": "Manage branded content"
  },
  {
    "category": "Creator & Business",
    "title": "Manage partnership labels"
  },
  {
    "category": "Creator & Business",
    "title": "Manage creator marketplace"
  },
  {
    "category": "Creator & Business",
    "title": "Manage subscriptions"
  },
  {
    "category": "Creator & Business",
    "title": "Manage gifts"
  },
  {
    "category": "Creator & Business",
    "title": "Manage monetization eligibility"
  },
  {
    "category": "Payments & Advertising",
    "title": "Manage payment methods"
  },
  {
    "category": "Payments & Advertising",
    "title": "Review purchase history"
  },
  {
    "category": "Payments & Advertising",
    "title": "Manage subscriptions and billing"
  },
  {
    "category": "Payments & Advertising",
    "title": "Request a refund"
  },
  {
    "category": "Payments & Advertising",
    "title": "Manage creator payouts"
  },
  {
    "category": "Payments & Advertising",
    "title": "Create an advertisement"
  },
  {
    "category": "Payments & Advertising",
    "title": "Boost a post"
  },
  {
    "category": "Payments & Advertising",
    "title": "Review ad performance"
  },
  {
    "category": "App & Technical",
    "title": "Change app language"
  },
  {
    "category": "App & Technical",
    "title": "Change appearance theme"
  },
  {
    "category": "App & Technical",
    "title": "Manage accessibility"
  },
  {
    "category": "App & Technical",
    "title": "Enable captions"
  },
  {
    "category": "App & Technical",
    "title": "Manage media quality"
  },
  {
    "category": "App & Technical",
    "title": "Manage data usage"
  },
  {
    "category": "App & Technical",
    "title": "Manage app permissions"
  },
  {
    "category": "App & Technical",
    "title": "Report an app bug"
  },
  {
    "category": "App & Technical",
    "title": "Troubleshoot upload failures"
  },
  {
    "category": "App & Technical",
    "title": "Troubleshoot playback failures"
  },
  {
    "category": "Data, Legal & Support",
    "title": "Download account information"
  },
  {
    "category": "Data, Legal & Support",
    "title": "Transfer account information"
  },
  {
    "category": "Data, Legal & Support",
    "title": "Review account history"
  },
  {
    "category": "Data, Legal & Support",
    "title": "Manage recently deleted content"
  },
  {
    "category": "Data, Legal & Support",
    "title": "Deactivate an account"
  },
  {
    "category": "Data, Legal & Support",
    "title": "Delete an account"
  },
  {
    "category": "Data, Legal & Support",
    "title": "Read community guidelines"
  }
];
export const HELP_TOPICS: HelpTopic[] = topicRows.map((topic, index) => ({
  ...topic,
  id: "help-" + String(index + 1).padStart(3, "0"),
}));
export function searchHelpTopics(query: string): HelpTopic[] {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) return HELP_TOPICS;
  return HELP_TOPICS.filter((topic) => (topic.category + " " + topic.title).toLocaleLowerCase().includes(normalized));
}
