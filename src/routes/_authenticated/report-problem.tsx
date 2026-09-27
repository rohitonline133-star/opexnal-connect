import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Bug, Send, Loader2, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";

export const Route = createFileRoute("/_authenticated/report-problem")({
  head: () => ({
    meta: [
      { title: "Report a Problem — Opexnal" },
      {
        name: "description",
        content: "Submit bug reports and technical issues directly to Opexnal engineers.",
      },
    ],
  }),
  component: ReportProblemPage,
});

function ReportProblemPage() {
  const navigate = useNavigate();

  const [category, setCategory] = useState("camera_media");
  const [description, setDescription] = useState("");
  const [includeLogs, setIncludeLogs] = useState(true);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      toast.error("Please describe what went wrong.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      toast.success("Bug report received. Thank you!");
    }, 600);
  };

  return (
    <AppShell activeTab="profile">
      <div className="min-h-screen bg-black text-white pb-20 max-w-xl mx-auto">
        <ScreenHeader title="Report a Problem" showBack onBack={() => navigate({ to: "/help" })} />

        <div className="p-4 space-y-6">
          {submitted ? (
            <div className="text-center py-12 space-y-4">
              <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto" />
              <div>
                <h3 className="text-lg font-bold text-white">Report Submitted!</h3>
                <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                  Our engineering team has received your diagnostics report. Your feedback helps
                  make Opexnal better for everyone.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate({ to: "/help" })}
                className="px-6 py-2.5 bg-[#262626] hover:bg-[#333] text-white text-xs font-semibold rounded-xl transition"
              >
                Back to Help Center
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">Feature or Area</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-11 px-3 bg-[#121212] border border-[#262626] rounded-xl text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
                >
                  <option value="camera_media">Camera, Uploads & Media</option>
                  <option value="messaging">Direct Messaging & Voice</option>
                  <option value="reels">Reels & Video Playback</option>
                  <option value="notifications">Push Notifications</option>
                  <option value="account_login">Account, Login & 2FA</option>
                  <option value="other">Other Technical Issue</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">
                  Briefly Explain What Happened
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What were you doing when the issue occurred? What did you expect to happen?"
                  required
                  className="w-full p-3 bg-[#121212] border border-[#262626] rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#8B5CF6] transition resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="include-logs"
                  checked={includeLogs}
                  onChange={(e) => setIncludeLogs(e.target.checked)}
                  className="w-4 h-4 rounded border-[#333] text-[#8B5CF6] focus:ring-[#8B5CF6] accent-[#8B5CF6]"
                />
                <label htmlFor="include-logs" className="text-xs text-gray-400">
                  Include device diagnostic logs and client version metadata
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-gradient-to-r from-[#7C3AED] to-[#9333EA] text-white font-semibold text-sm rounded-xl transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>Send Bug Report</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </AppShell>
  );
}
