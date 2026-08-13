import { createFileRoute } from "@tanstack/react-router";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";
import { ComingSoon } from "@/components/opexnal/coming-soon";

export const Route = createFileRoute("/_authenticated/create")({
  head: () => ({
    meta: [
      { title: "Create a post — Opexnal" },
      { name: "description", content: "Share a photo, video or story with your Opexnal audience." },
      { property: "og:title", content: "Create a post — Opexnal" },
      { property: "og:description", content: "Share a photo, video or story on Opexnal." },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Create,
});

function Create() {
  return (
    <AppShell header={<ScreenHeader title="Create" />}>
      <ComingSoon
        title="Posting opens next"
        body="Photo and video posts, captions, locations and tagging are the next phase of the build."
      />
    </AppShell>
  );
}
