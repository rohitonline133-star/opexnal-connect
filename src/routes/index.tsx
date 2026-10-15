import { useEffect } from "react";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    try {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.user) {
        throw redirect({ to: "/home" });
      } else {
        throw redirect({ to: "/auth", search: { mode: "login" } });
      }
    } catch (err) {
      if (err && typeof err === "object" && "to" in err) {
        throw err;
      }
      throw redirect({ to: "/auth", search: { mode: "login" } });
    }
  },
  head: () => ({
    meta: [
      { title: "Opexnal — Create. Connect. Grow." },
      {
        name: "description",
        content:
          "Opexnal is a global social platform for creators and communities. Share moments, build an audience and grow — privately and securely.",
      },
    ],
  }),
  component: IndexRedirect,
});

function IndexRedirect() {
  const { user, loading } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (user) {
        navigate({ to: "/home", replace: true });
      } else {
        navigate({ to: "/auth", search: { mode: "login" }, replace: true });
      }
    }
  }, [user, loading, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}
