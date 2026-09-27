import { useEffect, useState } from "react";
import type { AuthSession, AuthUser } from "@/lib/auth-client";
import { supabase } from "@/integrations/supabase/client";

export type Session =
  | AuthSession
  | {
      access_token: string;
      user: { id: string; email?: string; [key: string]: unknown } | null;
    };

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;

      setSession(nextSession);
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

  return {
    session,
    user: (session?.user as (AuthUser & { id: string }) | null) ?? null,
    loading,
  };
}
