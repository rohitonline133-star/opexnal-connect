import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";

export const Route = createFileRoute("/_authenticated/create/reel")({
  head: () => ({
    meta: [
      { title: "New Reel — Opexnal" },
      { name: "description", content: "Create and publish short-form video reels on Opexnal." },
    ],
  }),
  component: CreateReelRouteComponent,
});

function CreateReelRouteComponent() {
  const navigate = useNavigate();

  return (
    <AppShell activeTab="create">
      <div className="min-h-screen bg-black text-white pb-20 max-w-xl mx-auto">
        <ScreenHeader title="New Reel" showBack onBack={() => navigate({ to: "/create" })} />
        <div className="p-4">
          <p className="text-xs text-gray-400 mb-4">
            Upload short-form 9:16 videos, select licensed audio tracks, and add interactive
            stickers.
          </p>
          <button
            type="button"
            onClick={() => navigate({ to: "/create" })}
            className="w-full py-3 bg-[#1e1e1e] hover:bg-[#252525] text-white text-xs font-semibold rounded-xl transition"
          >
            Open Reel Editor
          </button>
        </div>
      </div>
    </AppShell>
  );
}
