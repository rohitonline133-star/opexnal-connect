import { createFileRoute } from "@tanstack/react-router";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";
import { ComingSoon } from "@/components/opexnal/coming-soon";
import { OpexnalWordmark } from "@/components/opexnal/logo";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({
    meta: [
      { title: "Home feed — Opexnal" },
      { name: "description", content: "Your Opexnal home feed of stories and posts." },
      { property: "og:title", content: "Home feed — Opexnal" },
      { property: "og:description", content: "Your Opexnal home feed of stories and posts." },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomeFeed,
});

function HomeFeed() {
  return (
    <AppShell header={<ScreenHeader title={<OpexnalWordmark className="text-lg" />} />}>
      <ComingSoon
        title="Your feed is warming up"
        body="Follow people to fill your feed. Posts, stories and reels land in the next build phase."
      />
    </AppShell>
  );
}
