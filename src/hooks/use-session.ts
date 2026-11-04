import { useEffect, useState } from "react";
import type { AuthSession } from "@/lib/auth-client";
import { authClient } from "@/lib/auth-client";

export type Session = AuthSession;

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

    // Restore the existing session immediately, then verify it with the API.
    // Transient API failures must not make a valid local session appear signed out.
    void authClient
      .getSession()
      .then(async ({ data: initial }) => {
        if (!active) return;
        setSession(initial.session);

        if (!initial.session) {
          setLoading(false);
          return;
        }

        const { data, error } = await authClient.getUser();
        if (!active) return;

        if (data.user) {
          const { data: verified } = await authClient.getSession();
          if (!active) return;
          setSession(verified.session);
        } else if (error) {
          const { data: retained } = await authClient.getSession();
          if (!active) return;
          setSession(retained.session);
        } else {
          setSession(null);
        }
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return {
    session,
    user: session?.user ?? null,
    loading,
  };
}
