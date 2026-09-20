import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,

  beforeLoad: async () => {
    try {
      const { data, error } = await authClient.getUser();

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
