import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

function readLocalGuest(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("opexnal_guest_user");
    return raw ? (JSON.parse(raw) as User) : null;
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
