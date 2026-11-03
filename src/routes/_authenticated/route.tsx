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

      // getUser() clears the session only when the API confirms that it is
      // invalid/expired. If a session remains, this was an API/network failure,
      // not proof that the user is signed out.
      const {
        data: { session },
      } = await authClient.getSession();
      if (error && session) {
        throw error;
      }
    } catch (error) {
      const {
        data: { session },
      } = await authClient.getSession();

      // Keep the authenticated route in an error state during outages instead
      // of converting a temporary API failure into a false logout.
      if (session) {
        throw error;
      }
    }

    throw redirect({
      to: "/auth",
      search: {
        mode: "login",
      },
    });
  },

  errorComponent: ({ error, reset }) => (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-xl font-semibold">Opexnal account service unavailable</h1>
      <p role="alert" className="max-w-md text-sm text-muted-foreground">
        Your saved session remains intact. Opexnal could not verify your account right now. Check
        your connection and try again.
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
      >
        Retry
      </button>
      <p className="max-w-md text-xs text-muted-foreground">
        {error instanceof Error ? error.message : "The account service could not be reached."}
      </p>
    </main>
  ),

  component: () => <Outlet />,
});
