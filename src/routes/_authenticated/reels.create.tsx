import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";

export const Route = createFileRoute("/_authenticated/reels/create")({
  head: () => ({
    meta: [
      { title: "Create Reel — Opexnal" },
      { name: "description", content: "Record, edit and upload reels on Opexnal." },
    ],
  }),
  component: ReelsCreatePage,
});

function ReelsCreatePage() {
  const navigate = useNavigate();

  return (
    <AppShell activeTab="reels">
      <div className="min-h-screen bg-black text-white pb-20 max-w-xl mx-auto">
        <ScreenHeader title="Create Reel" showBack onBack={() => navigate({ to: "/reels" })} />
        <div className="p-4 space-y-4">
          <p className="text-xs text-gray-400">
            Publish short video reels with audio, sound sync, text overlays, and interactive
            stickers.
          </p>
          <button
            type="button"
            onClick={() => navigate({ to: "/create" })}
            className="w-full py-3 bg-gradient-to-r from-[#7C3AED] to-[#9333EA] text-white text-xs font-semibold rounded-xl transition shadow-lg"
          >
            Open Creative Studio
          </button>
        </div>
      </div>
    </AppShell>
  );
}
