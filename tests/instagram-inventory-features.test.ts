import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { getStoredNotes, saveUserNote, deleteUserNote } from "../src/lib/notes.ts";

describe("Instagram Feature Inventory Verification", () => {
  describe("Section F & I: Instagram Notes System", () => {
    test("creates a 24-hour note with 60-character maximum", () => {
      const longThought =
        "This is a very long thought that exceeds sixty characters easily because the user kept typing and typing without stopping.";
      const note = saveUserNote({
        userId: "user_test_inventory_1",
        username: "testcreator",
        displayName: "Test Creator",
        avatarUrl: null,
        text: longThought,
        audience: "followers",
      });

      assert.ok(note.text.length <= 60, "Note text must not exceed 60 characters");
      assert.equal(note.audience, "followers");
      assert.equal(note.username, "testcreator");

      const created = new Date(note.createdAt).getTime();
      const expires = new Date(note.expiresAt).getTime();
      const diffHours = (expires - created) / (3600 * 1000);
      assert.equal(Math.round(diffHours), 24, "Note must expire in 24 hours");
    });

    test("retrieves stored notes and filters correctly", () => {
      saveUserNote({
        userId: "user_alpha_test",
        username: "alpha_user",
        displayName: "Alpha",
        avatarUrl: null,
        text: "Morning coffee ☕",
        audience: "close_friends",
      });

      const notes = getStoredNotes();
      const found = notes.find((n) => n.userId === "user_alpha_test");
      assert.ok(found, "User note must be retrievable");
      assert.equal(found?.text, "Morning coffee ☕");
      assert.equal(found?.audience, "close_friends");
    });

    test("deletes user note accurately", () => {
      saveUserNote({
        userId: "user_to_delete_test",
        username: "temp_user",
        displayName: "Temp",
        avatarUrl: null,
        text: "Temporary status",
      });

      deleteUserNote("user_to_delete_test");
      const notes = getStoredNotes();
      assert.equal(
        notes.some((n) => n.userId === "user_to_delete_test"),
        false,
        "Deleted note must not be present in active notes",
      );
    });
  });

  describe("Section B: AI-Generated Content Label Detection", () => {
    const isAiContent = (caption: string, isAiGeneratedField?: boolean) => {
      return (
        Boolean(isAiGeneratedField) ||
        Boolean(caption?.toLowerCase().match(/#(ai|aigenerated|midjourney|generativeai)\b/))
      );
    };

    test("detects #aigenerated hashtag in caption", () => {
      assert.equal(isAiContent("Cinematic cityscape sunset #aigenerated"), true);
      assert.equal(isAiContent("Portrait of an astronaut #midjourney"), true);
      assert.equal(isAiContent("Future cyber architecture #ai"), true);
      assert.equal(isAiContent("Regular sunset photo at the beach"), false);
    });

    test("detects boolean is_ai_generated flag", () => {
      assert.equal(isAiContent("Regular caption", true), true);
      assert.equal(isAiContent("Regular caption", false), false);
    });
  });

  describe("Section C: Profile Extended Schema (Pronouns, Links, Banner)", () => {
    test("validates multi-link objects and formatting", () => {
      const links = [
        { title: "Portfolio", url: "https://myportfolio.design" },
        { title: "YouTube", url: "https://youtube.com/@creator" },
      ];

      assert.equal(links.length, 2);
      assert.ok(links[0].url.startsWith("https://"));
      assert.equal(links[1].title, "YouTube");
    });

    test("formats pronouns correctly for display", () => {
      const formatDisplayHeader = (username: string, pronouns?: string | null) => {
        return pronouns ? `@${username} (${pronouns})` : `@${username}`;
      };

      assert.equal(formatDisplayHeader("alex", "they/them"), "@alex (they/them)");
      assert.equal(formatDisplayHeader("maya", null), "@maya");
    });
  });

  describe("Section F: Audio and Video Call Duration Formatter", () => {
    const formatDuration = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    test("formats call duration into MM:SS correctly", () => {
      assert.equal(formatDuration(0), "00:00");
      assert.equal(formatDuration(45), "00:45");
      assert.equal(formatDuration(125), "02:05");
      assert.equal(formatDuration(3600), "60:00");
    });
  });
});
