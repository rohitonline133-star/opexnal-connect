import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    try {
      const { data, error } = await supabase.auth.getUser();

      if (!error && data.user) {
        return { user: data.user };
      }
    } catch {
      // ignore auth check error
    }

    if (typeof window !== "undefined") {
      try {
        const localGuest = localStorage.getItem("opexnal_guest_user");
        if (localGuest) {
          const user = JSON.parse(localGuest);
          if (user && user.id) {
            return { user };
          }
        }
      } catch {
        // ignore parse error
      }
    }

    throw redirect({ to: "/auth", search: { mode: "signup" } });
  },
  component: () => <Outlet />,
});
