import { useEffect, useState } from "react";
import { authClient, AuthUser, AuthSession } from "@/lib/auth-client";

export function useSession() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    // Listen to first-party auth state events
    const { data: sub } = authClient.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      if (nextSession) {
        authClient.getUser().then(({ data }) => {
          if (active) setUser(data.user);
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // Check existing session
    authClient.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      if (data.session) {
        authClient.getUser().then(({ data: uData }) => {
          if (active) setUser(uData.user);
        });
      }
      setLoading(false);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return {
    session,
    user,
    loading,
  };
}
