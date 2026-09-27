import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { UserX, Shield, Search, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";

export const Route = createFileRoute("/_authenticated/settings/blocked")({
  head: () => ({
    meta: [
      { title: "Blocked Accounts — Settings — Opexnal" },
      { name: "description", content: "Review and manage blocked profiles on Opexnal." },
    ],
  }),
  component: SettingsBlockedPage,
});

function SettingsBlockedPage() {
  const navigate = useNavigate();

  const [blockedUsers, setBlockedUsers] = useState([
    { id: "usr_b_1", username: "spambot_99", name: "Crypto Signals Bot" },
    { id: "usr_b_2", username: "troll_account_44", name: "Anonymous User" },
  ]);

  const handleUnblock = (id: string, username: string) => {
    setBlockedUsers((prev) => prev.filter((u) => u.id !== id));
    toast.success(`Unblocked @${username}`);
  };

  return (
    <AppShell activeTab="profile">
      <div className="min-h-screen bg-black text-white pb-20 max-w-xl mx-auto">
        <ScreenHeader
          title="Blocked Accounts"
          showBack
          onBack={() => navigate({ to: "/settings" })}
        />

        <div className="p-4 space-y-4">
          <p className="text-xs text-gray-400">
            Blocked accounts cannot see your posts, send messages, or tag your profile. They won't
            be notified when you block them.
          </p>

          {blockedUsers.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-xs">
              <UserCheck className="w-8 h-8 mx-auto mb-2 text-gray-600" />
              You haven't blocked any accounts.
            </div>
          ) : (
            <div className="space-y-2">
              {blockedUsers.map((user) => (
                <div
                  key={user.id}
                  className="p-3.5 bg-[#121212] border border-[#262626] rounded-xl flex items-center justify-between"
                >
                  <div>
                    <span className="text-sm font-semibold text-white">@{user.username}</span>
                    <p className="text-xs text-gray-400">{user.name}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUnblock(user.id, user.username)}
                    className="px-3 py-1.5 bg-[#262626] hover:bg-[#333333] text-white text-xs font-semibold rounded-lg transition"
                  >
                    Unblock
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
