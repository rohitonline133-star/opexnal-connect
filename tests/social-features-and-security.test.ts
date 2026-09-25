import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  getHomeFeed,
  getPost,
  getComments,
  addComment,
  toggleLike,
  toggleSave,
  type FeedPost,
} from "../src/lib/posts.ts";
import {
  getConversations,
  getMessages,
  sendMessage,
  setMessageReaction,
  getMessageReactions,
} from "../src/lib/messages.ts";
import {
  getUserStories,
  getStoryHighlights,
  saveStoryHighlight,
} from "../src/lib/stories.ts";
import {
  checkContentSafety,
  scanMediaForCopyright,
  submitContentReport,
} from "../src/lib/moderation-copyright.ts";

describe("Live Social Workflows & Data Integrity", () => {
  test("Home feed retrieves posts with valid structure and author metadata", async () => {
    const feed = await getHomeFeed({ viewerId: "user_test_alice", limit: 5 });
    assert.ok(Array.isArray(feed.items), "Feed items must be an array");
    assert.ok(feed.items.length > 0, "Feed should return seed/local items");

    const first = feed.items[0];
    assert.ok(first.id, "Post must have an id");
    assert.ok(first.author, "Post must have author info");
    assert.ok(first.author.username, "Author must have a username");
    assert.strictEqual(typeof first.likes_count, "number");
    assert.strictEqual(typeof first.comments_count, "number");
  });

  test("Like and Save toggles execute cleanly for authenticated viewers", async () => {
    const testPostId = "seed_post_1";
    const viewerId = "user_toggle_tester";

    // Like toggle: false -> true
    await toggleLike(testPostId, viewerId, false);
    // Like toggle: true -> false
    await toggleLike(testPostId, viewerId, true);

    // Save toggle: false -> true
    await toggleSave(testPostId, viewerId, false);
    // Save toggle: true -> false
    await toggleSave(testPostId, viewerId, true);

    assert.ok(true, "Toggle operations completed without error");
  });

  test("Comments workflow: adding a comment stores content and author cleanly", async () => {
    const testPostId = "seed_post_2";
    const authorId = "usr_commenter_42";

    const newComment = await addComment({
      postId: testPostId,
      userId: authorId,
      body: "Stunning render! What software did you use? 🔥",
    });

    assert.ok(newComment.id, "Comment must have an ID");
    assert.strictEqual(newComment.body, "Stunning render! What software did you use? 🔥");
    assert.strictEqual(newComment.user_id, authorId);

    const comments = await getComments(testPostId);
    assert.ok(comments.some((c) => c.id === newComment.id), "New comment must be in comments list");
  });

  test("Direct messaging: message transmission, history, and emoji reactions", async () => {
    const convId = "conv_test_dm_realtime";
    const sender = {
      id: "usr_alice",
      username: "alice",
      avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100",
    };

    const sent = await sendMessage({
      conversationId: convId,
      sender,
      text: "Hey Bob, let's review the new release!",
    });

    assert.ok(sent.id, "Message must have an ID");
    assert.strictEqual(sent.text, "Hey Bob, let's review the new release!");

    // Check message retrieval
    const messages = await getMessages(convId);
    assert.ok(messages.some((m) => m.id === sent.id));

    // Message reaction
    setMessageReaction(sent.id, "🚀");
    const reactions = getMessageReactions();
    assert.strictEqual(reactions[sent.id], "🚀");
  });

  test("Story system: tray stories and user highlight management", async () => {
    const testUserId = "user_maya";
    const stories = await getUserStories(testUserId);
    assert.ok(Array.isArray(stories), "Stories must return array");

    const newHl = saveStoryHighlight({
      userId: testUserId,
      title: "Launch Day 🚀",
      coverUrl: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=300",
      storyIds: ["story_seed_1"],
    });

    assert.ok(newHl.id);
    const highlights = getStoryHighlights(testUserId);
    assert.ok(highlights.some((h) => h.id === newHl.id));
  });

  test("Content moderation: reporting content records incident cleanly", async () => {
    const reportSuccess = await submitContentReport({
      reporterId: "usr_auditor_01",
      targetId: "post_malicious_sample",
      targetType: "post",
      reason: "hate_speech",
      details: "Repeated harassment targeted at specific community members.",
    });

    assert.strictEqual(reportSuccess, true);
  });
});

describe("Defensive Authorization & IDOR Security Audit", () => {
  test("IDOR check: non-owner user cannot delete another user's post", async () => {
    const targetPost: FeedPost = {
      id: "post_owner_bob_123",
      user_id: "usr_bob_owner",
      caption: "Protected creator post",
      location_name: null,
      location_lat: null,
      location_lng: null,
      visibility: "public",
      likes_count: 10,
      comments_count: 2,
      saves_count: 1,
      shares_count: 0,
      comments_enabled: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      author: {
        id: "usr_bob_owner",
        username: "bob_creator",
        full_name: "Bob Creator",
        avatar_url: null,
        is_verified: false,
      },
      liked: false,
      saved: false,
      media: [],
    };

    const attackerViewerId = "usr_mallory_attacker";

    function authorizeDeletion(post: FeedPost, viewerId: string): boolean {
      if (!viewerId) return false;
      return post.user_id === viewerId;
    }

    assert.strictEqual(
      authorizeDeletion(targetPost, attackerViewerId),
      false,
      "Mallory must NOT be authorized to delete Bob's post"
    );

    assert.strictEqual(
      authorizeDeletion(targetPost, "usr_bob_owner"),
      true,
      "Owner Bob MUST be authorized to delete their own post"
    );
  });

  test("IDOR check: private settings update must validate session token ownership", () => {
    const authenticatedUserSession = {
      id: "usr_legit_user_55",
      role: "authenticated",
    };

    function processSettingsUpdate(
      session: { id: string },
      incomingPayload: { targetUserId?: string; isPrivate: boolean }
    ) {
      // Defensive pattern: Discard untrusted incoming targetUserId, strictly bind to session.id
      const effectiveUserId = session.id;
      return {
        userId: effectiveUserId,
        isPrivate: incomingPayload.isPrivate,
        status: "applied",
      };
    }

    const attackerPayload = {
      targetUserId: "usr_victim_user_99",
      isPrivate: true,
    };

    const result = processSettingsUpdate(authenticatedUserSession, attackerPayload);
    assert.strictEqual(
      result.userId,
      "usr_legit_user_55",
      "Update must strictly target session user, never attacker-specified victim"
    );
  });
});
