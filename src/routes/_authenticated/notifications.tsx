import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";
import { Heart, MessageCircle, UserPlus, ShieldAlert, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications & Activity — Opexnal" },
      {
        name: "description",
        content: "Stay updated on likes, mentions, messages and security alerts.",
      },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const navigate = useNavigate();

  const notifications = [
    {
      id: "notif_1",
      type: "security",
      title: "New Device Login",
      body: "A session was authenticated from Chrome on macOS in Bengaluru, India.",
      time: "25m ago",
      icon: ShieldAlert,
      iconColor: "text-emerald-400",
    },
    {
      id: "notif_2",
      type: "like",
      title: "Post Interaction",
      body: "alex_design and 4 others liked your post.",
      time: "1h ago",
      icon: Heart,
      iconColor: "text-rose-500",
    },
    {
      id: "notif_3",
      type: "comment",
      title: "New Comment",
      body: "sarah_k: 'Incredible lighting on this shot!'",
      time: "3h ago",
      icon: MessageCircle,
      iconColor: "text-blue-400",
    },
    {
      id: "notif_4",
      type: "follow",
      title: "New Follower",
      body: "rohit_creator started following you.",
      time: "5h ago",
      icon: UserPlus,
      iconColor: "text-[#8B5CF6]",
    },
  ];

  return (
    <AppShell activeTab="activity">
      <div className="min-h-screen bg-black text-white pb-20 max-w-xl mx-auto">
        <ScreenHeader title="Notifications" showBack onBack={() => navigate({ to: "/home" })} />

        <div className="p-4 space-y-3">
          {notifications.map((n) => {
            const Icon = n.icon;
            return (
              <div
                key={n.id}
                className="p-3.5 bg-[#121212] border border-[#262626] rounded-2xl flex items-start gap-3 text-xs"
              >
                <div className={`p-2 rounded-xl bg-[#1e1e1e] ${n.iconColor} shrink-0 mt-0.5`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 space-y-0.5">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-white">{n.title}</span>
                    <span className="text-[10px] text-gray-500">{n.time}</span>
                  </div>
                  <p className="text-gray-300 text-[11px] leading-relaxed">{n.body}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
