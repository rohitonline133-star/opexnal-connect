import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";
import { StoryTray } from "@/components/opexnal/story-tray";

export const Route = createFileRoute("/_authenticated/stories/")({
  head: () => ({
    meta: [
      { title: "Stories — Opexnal" },
      { name: "description", content: "View active stories from accounts you follow on Opexnal." },
    ],
  }),
  component: StoriesIndexPage,
});

function StoriesIndexPage() {
  const navigate = useNavigate();

  return (
    <AppShell activeTab="home">
      <div className="min-h-screen bg-black text-white pb-20 max-w-xl mx-auto">
        <ScreenHeader title="Stories" showBack onBack={() => navigate({ to: "/home" })} />
        <div className="p-4 space-y-4">
          <StoryTray />
          <p className="text-xs text-gray-400 text-center pt-8">
            Stories automatically expire after 24 hours. Tap an avatar above to view their story
            moments.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
