import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, Radio } from "lucide-react";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";

export const Route = createFileRoute("/_authenticated/live")({
  head: () => ({
    meta: [
      { title: "Live Streaming — Opexnal" },
      {
        name: "description",
        content: "Live streaming will be available when Opexnal's broadcast service is configured.",
      },
    ],
  }),
  component: LiveStudioPage,
});

function LiveStudioPage() {
  const navigate = useNavigate();

  return (
    <AppShell activeTab="create">
      <div className="min-h-screen bg-black pb-20 text-white">
        <div className="mx-auto max-w-xl">
          <ScreenHeader title="Live Studio" showBack onBack={() => navigate({ to: "/home" })} />
          <div className="space-y-4 p-4">
            <section className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
              <div className="space-y-1">
                <h2 className="text-sm font-semibold">Live streaming is not connected</h2>
                <p className="text-xs leading-5 text-gray-300">
                  Opexnal does not yet have a configured WebRTC or RTMP broadcast service.
                  Starting a local preview would not create a real public livestream, so
                  broadcast controls, viewer counts, chat, and replay statistics are disabled.
                </p>
              </div>
            </section>
            <div className="rounded-2xl border border-[#262626] bg-[#121212] p-4">
              <div className="flex items-center gap-2">
                <Radio className="h-5 w-5 text-gray-400" />
                <h3 className="text-sm font-semibold">What is needed to enable Live?</h3>
              </div>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-xs leading-5 text-gray-400">
                <li>A configured streaming provider and secure broadcast credentials</li>
                <li>Server-created broadcast sessions and audience access checks</li>
                <li>Realtime viewer, comment, moderation, and replay services</li>
              </ul>
            </div>
            <Link
              to="/home"
              className="inline-flex rounded-lg bg-white px-4 py-2.5 text-xs font-semibold text-black"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
