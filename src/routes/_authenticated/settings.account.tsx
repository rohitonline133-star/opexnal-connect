import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { User, Mail, Phone, Calendar, ArrowLeft, Save, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";
import { useSession } from "@/hooks/use-session";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getStoredSettings, updateSettings } from "@/lib/settings-store";

export const Route = createFileRoute("/_authenticated/settings/account")({
  head: () => ({
    meta: [
      { title: "Account Details — Settings — Opexnal" },
      {
        name: "description",
        content: "Manage personal details, contact info, and birth date on Opexnal.",
      },
    ],
  }),
  component: SettingsAccountPage,
});

function SettingsAccountPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { session } = useSession();
  const userId = session?.userId || "user_maya";

  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings", userId],
    queryFn: () => getStoredSettings(userId),
  });

  const [email, setEmail] = useState(
    settings?.email || session?.user?.email || "maya@opexnal.local",
  );
  const [phone, setPhone] = useState(settings?.phone || "+91 98765 43210");
  const [dob, setDob] = useState(settings?.dateOfBirth || "2000-05-15");
  const [recoveryEmail, setRecoveryEmail] = useState(
    settings?.recoveryEmail || "maya.backup@gmail.com",
  );

  const saveMutation = useMutation({
    mutationFn: async () => {
      return updateSettings(userId, {
        email,
        phone,
        dateOfBirth: dob,
        recoveryEmail,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", userId] });
      toast.success("Account information saved successfully.");
    },
    onError: () => {
      toast.error("Failed to update account information.");
    },
  });

  return (
    <AppShell activeTab="profile">
      <div className="min-h-screen bg-black text-white pb-20 max-w-xl mx-auto">
        <ScreenHeader
          title="Account Details"
          showBack
          onBack={() => navigate({ to: "/settings" })}
        />

        <div className="p-4 space-y-6">
          <div className="p-3.5 bg-[#121212] border border-[#262626] rounded-xl flex items-center gap-3 text-xs text-gray-300">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <p>
              Your contact details are encrypted and used for account verification and security
              notifications.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveMutation.mutate();
            }}
            className="space-y-4"
          >
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Primary Email</label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-gray-400">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full h-11 pl-10 pr-4 bg-[#121212] border border-[#262626] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#8B5CF6] transition"
                />
              </div>
            </div>

            {/* Mobile Phone */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Mobile Phone</label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-gray-400">
                  <Phone size={16} />
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 bg-[#121212] border border-[#262626] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#8B5CF6] transition"
                />
              </div>
            </div>

            {/* Date of Birth */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Date of Birth</label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-gray-400">
                  <Calendar size={16} />
                </span>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  required
                  className="w-full h-11 pl-10 pr-4 bg-[#121212] border border-[#262626] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#8B5CF6] transition"
                />
              </div>
              <p className="text-[11px] text-gray-500">
                Used to verify age compliance and provide age-appropriate experiences.
              </p>
            </div>

            {/* Recovery Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Backup Recovery Email</label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-gray-400">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  placeholder="backup@example.com"
                  className="w-full h-11 pl-10 pr-4 bg-[#121212] border border-[#262626] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#8B5CF6] transition"
                />
              </div>
              <p className="text-[11px] text-gray-500">
                Used strictly to verify account ownership if your primary email is compromised.
              </p>
            </div>

            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="w-full h-11 mt-4 bg-gradient-to-r from-[#7C3AED] to-[#9333EA] hover:from-[#6D28D9] hover:to-[#7E22CE] text-white font-semibold text-sm rounded-xl transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saveMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Save Account Information</span>
            </button>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
