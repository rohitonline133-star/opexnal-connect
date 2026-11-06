import { createFileRoute, Link } from "@tanstack/react-router";
import { Archive, Clock, Radio, Trash2 } from "lucide-react";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/archive")({
  head: () => ({
    meta: [
      { title: "Archive — Opexnal" },
      {
        name: "description",
        content: "Archive availability for Opexnal posts, stories, and live broadcasts.",
      },
    ],
  }),
  component: ArchivePage,
});

function UnavailableItem({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Archive;
  title: string;
  description: string;
}) {
  return (
    <section className="flex gap-3 rounded-xl border border-border bg-card p-4">
      <div className="rounded-lg bg-muted p-2">
        <Icon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
      </div>
      <div className="min-w-0 space-y-1">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </section>
  );
}

function ArchivePage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-5 p-4">
        <ScreenHeader title="Archive & Deleted" />
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Archive className="h-4 w-4" aria-hidden="true" />
            Archive manager is not available yet
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Opexnal can mark a post as archived, but this app version does not yet have a
            verified archive-list and restore API. No sample posts or pretend restore actions
            are shown here.
          </p>
        </div>
        <UnavailableItem
          icon={Archive}
          title="Archived posts"
          description="The archive listing and unarchive workflow are not connected yet."
        />
        <UnavailableItem
          icon={Clock}
          title="Story archive"
          description="Automatic story archiving and story restoration are not connected yet."
        />
        <UnavailableItem
          icon={Radio}
          title="Live archive"
          description="Live broadcast recording and archive storage are not connected yet."
        />
        <UnavailableItem
          icon={Trash2}
          title="Recently deleted"
          description="A recoverable deleted-items area and timed restore workflow are not available. Deleted posts cannot currently be restored."
        />
        <Button asChild variant="outline" className="w-full">
          <Link to="/home">Back to Home</Link>
        </Button>
      </div>
    </AppShell>
  );
}
