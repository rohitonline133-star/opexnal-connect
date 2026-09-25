import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/**
 * Authoritative Supabase Auth Session Hook.
 *
 * In Production-Grade Security mode:
 * - No fabricated/guest users are returned.
 * - Sessions must be verified by Supabase Auth.
 * - Inactive or expired sessions return user = null.
 */
export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    // Purge any legacy demo bypass keys from storage
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("opexnal_guest_user");
        localStorage.removeItem("guest_user");
      } catch {
        // ignore
      }
    }

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!active) return;
      setSession(next);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem("opexnal_explicit_signout", "true");
          localStorage.removeItem("opexnal_guest_user");
          localStorage.removeItem("guest_user");
        } catch {
          // ignore
        }
      }
      setSession(null);
    }
  };

  return {
    session,
    user: session?.user ?? null,
    loading,
    signOut,
  };
}
