import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AlertCircle, Archive, Trash2 } from "lucide-react";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";

export const Route = createFileRoute("/_authenticated/recently-deleted")({
  head: () => ({
    meta: [
      { title: "Recently Deleted — Opexnal" },
      {
        name: "description",
        content: "Information about deleted content and available recovery options on Opexnal.",
      },
    ],
  }),
  component: RecentlyDeletedPage,
});

function RecentlyDeletedPage() {
  const navigate = useNavigate();

  return (
    <AppShell activeTab="profile">
      <div className="min-h-screen bg-black pb-20 text-white">
        <div className="mx-auto max-w-xl">
          <ScreenHeader
            title="Recently Deleted"
            showBack
            onBack={() => navigate({ to: "/settings" })}
          />

          <div className="space-y-4 p-4">
            <section className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
              <div className="space-y-1">
                <h2 className="text-sm font-semibold text-white">
                  Recovery folder is not available yet
                </h2>
                <p className="text-xs leading-5 text-gray-300">
                  Opexnal does not currently keep deleted posts, reels, or stories in a
                  30-day recovery folder. Deleting a post removes it immediately, so
                  this page will not show sample items or offer a restore action that
                  does not work.
                </p>
              </div>
            </section>

            <section className="rounded-xl border border-[#262626] bg-[#121212] p-4">
              <div className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-gray-400" />
                <h2 className="text-sm font-semibold">Before deleting content</h2>
              </div>
              <p className="mt-2 text-xs leading-5 text-gray-400">
                If you want to keep a post without showing it on your profile, use
                Archive instead of Delete. Archived posts can be restored from the
                Archive page.
              </p>
              <Link
                to="/archive"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-black transition hover:bg-gray-200"
              >
                <Archive className="h-4 w-4" />
                Open Archive
              </Link>
            </section>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
