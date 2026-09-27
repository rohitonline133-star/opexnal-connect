import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Award, ShieldCheck, Tag, Plus } from "lucide-react";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/_authenticated/branded-content")({
  head: () => ({
    meta: [
      { title: "Branded Content Tools — Opexnal" },
      {
        name: "description",
        content: "Manage paid partnership labels and brand collab approvals on Opexnal.",
      },
    ],
  }),
  component: BrandedContentPage,
});

function BrandedContentPage() {
  const navigate = useNavigate();
  const [requireApproval, setRequireApproval] = useState(true);

  return (
    <AppShell activeTab="profile">
      <div className="min-h-screen bg-black text-white pb-20 max-w-xl mx-auto">
        <ScreenHeader
          title="Branded Content"
          showBack
          onBack={() => navigate({ to: "/professional" })}
        />

        <div className="p-4 space-y-6">
          <div className="p-4 bg-gradient-to-r from-purple-950/40 to-black border border-purple-800/50 rounded-2xl flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-purple-400 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-white">Eligible for Paid Partnerships</h4>
              <p className="text-[11px] text-gray-400">
                You can tag sponsor brands in your posts, reels, and stories with the Paid
                Partnership disclosure label.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Tagging Approvals
            </h3>

            <div className="p-4 bg-[#121212] border border-[#262626] rounded-xl flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-sm font-semibold text-white">
                  Manually Approve Brand Partners
                </span>
                <p className="text-xs text-gray-400">
                  Brands must request permission before tagging your account
                </p>
              </div>
              <Switch checked={requireApproval} onCheckedChange={setRequireApproval} />
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
