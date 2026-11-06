import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, Radio } from "lucide-react";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";

export const Route = createFileRoute("/_authenticated/live/create")({
  head: () => ({
    meta: [
      { title: "Go Live — Opexnal" },
      {
        name: "description",
        content: "Start a real livestream when Opexnal's broadcast service is configured.",
      },
    ],
  }),
  component: LiveCreatePage,
});

function LiveCreatePage() {
  const navigate = useNavigate();

  return (
    <AppShell activeTab="create">
      <div className="min-h-screen bg-black pb-20 text-white">
        <div className="mx-auto max-w-xl">
          <ScreenHeader title="Go Live" showBack onBack={() => navigate({ to: "/live" })} />
          <div className="space-y-4 p-4">
            <section className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
              <div className="space-y-1">
                <h2 className="text-sm font-semibold">Broadcast setup is unavailable</h2>
                <p className="text-xs leading-5 text-gray-300">
                  A real streaming provider is not connected. This page will not pretend
                  to start a broadcast or collect audience and moderator settings that
                  cannot yet be enforced.
                </p>
              </div>
            </section>
            <div className="rounded-xl border border-[#262626] bg-[#121212] p-4 text-xs leading-5 text-gray-400">
              <Radio className="mb-2 h-5 w-5" />
              When the broadcast service is configured, this page can safely enable
              stream title, audience permissions, moderators, and live controls.
            </div>
            <Link
              to="/live"
              className="inline-flex rounded-lg bg-white px-4 py-2.5 text-xs font-semibold text-black"
            >
              View Live status
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
