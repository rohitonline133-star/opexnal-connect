import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";

export const Route = createFileRoute("/_authenticated/create/story")({
  head: () => ({
    meta: [
      { title: "New Story — Opexnal" },
      { name: "description", content: "Share a 24-hour disappearing photo or video story." },
    ],
  }),
  component: CreateStoryRouteComponent,
});

function CreateStoryRouteComponent() {
  const navigate = useNavigate();

  return (
    <AppShell activeTab="create">
      <div className="min-h-screen bg-black text-white pb-20 max-w-xl mx-auto">
        <ScreenHeader title="New Story" showBack onBack={() => navigate({ to: "/create" })} />
        <div className="p-4">
          <p className="text-xs text-gray-400 mb-4">
            Snap photos, record clips, and publish moments that automatically expire after 24 hours.
          </p>
          <button
            type="button"
            onClick={() => navigate({ to: "/stories/new" })}
            className="w-full py-3 bg-[#1e1e1e] hover:bg-[#252525] text-white text-xs font-semibold rounded-xl transition"
          >
            Launch Story Camera
          </button>
        </div>
      </div>
    </AppShell>
  );
}
