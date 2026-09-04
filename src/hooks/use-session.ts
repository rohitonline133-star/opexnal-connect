import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

function getFallbackUser(): User {
  return {
    id: "usr_preview_creator",
    email: "creator@opexnal.user",
    user_metadata: {
      username: "creator",
      display_name: "Opexnal Creator",
    },
    app_metadata: {},
    aud: "authenticated",
    created_at: new Date().toISOString(),
  } as unknown as User;
}

function readLocalGuest(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("opexnal_guest_user") || localStorage.getItem("guest_user");
    if (raw) {
      const parsed = JSON.parse(raw) as User;
      if (parsed && parsed.id) return parsed;
    }
    // If not explicitly signed out, provide consistent fallback preview user
    if (sessionStorage.getItem("opexnal_explicit_signout") !== "true") {
      const defaultUser = getFallbackUser();
      try {
        localStorage.setItem("opexnal_guest_user", JSON.stringify(defaultUser));
        localStorage.setItem("guest_user", JSON.stringify(defaultUser));
      } catch {
        // ignore
      }
      return defaultUser;
    }
    return null;
  } catch {
    return null;
  }
}

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [guestUser, setGuestUser] = useState<User | null>(readLocalGuest);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const syncLocal = () => {
      if (!active) return;
      setGuestUser(readLocalGuest());
    };

    window.addEventListener("storage", syncLocal);
    window.addEventListener("opexnal_session_change", syncLocal);

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!active) return;
      setSession(next);
      if (next?.user) {
        setGuestUser(null);
      } else {
        setGuestUser(readLocalGuest());
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      if (data.session?.user) {
        setGuestUser(null);
      } else {
        setGuestUser(readLocalGuest());
      }
      setLoading(false);
    });

    return () => {
      active = false;
      window.removeEventListener("storage", syncLocal);
      window.removeEventListener("opexnal_session_change", syncLocal);
      sub.subscription.unsubscribe();
    };
  }, []);

  const user = session?.user ?? guestUser;

  return { session, user, loading };
}
