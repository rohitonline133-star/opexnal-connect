import { useEffect, useState } from "react";
import type { AuthSession, AuthUser } from "@/lib/auth-client";
import { authClient } from "@/lib/auth-client";

export type Session =
  | AuthSession
  | {
      access_token: string;
      userId?: string;
      user: { id: string; email?: string; [key: string]: unknown } | null;
    };

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const { data: sub } = authClient.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      setLoading(false);
    });

    authClient.getUser().then(({ data, error }) => {
      if (!active) return;
      if (error || !data.user) {
        setSession(null);
        setLoading(false);
        return;
      }
      void authClient.getSession().then(({ data: sessionData }) => {
        if (!active) return;
        setSession(sessionData.session);
        setLoading(false);
      });
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
