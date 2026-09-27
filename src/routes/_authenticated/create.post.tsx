import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";

export const Route = createFileRoute("/_authenticated/create/post")({
  head: () => ({
    meta: [
      { title: "New Post — Opexnal" },
      { name: "description", content: "Create a new photo or carousel post on Opexnal." },
    ],
  }),
  component: CreatePostRouteComponent,
});

function CreatePostRouteComponent() {
  const navigate = useNavigate();

  return (
    <AppShell activeTab="create">
      <div className="min-h-screen bg-black text-white pb-20 max-w-xl mx-auto">
        <ScreenHeader title="New Post" showBack onBack={() => navigate({ to: "/create" })} />
        <div className="p-4">
          <p className="text-xs text-gray-400 mb-4">
            Upload high-resolution images, compose captions, add tags and schedule publishing.
          </p>
          <button
            type="button"
            onClick={() => navigate({ to: "/create" })}
            className="w-full py-3 bg-[#1e1e1e] hover:bg-[#252525] text-white text-xs font-semibold rounded-xl transition"
          >
            Launch Publishing Studio
          </button>
        </div>
      </div>
    </AppShell>
  );
}
