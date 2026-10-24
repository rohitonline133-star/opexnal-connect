import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { authClient } from "../src/lib/auth-client";
import { supabase } from "../src/integrations/supabase/client";
import {
  getProfileById,
  getProfileByUsername,
  ensureUserProfile,
  SEED_PROFILES,
} from "../src/lib/profile";

describe("Login and Profile Real Authentication Verification", () => {
  test("Constraint 1 & 2: Demo Maya Profile is removed from SEED_PROFILES", () => {
    assert.equal("user_maya" in SEED_PROFILES, false, "user_maya must not exist in SEED_PROFILES");
    assert.equal(
      Object.values(SEED_PROFILES).some((p) => p.username === "maya_codes"),
      false,
      "maya_codes must not exist in SEED_PROFILES",
    );
  });

  test("Constraint 8 & 9: Unauthenticated state returns null user without fake demo session", async () => {
    await authClient.signOut();

    const { data: userData } = await supabase.auth.getUser();
    assert.equal(
      userData.user,
      null,
      "Unauthenticated user must be null, never defaulting to demo Maya",
    );

    const { data: sessionData } = await supabase.auth.getSession();
    assert.equal(sessionData.session, null, "Unauthenticated session must be null");
  });

  test("Constraint 4 & 5: Real Login with user credentials creates genuine Supabase/authClient session", async () => {
    const loginResult = await authClient.signInWithPassword({
      email: "rahul_verma@opexnal.local",
      password: "SecurePassword123!",
    });

    assert.ok(loginResult.data?.session, "Login must yield an active session");
    assert.equal(loginResult.data?.user.username, "rahul_verma");
    assert.equal(loginResult.data?.user.id, "user_rahul_verma");
    assert.notEqual(loginResult.data?.user.id, "user_maya");
    assert.notEqual(loginResult.data?.user.username, "maya_codes");

    // Supabase adapter reflection
    const { data: currentAuth } = await supabase.auth.getUser();
    assert.ok(currentAuth.user, "supabase.auth.getUser must return authenticated user");
    assert.equal(currentAuth.user.id, "user_rahul_verma");
    assert.equal(currentAuth.user.username, "rahul_verma");
  });

  test("Constraint 6 & 7: Authenticated user profile is loaded from database and reflects actual identity", async () => {
    // Persist real user profile
    const profile = await ensureUserProfile({
      id: "user_rahul_verma",
      email: "rahul_verma@opexnal.local",
      username: "rahul_verma",
      displayName: "Rahul Verma",
    });

    assert.equal(profile.id, "user_rahul_verma");
    assert.equal(profile.username, "rahul_verma");
    assert.equal(profile.display_name, "Rahul Verma");
    assert.notEqual(profile.username, "maya_codes");
    assert.notEqual(profile.username, "maya_creates");

    // Query by ID from database
    const fetchedById = await getProfileById("user_rahul_verma");
    assert.ok(fetchedById);
    assert.equal(fetchedById.id, "user_rahul_verma");
    assert.equal(fetchedById.username, "rahul_verma");
    assert.equal(fetchedById.display_name, "Rahul Verma");

    // Query by Username from database
    const fetchedByUsername = await getProfileByUsername("rahul_verma");
    assert.ok(fetchedByUsername);
    assert.equal(fetchedByUsername.id, "user_rahul_verma");
    assert.equal(fetchedByUsername.username, "rahul_verma");
    assert.equal(fetchedByUsername.display_name, "Rahul Verma");
  });

  test("Sign up creates real user with genuine credentials and stores authentic profile", async () => {
    const signupResult = await authClient.signUp({
      email: "priya.kapoor@example.com",
      password: "PriyaStrongPassword2026!",
      options: {
        data: {
          username: "priya_kapoor",
          full_name: "Priya Kapoor",
        },
      },
    });

    assert.ok(signupResult.data?.user);
    assert.equal(signupResult.data.user.username, "priya_kapoor");
    assert.equal(signupResult.data.user.displayName, "Priya Kapoor");

    const profile = await ensureUserProfile(signupResult.data.user);
    assert.equal(profile.username, "priya_kapoor");
    assert.equal(profile.display_name, "Priya Kapoor");
    assert.notEqual(profile.username, "maya_codes");
  });

  test("Cleanup: sign out revokes session and clears user", async () => {
    await authClient.signOut();
    const { data } = await supabase.auth.getUser();
    assert.equal(data.user, null);
  });
});
