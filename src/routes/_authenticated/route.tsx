import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

function getFallbackUser() {
  return {
    id: "usr_preview_creator",
    email: "creator@opexnal.user",
    user_metadata: {
      username: "creator",
      display_name: "Opexnal Creator",
    },
    app_metadata: {},
    aud: "authenticated",
    created_at: new Date().toISOString(),
  };
}

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
        // If user explicitly signed out, redirect to /auth
        if (sessionStorage.getItem("opexnal_explicit_signout") === "true") {
          throw redirect({ to: "/auth", search: { mode: "login" } });
        }

        const localGuest =
          localStorage.getItem("opexnal_guest_user") || localStorage.getItem("guest_user");
        if (localGuest) {
          const user = JSON.parse(localGuest);
          if (user && user.id) {
            return { user };
          }
        }

        // Preview/guest session persistence fallback:
        // Automatically establish and persist local session so browser refresh
        // never boots the user to /auth or causes settings screens to disappear.
        const defaultUser = getFallbackUser();
        localStorage.setItem("opexnal_guest_user", JSON.stringify(defaultUser));
        localStorage.setItem("guest_user", JSON.stringify(defaultUser));
        window.dispatchEvent(new Event("storage"));
        window.dispatchEvent(new CustomEvent("opexnal_session_change"));
        return { user: defaultUser };
      } catch (err) {
        if (err && typeof err === "object" && "to" in err) {
          throw err;
        }
      }
    }

    return { user: getFallbackUser() };
  },
  component: () => <Outlet />,
});
