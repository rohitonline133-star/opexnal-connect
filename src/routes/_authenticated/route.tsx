import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    try {
      const { data, error } = await supabase.auth.getUser();

      if (!error && data?.user) {
        return { user: data.user };
      }
    } catch {
      // Supabase network error or no active session
    }

    // PRODUCTION SECURITY ENFORCEMENT:
    // Unauthorized access strictly blocked. No fallback user or demo bypass permitted.
    throw redirect({
      to: "/auth",
      search: {
        mode: "login",
        redirect: location.href,
      },
    });
  },
  component: () => <Outlet />,
});
