import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    try {
      const { data, error } = await supabase.auth.getUser();

      if (!error && data.user) {
        return { user: data.user };
      }
    } catch {
      // Treat authentication errors as unauthenticated.
    }

    throw redirect({
      to: "/auth",
      search: {
        mode: "login",
      },
    });
  },

  component: () => <Outlet />,
});
