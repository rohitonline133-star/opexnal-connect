import { createFileRoute } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";
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

export function ComingSoon({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col items-center px-8 py-24 text-center">
      <div className="brand-gradient-bg flex h-12 w-12 items-center justify-center rounded-2xl">
        <Sparkles className="h-6 w-6 text-primary-foreground" aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-base font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
